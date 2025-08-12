import os
import asyncio
import asyncpg
import random
from decimal import Decimal
from typing import Dict, Any, List, Optional
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv
try:
    import nest_asyncio
except ImportError:
    nest_asyncio = None

load_dotenv()

# Global constant for development
DUMMY_USER_ID = "user_1"


def convert_to_json_serializable(value: Any) -> Any:
    """
    Convert PostgreSQL/Python types to JSON-serializable formats.
    
    Args:
        value: The value to convert
    
    Returns:
        JSON-serializable version of the value
    """
    # Handle Decimal type
    if isinstance(value, Decimal):
        # Convert to float for JSON serialization
        # Use string if you need exact precision
        return float(value)
    
    # Handle datetime objects
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    
    # Handle bytes
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='ignore')
    
    # Handle other potential PostgreSQL types
    if value is None:
        return None
    
    # Return as-is for standard JSON-serializable types
    return value

def query_user_transactions(
    user_id: str,
    limit: Optional[int] = None,
    tool_context: Optional[ToolContext] = None
) -> List[Dict[str, Any]]:
    """
    Query transactions for a specific user from the database.
    CRITICALLY SANDBOXED: Can ONLY query transactions where user_id matches the provided user_id.
    
    Args:
        user_id: The user ID to query transactions for
        limit: Optional limit on number of transactions to return
        tool_context: The tool context from ADK
    
    Returns:
        List of transaction dictionaries
    """
    
    # CRITICAL SECURITY CHECK: Ensure we only query for the authorized user
    if not user_id:
        raise ValueError("User ID is required for transaction queries")
    
    # Get database credentials from environment
    db_config = {
        'database': os.getenv('DB_NAME'),
        'host': os.getenv('DB_HOST'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD')
    }
    
    # Run the async function synchronously
    async def _async_query():
        try:
            # Create connection
            conn = await asyncpg.connect(**db_config)
            
            # Build the query - STRICTLY filtered by user_id
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
                WHERE user_id = $1
                ORDER BY timestamp_initiated DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            # Execute query with user_id parameter
            rows = await conn.fetch(query, user_id)
            
            # Convert rows to dictionaries
            transactions = []
            for row in rows:
                transaction = {}
                # Convert all values to JSON-serializable formats
                for key, value in dict(row).items():
                    transaction[key] = convert_to_json_serializable(value)
                transactions.append(transaction)
            
            await conn.close()
            
            return transactions
            
        except Exception as e:
            print(f"Database query error: {str(e)}")
            raise Exception(f"Failed to query transactions: {str(e)}")
    
    # Execute the async function
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If there's already a running loop, use nest_asyncio if available
            if nest_asyncio:
                nest_asyncio.apply()
                return asyncio.run(_async_query())
            else:
                # Create a new thread to run the async function
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, _async_query())
                    return future.result()
        else:
            return loop.run_until_complete(_async_query())
    except RuntimeError:
        # Fallback for when no event loop exists
        return asyncio.run(_async_query())


def run_discrepancy_check(
    transaction_id: str,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Run a discrepancy check on a specific transaction.
    This is a BOILERPLATE function that simulates an ML model detection.
    
    Args:
        transaction_id: The transaction ID to check
        tool_context: The tool context from ADK
    
    Returns:
        Dictionary with discrepancy detection results
    """
    
    # Get the current user_id from context or use dummy
    user_id = DUMMY_USER_ID
    if tool_context and hasattr(tool_context, 'state'):
        user_id = tool_context.state.get('user_id', DUMMY_USER_ID)
    
    # First, fetch the transaction details using the sandboxed query
    transactions = query_user_transactions(user_id, limit=100, tool_context=tool_context)
    
    # Find the specific transaction
    transaction = None
    for txn in transactions:
        if txn['transaction_id'] == transaction_id:
            transaction = txn
            break
    
    if not transaction:
        return {
            "status": "error",
            "message": f"Transaction {transaction_id} not found for user {user_id}",
            "is_floating_cash": False
        }
    
    # Analyze transaction for discrepancies based on actual status fields
    # Check if transaction has indicators of floating cash or issues
    is_discrepancy = False
    discrepancy_reasons = []
    
    # Check if already marked as floating cash
    if transaction.get('is_floating_cash'):
        is_discrepancy = True
        discrepancy_reasons.append("Transaction already flagged as floating cash")
    
    # Check for failed status indicators
    if transaction.get('status_1') == 'failed' or transaction.get('status_2') == 'failed':
        is_discrepancy = True
        discrepancy_reasons.append("Transaction has failed status")
    
    # Check for network errors
    if 'network' in str(transaction.get('status_1', '')).lower() or 'network' in str(transaction.get('status_2', '')).lower():
        is_discrepancy = True
        discrepancy_reasons.append("Network error detected")
    
    # Check if manual escalation is needed
    if transaction.get('manual_escalation_needed'):
        is_discrepancy = True
        discrepancy_reasons.append("Manual escalation required")
    
    # Check for cancellation or fraud attempts
    if transaction.get('is_fraudulent_attempt'):
        is_discrepancy = True
        discrepancy_reasons.append("Fraudulent transaction attempt detected")
    
    if transaction.get('is_cancellation'):
        is_discrepancy = True
        discrepancy_reasons.append("Transaction was cancelled")
    
    # If discrepancy detected, update the database
    if is_discrepancy:
        async def _async_update():
            try:
                db_config = {
                    'database': os.getenv('DB_NAME'),
                    'host': os.getenv('DB_HOST'),
                    'port': int(os.getenv('DB_PORT', 5432)),
                    'user': os.getenv('DB_USER'),
                    'password': os.getenv('DB_PASSWORD')
                }
                
                conn = await asyncpg.connect(**db_config)
                
                # Update the transaction's floating cash status
                update_query = """
                    UPDATE transactions 
                    SET is_floating_cash = $1,
                        floating_duration_minutes = $2
                    WHERE transaction_id = $3 AND user_id = $4
                """
                
                # Simulate floating duration
                floating_duration = random.randint(5, 120)
                
                await conn.execute(
                    update_query, 
                    True, 
                    floating_duration,
                    transaction_id,
                    user_id
                )
                
                await conn.close()
                
            except Exception as e:
                print(f"Failed to update transaction status: {str(e)}")
        
        # Execute the async update
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                if nest_asyncio:
                    nest_asyncio.apply()
                    asyncio.run(_async_update())
                else:
                    # Create a new thread to run the async function
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(asyncio.run, _async_update())
                        future.result()
            else:
                loop.run_until_complete(_async_update())
        except RuntimeError:
            asyncio.run(_async_update())
    
    # Return the detection result with detailed analysis
    return {
        "status": "completed",
        "transaction_id": transaction_id,
        "is_floating_cash": is_discrepancy,
        "discrepancy_reasons": discrepancy_reasons if is_discrepancy else [],
        "confidence": 0.95 if is_discrepancy and discrepancy_reasons else 0.1,
        "detection_method": "status_field_analysis",
        "transaction_details": {
            "amount": convert_to_json_serializable(transaction['amount']),
            "type": transaction['transaction_type'],
            "recipient": transaction['recipient_account_id'],
            "timestamp": transaction['timestamp_initiated'],
            "current_status": transaction.get('status_1', 'unknown'),
            "is_floating_cash_flag": transaction.get('is_floating_cash', False),
            "floating_duration_minutes": transaction.get('floating_duration_minutes', 0)
        },
        "recommendation": "escalate_to_reconciler" if is_discrepancy else "no_action_needed",
        "analysis_summary": "; ".join(discrepancy_reasons) if discrepancy_reasons else "No discrepancies detected"
    }