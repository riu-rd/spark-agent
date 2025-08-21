"""Tool for retrying failed transactions to resolve discrepancies."""

import os
import asyncio
import asyncpg
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv

load_dotenv()


def retry_transaction_tool(
    transaction_id: str,
    user_id: Optional[str] = None,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Retry a failed transaction by creating a new transaction record.
    This tool enforces a retry limit of 2 attempts per original transaction.
    
    Args:
        transaction_id: The original transaction ID to retry
        user_id: Optional user ID (will be fetched from transaction if not provided)
        tool_context: The tool context from ADK
    
    Returns:
        Dictionary containing retry status and new transaction ID if successful
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
    async def _async_retry():
        conn = None
        try:
            # Create connection
            conn = await asyncpg.connect(**db_config)
            
            # Start a transaction for atomicity
            async with conn.transaction():
                # First, fetch the original transaction details
                fetch_query = """
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
                        is_floating_cash,
                        is_retry_successful
                    FROM transactions
                    WHERE transaction_id = $1
                """
                
                if user_id:
                    fetch_query += " AND user_id = $2"
                    original_txn = await conn.fetchrow(fetch_query, transaction_id, user_id)
                else:
                    original_txn = await conn.fetchrow(fetch_query, transaction_id)
                
                if not original_txn:
                    return {
                        "status": "error",
                        "message": f"Original transaction {transaction_id} not found"
                    }
                
                # Check if this is a discrepancy case (is_floating_cash = true)
                if not original_txn['is_floating_cash']:
                    return {
                        "status": "no_discrepancy",
                        "message": f"Transaction {transaction_id} has no discrepancy to resolve"
                    }
                
                # Check if already successfully retried
                if original_txn['is_retry_successful']:
                    return {
                        "status": "already_resolved",
                        "message": f"Transaction {transaction_id} has already been successfully retried"
                    }
                
                # Check retry count (max 2 retries)
                retry_count_query = """
                    SELECT COUNT(*) as retry_count
                    FROM transactions
                    WHERE transaction_id LIKE 'RT%_' || $1
                """
                retry_result = await conn.fetchrow(retry_count_query, transaction_id)
                retry_count = retry_result['retry_count'] if retry_result else 0
                
                if retry_count >= 2:
                    return {
                        "status": "limit_reached",
                        "message": f"Retry limit reached for transaction {transaction_id}. Manual escalation required.",
                        "retry_count": retry_count
                    }
                
                # Generate new transaction ID with retry format
                retry_number = retry_count + 1
                new_transaction_id = f"RT{retry_number}_{transaction_id}"
                
                # Create new transaction record (retry attempt)
                insert_query = """
                    INSERT INTO transactions (
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
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                        $21, $22, $23, $24, $25, $26
                    )
                """
                
                # Prepare values for the new transaction
                now = datetime.now()
                expected_completion = now + timedelta(minutes=5)
                
                # Insert new retry transaction
                await conn.execute(
                    insert_query,
                    new_transaction_id,                              # transaction_id
                    original_txn['user_id'],                        # user_id
                    original_txn['amount'],                         # amount
                    original_txn['transaction_type'],               # transaction_type
                    original_txn['recipient_type'],                 # recipient_type
                    original_txn['recipient_account_id'],           # recipient_account_id
                    original_txn['recipient_bank_name_or_ewallet'], # recipient_bank_name_or_ewallet
                    original_txn['device_id'],                      # device_id
                    original_txn['location_coordinates'],           # location_coordinates
                    now,                                             # timestamp_initiated
                    'initiated',                                     # status_1
                    now,                                             # status_timestamp_1
                    'processing',                                    # status_2
                    now + timedelta(seconds=30),                    # status_timestamp_2
                    'completed',                                     # status_3
                    now + timedelta(minutes=2),                     # status_timestamp_3
                    'settled',                                       # status_4
                    now + timedelta(minutes=5),                     # status_timestamp_4
                    expected_completion,                             # expected_completion_time
                    2.5,                                            # simulated_network_latency
                    False,                                          # is_floating_cash (retry should succeed)
                    0,                                              # floating_duration_minutes
                    False,                                          # is_fraudulent_attempt
                    False,                                          # is_cancellation
                    False,                                          # is_retry_successful (not applicable for retry txn)
                    False                                           # manual_escalation_needed
                )
                
                # Mark the original transaction as successfully retried
                update_original_query = """
                    UPDATE transactions 
                    SET is_retry_successful = TRUE,
                        manual_escalation_needed = FALSE
                    WHERE transaction_id = $1
                """
                await conn.execute(update_original_query, transaction_id)
                
                # Also mark the retry transaction as successful
                # (Note: The retry transaction was created with is_retry_successful=FALSE initially,
                # but since it's a successful retry, we should mark it as TRUE)
                update_retry_query = """
                    UPDATE transactions
                    SET is_retry_successful = TRUE
                    WHERE transaction_id = $1
                """
                await conn.execute(update_retry_query, new_transaction_id)
                
                return {
                    "status": "success",
                    "message": f"Transaction retry successful",
                    "new_transaction_id": new_transaction_id,
                    "original_transaction_id": transaction_id,
                    "retry_number": retry_number,
                    "timestamp": now.isoformat()
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to retry transaction: {str(e)}"
            }
        finally:
            if conn:
                await conn.close()
    
    # Execute the async function
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create a new thread to run the async function
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _async_retry())
                return future.result()
        else:
            return loop.run_until_complete(_async_retry())
    except RuntimeError:
        # Fallback for when no event loop exists
        return asyncio.run(_async_retry())