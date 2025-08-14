"""Tool for listing the Reconciler Agent's capabilities and sub-agents."""

from typing import Dict, Any
from google.adk.tools.tool_context import ToolContext


def list_capabilities(tool_context: ToolContext) -> Dict[str, Any]:
    """
    Lists the Reconciler Agent's available capabilities and sub-agents.
    
    Returns:
        Dictionary containing available tools and sub-agents
    """
    
    capabilities = {
        "agent_name": "Reconciler Agent",
        "description": "Automated agent for resolving transaction discrepancies",
        "available_tools": [
            {
                "name": "fetch_transaction_details",
                "description": "Retrieves full transaction details using transaction ID"
            },
            {
                "name": "retry_transaction_tool", 
                "description": "Attempts to retry failed transactions (max 2 attempts)"
            },
            {
                "name": "list_capabilities",
                "description": "Lists available capabilities and sub-agents"
            }
        ],
        "available_sub_agents": [
            {
                "name": "escalator_agent",
                "description": "Creates comprehensive reports for human review when automated resolution fails",
                "triggers": [
                    "Retry limit reached (2 attempts)",
                    "Complex issues requiring manual intervention",
                    "Transactions needing operations team review"
                ]
            }
        ],
        "retry_policy": {
            "max_attempts": 2,
            "retry_id_format": "RT<attempt_number>_<original_transaction_id>"
        },
        "escalation_conditions": [
            "After 2 failed retry attempts",
            "Network errors persisting after retries",
            "Manual escalation requested"
        ]
    }
    
    return capabilities