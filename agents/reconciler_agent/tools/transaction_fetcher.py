"""Tool for fetching transaction details from the database."""

import os
import asyncio
import asyncpg
from decimal import Decimal
from typing import Dict, Any, Optional
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv

load_dotenv()


def convert_to_json_serializable(value: Any) -> Any:
    """Convert PostgreSQL/Python types to JSON-serializable formats."""
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='ignore')
    if value is None:
        return None
    return value


def fetch_transaction_details(
    transaction_id: str,
    user_id: Optional[str] = None,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Fetch full details of a transaction from the database.
    This tool has read-only access to the transactions table.
    
    Args:
        transaction_id: The transaction ID to fetch details for
        user_id: Optional user ID for additional security filtering
        tool_context: The tool context from ADK
    
    Returns:
        Dictionary containing transaction details or error information
    """
    
    if not transaction_id:
        return {
            "status": "error",
            "message": "Transaction ID is required"
        }
    
    # Get user_id from context if not provided and context is available
    if not user_id and tool_context and hasattr(tool_context, 'state'):
        user_id = tool_context.state.get('user_id')
    
    # Get database credentials from environment
    db_config = {
        'database': os.getenv('DB_NAME'),
        'host': os.getenv('DB_HOST'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD')
    }
    
    # Run the async function synchronously
    async def _async_fetch():
        try:
            # Create connection
            conn = await asyncpg.connect(**db_config)
            
            # Build the query to fetch transaction details
            query = """
                SELECT 
                    transaction_id,
                    user_id,
                    amount,
                    transaction_type,
                    recipient_type,
                    recipient_account_id,
                    recipient_bank_name_or_ewallet,
                    device_id,
                    location_coordinates,
                    timestamp_initiated,
                    status_1,
                    status_timestamp_1,
                    status_2,
                    status_timestamp_2,
                    status_3,
                    status_timestamp_3,
                    status_4,
                    status_timestamp_4,
                    expected_completion_time,
                    simulated_network_latency,
                    is_floating_cash,
                    floating_duration_minutes,
                    is_fraudulent_attempt,
                    is_cancellation,
                    is_retry_successful,
                    manual_escalation_needed
                FROM transactions
                WHERE transaction_id = $1
            """
            
            # If user_id is provided, add it as an additional security filter
            if user_id:
                query += " AND user_id = $2"
                row = await conn.fetchrow(query, transaction_id, user_id)
            else:
                row = await conn.fetchrow(query, transaction_id)
            
            await conn.close()
            
            if not row:
                return {
                    "status": "not_found",
                    "message": f"Transaction {transaction_id} not found"
                }
            
            # Convert row to dictionary with JSON-serializable values
            transaction = {}
            for key, value in dict(row).items():
                transaction[key] = convert_to_json_serializable(value)
            
            # Check if there are already retries for this transaction
            conn = await asyncpg.connect(**db_config)
            retry_count_query = """
                SELECT COUNT(*) as retry_count
                FROM transactions
                WHERE transaction_id LIKE 'RT%_' || $1
            """
            retry_result = await conn.fetchrow(retry_count_query, transaction_id)
            await conn.close()
            
            retry_count = retry_result['retry_count'] if retry_result else 0
            
            return {
                "status": "success",
                "transaction": transaction,
                "retry_count": retry_count,
                "is_discrepancy": transaction.get('is_floating_cash', False),
                "needs_retry": transaction.get('is_floating_cash', False) and not transaction.get('is_retry_successful', False)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to fetch transaction details: {str(e)}"
            }
    
    # Execute the async function
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create a new thread to run the async function
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _async_fetch())
                return future.result()
        else:
            return loop.run_until_complete(_async_fetch())
    except RuntimeError:
        # Fallback for when no event loop exists
        return asyncio.run(_async_fetch())