"""
Direct client for communicating with the Reconciler Agent without going through Host Agent.
This allows direct interaction with the reconciler for testing and debugging purposes.
"""

import asyncio
import json
import logging
import os
import sys
from typing import Optional, Dict, Any
from pathlib import Path
import aiohttp
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DirectReconcilerClient:
    """Direct client for interacting with the Reconciler Agent via HTTP."""
    
    def __init__(self):
        """Initialize the direct reconciler client."""
        self.base_url = "http://localhost:8081"
        self.session = None
        self.context_id = str(uuid.uuid4())
        
    async def send_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Send a message directly to the reconciler agent via HTTP.
        
        Args:
            message: The message to send to the agent
            context: Optional context data (e.g., transaction details)
            
        Returns:
            The agent's response as a string
        """
        try:
            # Format the message with context if provided
            full_message = message
            if context:
                full_message = f"{message}\n\nContext: {json.dumps(context, indent=2)}"
            
            # Create the A2A JSON-RPC protocol message
            task_id = str(uuid.uuid4())
            message_id = str(uuid.uuid4())
            
            # JSON-RPC format as used by A2A client
            payload = {
                "jsonrpc": "2.0",
                "method": "message/send",
                "id": message_id,
                "params": {
                    "message": {
                        "role": "user",
                        "parts": [{"type": "text", "text": full_message}],
                        "messageId": message_id,
                        "taskId": task_id,
                        "contextId": self.context_id,
                    }
                }
            }
            
            logger.info(f"Sending message to reconciler: {message[:100]}...")
            
            # Send HTTP request to the reconciler agent (A2A uses root path for RPC)
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/",  # A2A default RPC endpoint
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # Handle JSON-RPC response format
                        if "result" in result:
                            task_result = result["result"]
                            
                            # Extract the response from the task result
                            if "artifacts" in task_result and task_result["artifacts"]:
                                artifact = task_result["artifacts"][0]
                                if "parts" in artifact and artifact["parts"]:
                                    text_response = artifact["parts"][0].get("text", "No response text")
                                    logger.info(f"Received response: {text_response[:200]}...")
                                    return text_response
                            
                            # Fallback to returning the whole task result as string
                            return json.dumps(task_result, indent=2)
                        elif "error" in result:
                            # JSON-RPC error response
                            error = result["error"]
                            return f"Error: {error.get('message', 'Unknown error')} (code: {error.get('code', 'N/A')})"
                        else:
                            # Unexpected format
                            return json.dumps(result, indent=2)
                    else:
                        error_text = await response.text()
                        return f"Error: HTTP {response.status} - {error_text}"
                        
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error communicating with reconciler: {e}")
            return f"Connection error: {str(e)}. Make sure the reconciler agent is running on {self.base_url}"
        except Exception as e:
            logger.error(f"Error communicating with reconciler: {e}")
            return f"Error: {str(e)}"
    
    async def retry_transaction(self, transaction_id: str) -> str:
        """
        Convenience method to retry a specific transaction.
        
        Args:
            transaction_id: The ID of the transaction to retry
            
        Returns:
            The agent's response about the retry attempt
        """
        message = f"Please retry the failed transaction with ID: {transaction_id}"
        return await self.send_message(message)
    
    async def check_transaction_status(self, transaction_id: str) -> str:
        """
        Check the status of a transaction.
        
        Args:
            transaction_id: The ID of the transaction to check
            
        Returns:
            The agent's response about the transaction status
        """
        message = f"Please check the status of transaction {transaction_id}"
        return await self.send_message(message)
    
    async def list_agent_capabilities(self) -> str:
        """
        List the capabilities of the reconciler agent.
        
        Returns:
            The agent's capabilities
        """
        message = "What are your capabilities?"
        return await self.send_message(message)


async def interactive_session():
    """Run an interactive chat session with the reconciler agent."""
    client = DirectReconcilerClient()
    
    # Chat history for context
    chat_history = []
    
    # Welcome message
    print("\n" + "="*70)
    print(" " * 15 + "[RECONCILER AGENT CHAT SESSION]")
    print("="*70)
    print("\n[i] Welcome to the Direct Reconciler Agent Chat Interface!")
    print("[*] You can have a natural conversation with the Reconciler Agent.")
    print("\n[?] Quick Commands:")
    print("  - Type 'help' for available commands")
    print("  - Type 'clear' to clear the screen")
    print("  - Type 'history' to see conversation history")
    print("  - Type 'exit' or 'quit' to leave")
    print("\n" + "-"*70 + "\n")
    
    # Initial greeting from agent
    print("[Agent] Hello! I'm the Reconciler Agent. I can help you with:")
    print("   - Retrying failed transactions")
    print("   - Checking transaction statuses")
    print("   - Resolving transaction discrepancies")
    print("   - Escalating issues when needed")
    print("\n   How can I assist you today?\n")
    
    while True:
        try:
            # Get user input with prompt
            user_input = input("[You]: ").strip()
            
            if not user_input:
                continue
                
            # Add to history
            chat_history.append({"role": "user", "message": user_input})
            
            # Handle special commands
            if user_input.lower() in ['exit', 'quit', 'bye', 'goodbye']:
                print("\n[Agent] Thank you for using the Reconciler Agent! Goodbye!\n")
                break
                
            elif user_input.lower() == 'clear':
                # Clear screen (works on most terminals)
                import os
                os.system('cls' if os.name == 'nt' else 'clear')
                print("\n" + "="*70)
                print(" " * 15 + "[RECONCILER AGENT CHAT SESSION]")
                print("="*70 + "\n")
                continue
                
            elif user_input.lower() == 'history':
                print("\n" + "="*50)
                print("[CONVERSATION HISTORY]")
                print("="*50)
                for i, entry in enumerate(chat_history[-10:], 1):  # Show last 10 entries
                    role_prefix = "[You]" if entry["role"] == "user" else "[Agent]"
                    print(f"{i}. {role_prefix} {entry['message'][:100]}...")
                print("="*50 + "\n")
                continue
                
            elif user_input.lower() == 'help':
                print("\n" + "="*50)
                print("[HELP MENU]")
                print("="*50)
                print("\n[?] Quick Commands:")
                print("  retry <txn_id>     - Retry a failed transaction")
                print("  status <txn_id>    - Check transaction status")
                print("  capabilities       - List agent capabilities")
                print("  clear             - Clear the screen")
                print("  history           - Show conversation history")
                print("  exit/quit         - Exit the chat session")
                print("\n[!] Tips:")
                print("  - You can ask questions naturally")
                print("  - Provide transaction IDs for specific queries")
                print("  - Ask about reconciliation processes")
                print("="*50 + "\n")
                continue
                
            # Process shortcuts
            elif user_input.lower().startswith('retry '):
                txn_id = user_input[6:].strip()
                print(f"\n[...] Processing retry request for transaction {txn_id}...")
                response = await client.retry_transaction(txn_id)
                
            elif user_input.lower().startswith('status '):
                txn_id = user_input[7:].strip()
                print(f"\n[?] Checking status for transaction {txn_id}...")
                response = await client.check_transaction_status(txn_id)
                
            elif user_input.lower() in ['capabilities', 'what can you do', 'help me']:
                print("\n[i] Fetching agent capabilities...")
                response = await client.list_agent_capabilities()
                
            else:
                # Regular chat message
                print("\n[...] Thinking...")
                response = await client.send_message(user_input)
            
            # Display response with formatting
            print("\n[Agent]:")
            
            # Format response with indentation
            lines = response.split('\n')
            for line in lines:
                if line.strip():
                    print(f"   {line}")
            print()  # Extra line for spacing
            
            # Add to history
            chat_history.append({"role": "agent", "message": response})
            
        except KeyboardInterrupt:
            print("\n\n[!] Interrupted. Type 'exit' to quit or continue chatting.\n")
        except Exception as e:
            print(f"\n[ERROR] {e}")
            print("   Please try again or type 'help' for assistance.\n")


async def example_usage():
    """Example of how to use the client programmatically."""
    client = DirectReconcilerClient()
    
    # Example 1: List capabilities
    print("\n1. Listing agent capabilities:")
    capabilities = await client.list_agent_capabilities()
    print(f"Response: {capabilities}\n")
    
    # Example 2: Retry a transaction
    print("2. Retrying a failed transaction:")
    retry_response = await client.retry_transaction("TXN_123456")
    print(f"Response: {retry_response}\n")
    
    # Example 3: Send custom message with context
    print("3. Sending custom message with context:")
    context = {
        "transaction_id": "TXN_789012",
        "amount": 5000.00,
        "status": "failed",
        "reason": "Network timeout"
    }
    custom_response = await client.send_message(
        "Please analyze this failed transaction and suggest next steps",
        context=context
    )
    print(f"Response: {custom_response}\n")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Direct Reconciler Agent Client")
    parser.add_argument(
        "--mode",
        choices=["interactive", "example"],
        default="interactive",
        help="Run mode: interactive session or example usage"
    )
    parser.add_argument(
        "--message",
        type=str,
        help="Send a single message and exit"
    )
    parser.add_argument(
        "--retry",
        type=str,
        help="Retry a specific transaction ID and exit"
    )
    
    args = parser.parse_args()
    
    if args.message:
        # Single message mode
        async def send_single():
            client = DirectReconcilerClient()
            response = await client.send_message(args.message)
            print(f"Response: {response}")
        asyncio.run(send_single())
    elif args.retry:
        # Retry transaction mode
        async def retry_single():
            client = DirectReconcilerClient()
            response = await client.retry_transaction(args.retry)
            print(f"Response: {response}")
        asyncio.run(retry_single())
    elif args.mode == "example":
        asyncio.run(example_usage())
    else:
        asyncio.run(interactive_session())


if __name__ == "__main__":
    main()