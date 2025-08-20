"""Tool for fetching transaction data to enable LLM-based report generation."""

import os
import asyncio
import asyncpg
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv

load_dotenv()


def convert_to_serializable(value: Any) -> Any:
    """Convert PostgreSQL/Python types to serializable formats."""
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='ignore')
    if value is None:
        return None
    return value


def fetch_transaction_for_report(
    transaction_id: str,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Fetch comprehensive transaction data to enable LLM-based report generation.
    
    This tool retrieves all transaction details, retry attempts, and related data
    so the LLM can generate a comprehensive, contextual report.
    
    Args:
        transaction_id: The transaction ID to fetch data for
        tool_context: The tool context from ADK
    
    Returns:
        Dictionary containing all transaction data needed for report generation
    """
    
    if not transaction_id:
        return {
            "status": "error",
            "message": "Transaction ID is required"
        }
    
    # Get user_id from context if available
    user_id = None
    if tool_context and hasattr(tool_context, 'state'):
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
    async def _async_fetch_data():
        conn = None
        try:
            # Create connection
            conn = await asyncpg.connect(**db_config)
            
            # Fetch the full transaction data
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
                    timestamp_initiated,
                    status_1, status_timestamp_1,
                    status_2, status_timestamp_2,
                    status_3, status_timestamp_3,
                    status_4, status_timestamp_4,
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
            
            if user_id:
                fetch_query += " AND user_id = $2"
                transaction_data = await conn.fetchrow(fetch_query, transaction_id, user_id)
            else:
                transaction_data = await conn.fetchrow(fetch_query, transaction_id)
            
            if not transaction_data:
                await conn.close()
                return {
                    "status": "error",
                    "message": f"Transaction {transaction_id} not found"
                }
            
            # Convert to dictionary and make serializable
            transaction_dict = dict(transaction_data)
            for key, value in transaction_dict.items():
                transaction_dict[key] = convert_to_serializable(value)
            
            # Fetch retry transactions
            retry_query = """
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
                    status_1, status_timestamp_1,
                    status_2, status_timestamp_2,
                    status_3, status_timestamp_3,
                    status_4, status_timestamp_4,
                    expected_completion_time,
                    simulated_network_latency,
                    is_floating_cash,
                    floating_duration_minutes,
                    is_fraudulent_attempt,
                    is_cancellation,
                    is_retry_successful,
                    manual_escalation_needed
                FROM transactions
                WHERE transaction_id LIKE 'RT%_' || $1
                ORDER BY timestamp_initiated
            """
            retry_records = await conn.fetch(retry_query, transaction_id)
            
            # Convert retry transactions to list of dicts
            retry_transactions = []
            for record in retry_records:
                retry_dict = dict(record)
                for key, value in retry_dict.items():
                    retry_dict[key] = convert_to_serializable(value)
                retry_transactions.append(retry_dict)
            
            # Fetch any existing reports for this transaction
            report_query = """
                SELECT message_id, report
                FROM messages
                WHERE transaction_id = $1
                ORDER BY message_id DESC
                LIMIT 5
            """
            report_records = await conn.fetch(report_query, transaction_id)
            
            existing_reports = []
            for record in report_records:
                existing_reports.append({
                    "message_id": record['message_id'],
                    "report_preview": record['report'][:500] if record['report'] else None
                })
            
            # Calculate some derived metrics
            amount = float(transaction_dict['amount']) if transaction_dict['amount'] else 0
            retry_count = len(retry_transactions)
            
            # Calculate transaction duration if completed
            duration_info = {}
            if transaction_dict['timestamp_initiated'] and transaction_dict['status_timestamp_4']:
                start_time = datetime.fromisoformat(transaction_dict['timestamp_initiated'])
                end_time = datetime.fromisoformat(transaction_dict['status_timestamp_4'])
                duration = end_time - start_time
                duration_info = {
                    "duration_seconds": duration.total_seconds(),
                    "duration_minutes": duration.total_seconds() / 60,
                    "duration_formatted": str(duration)
                }
            
            # Build status progression timeline
            status_timeline = []
            for i in range(1, 5):
                status_field = f'status_{i}'
                timestamp_field = f'status_timestamp_{i}'
                if transaction_dict[status_field]:
                    status_timeline.append({
                        "status": transaction_dict[status_field],
                        "timestamp": transaction_dict[timestamp_field],
                        "step": i
                    })
            
            await conn.close()
            
            # Return comprehensive data structure
            return {
                "status": "success",
                "transaction_data": transaction_dict,
                "retry_attempts": {
                    "count": retry_count,
                    "transactions": retry_transactions
                },
                "existing_reports": existing_reports,
                "derived_metrics": {
                    "amount_formatted": f"₱{amount:,.2f}",
                    "retry_count": retry_count,
                    "duration": duration_info,
                    "status_timeline": status_timeline,
                    "has_floating_cash": transaction_dict.get('is_floating_cash', False),
                    "is_fraudulent": transaction_dict.get('is_fraudulent_attempt', False),
                    "needs_escalation": transaction_dict.get('manual_escalation_needed', False)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            if conn:
                await conn.close()
            return {
                "status": "error",
                "message": f"Failed to fetch transaction data: {str(e)}"
            }
    
    # Execute the async function
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create a new thread to run the async function
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _async_fetch_data())
                return future.result()
        else:
            return loop.run_until_complete(_async_fetch_data())
    except RuntimeError:
        # Fallback for when no event loop exists
        return asyncio.run(_async_fetch_data())