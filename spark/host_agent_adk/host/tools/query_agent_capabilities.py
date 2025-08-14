"""Tool for querying remote agent capabilities."""

from typing import Dict, Any
from google.adk.tools.tool_context import ToolContext


async def query_agent_capabilities(
    agent_name: str,
    tool_context: ToolContext
) -> Dict[str, Any]:
    """
    Query a remote agent for its available capabilities and sub-agents.
    
    Args:
        agent_name: Name of the agent to query (e.g., "Reconciler Agent")
        tool_context: The tool context
    
    Returns:
        Dictionary containing the agent's capabilities
    """
    # This will be handled by the agent itself using send_message_to_remote_agent
    # This is just a placeholder for the tool definition
    return {
        "message": f"Use send_message_to_remote_agent with message 'What are your available capabilities and sub-agents?' to query {agent_name}"
    }