import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, AsyncIterable, List, Optional, Dict

import httpx
import nest_asyncio
from a2a.client import A2ACardResolver
from a2a.types import (
    AgentCard,
    MessageSendParams,
    SendMessageRequest,
    SendMessageResponse,
    SendMessageSuccessResponse,
    Task,
)
from dotenv import load_dotenv
from google.adk import Agent
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.tool_context import ToolContext
from google.genai import types

from .tools.database_tools import query_user_transactions, run_discrepancy_check, DUMMY_USER_ID
from .remote_agent_connection import RemoteAgentConnections
from .prompt import get_spark_prompt

load_dotenv()
nest_asyncio.apply()

# Remote agent URLs (placeholders for now)
RECONCILER_AGENT_URL = "http://localhost:10005"  # Placeholder
ESCALATOR_AGENT_URL = "http://localhost:10006"   # Placeholder


class HostAgent:
    """The SPARK Host Agent for BPI transaction discrepancy resolution."""

    def __init__(self):
        self.remote_agent_connections: dict[str, RemoteAgentConnections] = {}
        self.cards: dict[str, AgentCard] = {}
        self.agents: str = ""
        self._agent = self.create_agent()
        self._user_id = DUMMY_USER_ID  # Using the dummy user for development
        self._runner = Runner(
            app_name=self._agent.name,
            agent=self._agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )
        self._active_discrepancies: Dict[str, Dict[str, Any]] = {}  # Track active discrepancy cases

    async def _async_init_components(self, remote_agent_addresses: List[str]):
        """Initialize connections to remote agents."""
        async with httpx.AsyncClient(timeout=30) as client:
            for address in remote_agent_addresses:
                card_resolver = A2ACardResolver(client, address)
                try:
                    card = await card_resolver.get_agent_card()
                    remote_connection = RemoteAgentConnections(
                        agent_card=card, agent_url=address
                    )
                    self.remote_agent_connections[card.name] = remote_connection
                    self.cards[card.name] = card
                except httpx.ConnectError as e:
                    print(f"INFO: Remote agent at {address} not available: {e}")
                except Exception as e:
                    print(f"INFO: Could not connect to {address}: {e}")

        agent_info = [
            json.dumps({"name": card.name, "description": card.description})
            for card in self.cards.values()
        ]
        self.agents = "\n".join(agent_info) if agent_info else "No remote agents connected"

    @classmethod
    async def create(
        cls,
        remote_agent_addresses: Optional[List[str]] = None,
    ):
        """Create and initialize the Host Agent."""
        instance = cls()
        if remote_agent_addresses:
            await instance._async_init_components(remote_agent_addresses)
        return instance

    def create_agent(self) -> Agent:
        """Create the ADK Agent instance."""
        return Agent(
            model="gemini-2.5-flash",
            name="SPARK_Host_Agent",
            instruction=self.root_instruction,
            description="SPARK Host Agent - AI-powered support for BPI transaction discrepancy resolution",
            tools=[
                query_user_transactions,
                run_discrepancy_check,
                self.send_message_to_remote_agent,
                self.get_transaction_status,
            ],
        )

    def root_instruction(self, context: ReadonlyContext) -> str:
        """Get the system prompt for the agent."""
        return get_spark_prompt(
            user_id=self._user_id,
            available_agents=self.agents,
            current_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

    async def stream(
        self, 
        query: str, 
        session_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AsyncIterable[dict[str, Any]]:
        """
        Stream the agent's response to a given query.
        
        Args:
            query: The user's query or system trigger message
            session_id: The session ID for this conversation
            metadata: Optional metadata (e.g., for system-triggered sessions)
        """
        # Check if this is a system-triggered session
        if metadata and metadata.get('trigger_type') == 'discrepancy_detected':
            transaction_id = metadata.get('transaction_id')
            if transaction_id:
                # Store the discrepancy information
                self._active_discrepancies[session_id] = {
                    'transaction_id': transaction_id,
                    'detected_at': datetime.now().isoformat(),
                    'status': 'pending_user_response'
                }
                
                # Modify the query to include context about the discrepancy
                query = f"""SYSTEM ALERT: A potential discrepancy has been detected for transaction {transaction_id}. 
                Please proactively reach out to the user and help resolve this issue. 
                Start by greeting them warmly and explaining why you're contacting them."""

        # Get or create session
        session = await self._runner.session_service.get_session(
            app_name=self._agent.name,
            user_id=self._user_id,
            session_id=session_id,
        )
        
        if session is None:
            # Create new session with initial state
            initial_state: Dict[str, Any] = {
                'user_id': self._user_id,
                'session_started': datetime.now().isoformat()
            }
            if metadata:
                initial_state['metadata'] = metadata
                
            session = await self._runner.session_service.create_session(
                app_name=self._agent.name,
                user_id=self._user_id,
                state=initial_state,
                session_id=session_id,
            )
        
        # Create user message
        content = types.Content(role="user", parts=[types.Part.from_text(text=query)])
        
        # Stream the response
        async for event in self._runner.run_async(
            user_id=self._user_id, 
            session_id=session.id, 
            new_message=content
        ):
            if event.is_final_response():
                response = ""
                if (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                ):
                    response = "\n".join(
                        [p.text for p in event.content.parts if p.text]
                    )
                yield {
                    "is_task_complete": True,
                    "content": response,
                }
            else:
                yield {
                    "is_task_complete": False,
                    "updates": "SPARK is analyzing your transaction...",
                }

    async def send_message_to_remote_agent(
        self, 
        agent_name: str, 
        task: str, 
        tool_context: ToolContext
    ):
        """Send a task to a remote agent (Reconciler or Escalator)."""
        if agent_name not in self.remote_agent_connections:
            return f"Remote agent {agent_name} is not currently available. Task logged for manual processing."
        
        client = self.remote_agent_connections[agent_name]
        
        if not client:
            return f"Connection to {agent_name} is not available."

        # Generate IDs for the message
        state = tool_context.state
        task_id = state.get("task_id", str(uuid.uuid4()))
        context_id = state.get("context_id", str(uuid.uuid4()))
        message_id = str(uuid.uuid4())

        payload = {
            "message": {
                "role": "user",
                "parts": [{"type": "text", "text": task}],
                "messageId": message_id,
                "taskId": task_id,
                "contextId": context_id,
            },
        }

        message_request = SendMessageRequest(
            id=message_id, params=MessageSendParams.model_validate(payload)
        )
        
        try:
            send_response: SendMessageResponse = await client.send_message(message_request)
            
            if not isinstance(
                send_response.root, SendMessageSuccessResponse
            ) or not isinstance(send_response.root.result, Task):
                return "Received unexpected response from remote agent."

            response_content = send_response.root.model_dump_json(exclude_none=True)
            json_content = json.loads(response_content)

            resp = []
            if json_content.get("result", {}).get("artifacts"):
                for artifact in json_content["result"]["artifacts"]:
                    if artifact.get("parts"):
                        resp.extend(artifact["parts"])
            return resp
            
        except Exception as e:
            return f"Error communicating with {agent_name}: {str(e)}"

    async def get_transaction_status(
        self,
        transaction_id: str,
        tool_context: ToolContext
    ) -> Dict[str, Any]:
        """Get the current status of a transaction."""
        # Query the transaction from database (now synchronous)
        transactions = query_user_transactions(
            user_id=self._user_id,
            limit=100,
            tool_context=tool_context
        )
        
        for txn in transactions:
            if txn['transaction_id'] == transaction_id:
                return {
                    "found": True,
                    "transaction": txn,
                    "is_floating_cash": txn.get('is_floating_cash', False),
                    "status": "resolved" if not txn.get('is_floating_cash') else "pending_resolution"
                }
        
        return {
            "found": False,
            "message": f"Transaction {transaction_id} not found"
        }

    async def trigger_discrepancy_alert(
        self,
        transaction_id: str,
        session_id: Optional[str] = None
    ) -> str:
        """
        Trigger a proactive discrepancy alert for a specific transaction.
        This simulates the external Discrepancy Detector triggering a session.
        
        Args:
            transaction_id: The transaction ID with a detected discrepancy
            session_id: Optional session ID, will generate if not provided
        
        Returns:
            The session ID for the triggered alert
        """
        if not session_id:
            session_id = f"system_triggered_{uuid.uuid4()}"
        
        # Create metadata for system-triggered session
        metadata = {
            "trigger_type": "discrepancy_detected",
            "transaction_id": transaction_id,
            "status": "discrepancy_detected",
            "triggered_at": datetime.now().isoformat()
        }
        
        # Start streaming conversation with system trigger
        print(f"[SYSTEM] Triggering discrepancy alert for transaction {transaction_id}")
        print(f"[SYSTEM] Session ID: {session_id}")
        
        return session_id


def _get_initialized_host_agent_sync():
    """Synchronously creates and initializes the HostAgent."""

    async def _async_main():
        # Remote agent URLs (these are placeholders for now)
        remote_agent_urls = [
            RECONCILER_AGENT_URL,
            ESCALATOR_AGENT_URL,
        ]

        print("Initializing SPARK Host Agent...")
        host_agent_instance = await HostAgent.create(
            remote_agent_addresses=remote_agent_urls
        )
        print("SPARK Host Agent initialized successfully")
        return host_agent_instance._agent

    try:
        return asyncio.run(_async_main())
    except RuntimeError as e:
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print(
                f"Warning: Could not initialize HostAgent with asyncio.run(): {e}. "
                "This can happen if an event loop is already running (e.g., in Jupyter). "
                "Consider initializing HostAgent within an async function in your application."
            )
        else:
            raise


# Initialize the root agent
root_agent = _get_initialized_host_agent_sync()