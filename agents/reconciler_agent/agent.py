import json
from typing import Dict, Any, Optional
from google.adk.agents import LlmAgent
from google.adk.tools.tool_context import ToolContext
try:
    # Try relative imports first (when imported as a module)
    from .prompt import get_reconciler_prompt
    from .tools.transaction_fetcher import fetch_transaction_details
    from .tools.retry_transaction import retry_transaction_tool
    from .sub_agents.escalator_agent.agent import escalator_agent
except ImportError:
    # Fall back to absolute imports (when run directly)
    from prompt import get_reconciler_prompt
    from tools.transaction_fetcher import fetch_transaction_details
    from tools.retry_transaction import retry_transaction_tool
    from sub_agents.escalator_agent.agent import escalator_agent


class ReconcilerAgent:
    """Reconciler Agent for automated transaction discrepancy resolution."""
    
    def __init__(self):
        self.agent = self.create_agent()
        self.retry_counts: Dict[str, int] = {}  # Track retry attempts per transaction
    
    def create_agent(self) -> LlmAgent:
        """Create the ADK agent instance."""
        return LlmAgent(
            model="gemini-2.5-flash",
            name="Reconciler_Agent",
            instruction=get_reconciler_prompt(),
            tools=[
                fetch_transaction_details,
                retry_transaction_tool,
            ],
            sub_agents=[
                escalator_agent,
            ],
        )
    
    def get_agent(self) -> LlmAgent:
        """Get the ADK agent instance."""
        return self.agent