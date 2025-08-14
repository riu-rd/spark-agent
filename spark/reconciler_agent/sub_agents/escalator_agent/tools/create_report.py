"""Tool for creating and saving escalation reports to the database."""

import os
import asyncio
import asyncpg
import uuid
from datetime import datetime
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


def create_and_save_report(
    transaction_id: str,
    failure_details: str,
    is_success: Optional[bool] = False,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Create a comprehensive report and save it to the messages table.
    
    Args:
        transaction_id: The transaction ID that was processed
        failure_details: String describing the resolution outcome (success or failure details)
        is_success: Whether the retry was successful (default: False)
        tool_context: The tool context from ADK
    
    Returns:
        Dictionary containing report creation status and report ID
    """
    
    if not transaction_id:
        return {
            "status": "error",
            "message": "Transaction ID is required for report"
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
    async def _async_create_report():
        conn = None
        try:
            # Create connection
            conn = await asyncpg.connect(**db_config)
            
            # First, fetch the full transaction data
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
            
            # Check for retry transactions
            retry_query = """
                SELECT transaction_id, timestamp_initiated, status_4
                FROM transactions
                WHERE transaction_id LIKE 'RT%_' || $1
                ORDER BY timestamp_initiated
            """
            retry_transactions = await conn.fetch(retry_query, transaction_id)
            
            # Generate report ID based on success/failure
            timestamp_str = datetime.now().strftime("%Y%m%d%H%M%S")
            report_prefix = "SUC" if is_success else "ESC"
            report_id = f"{report_prefix}_{timestamp_str}_{transaction_id}"
            
            # Determine priority based on amount and retry attempts
            amount = float(transaction_data['amount']) if transaction_data['amount'] else 0
            retry_count = len(retry_transactions)
            
            priority = "LOW"
            if amount > 50000:
                priority = "CRITICAL"
            elif amount > 10000:
                priority = "HIGH"
            elif retry_count >= 2:
                priority = "MEDIUM"
            
            # Build the comprehensive report
            report_title = "SUCCESS REPORT - TRANSACTION RETRIED" if is_success else "ESCALATION REPORT FOR FAILED TRANSACTION"
            report_type = "SUCCESS" if is_success else "ESCALATION"
            
            report_lines = [
                "=" * 70,
                report_title,
                "=" * 70,
                "",
                "1. REPORT HEADER",
                "-" * 40,
                f"Report ID: {report_id}",
                f"Report Type: {report_type}",
                f"Generated At: {datetime.now().isoformat()}",
                f"Priority Level: {priority}",
                "",
                "2. TRANSACTION DETAILS",
                "-" * 40,
                f"Transaction ID: {transaction_data['transaction_id']}",
                f"User ID: {transaction_data['user_id']}",
                f"Amount: ₱{amount:,.2f}",
                f"Type: {transaction_data['transaction_type']}",
                f"Recipient Type: {transaction_data['recipient_type']}",
                f"Recipient Account: {transaction_data['recipient_account_id']}",
                f"Recipient Bank/E-Wallet: {transaction_data['recipient_bank_name_or_ewallet']}",
                f"Device ID: {transaction_data['device_id']}",
                f"Location: {transaction_data['location_coordinates']}",
                "",
                "3. TIMELINE ANALYSIS",
                "-" * 40,
                f"Initiation Time: {convert_to_json_serializable(transaction_data['timestamp_initiated'])}",
                "Status Progression:",
            ]
            
            # Add status progression
            for i in range(1, 5):
                status_field = f'status_{i}'
                timestamp_field = f'status_timestamp_{i}'
                if transaction_data[status_field]:
                    status_time = convert_to_json_serializable(transaction_data[timestamp_field])
                    report_lines.append(f"  - {transaction_data[status_field]}: {status_time}")
            
            # Calculate duration
            if transaction_data['timestamp_initiated'] and transaction_data['status_timestamp_4']:
                duration = transaction_data['status_timestamp_4'] - transaction_data['timestamp_initiated']
                duration_minutes = duration.total_seconds() / 60
            else:
                duration_minutes = "Unknown"
            
            report_lines.extend([
                f"Expected Completion: {convert_to_json_serializable(transaction_data['expected_completion_time'])}",
                f"Actual Duration: {duration_minutes} minutes" if isinstance(duration_minutes, (int, float)) else f"Actual Duration: {duration_minutes}",
                f"Network Latency: {transaction_data['simulated_network_latency']} seconds",
                "",
                "4. DISCREPANCY DETAILS",
                "-" * 40,
                f"Floating Cash Status: {'YES' if transaction_data['is_floating_cash'] else 'NO'}",
                f"Floating Duration: {transaction_data['floating_duration_minutes']} minutes",
                f"Fraud Attempt: {'YES' if transaction_data['is_fraudulent_attempt'] else 'NO'}",
                f"Cancellation Status: {'YES' if transaction_data['is_cancellation'] else 'NO'}",
                "",
                "5. RESOLUTION ATTEMPTS",
                "-" * 40,
                f"Retry Count: {retry_count}",
            ])
            
            if retry_transactions:
                report_lines.append("Retry Transaction IDs:")
                for retry_txn in retry_transactions:
                    retry_time = convert_to_json_serializable(retry_txn['timestamp_initiated'])
                    report_lines.append(f"  - {retry_txn['transaction_id']} at {retry_time}")
            else:
                report_lines.append("Retry Transaction IDs: None")
            
            report_lines.extend([
                f"Failure Reason: {failure_details}",
                "",
                "6. RECOMMENDED ACTION",
                "-" * 40,
            ])
            
            # Add recommendations based on transaction details
            if transaction_data['is_fraudulent_attempt']:
                report_lines.extend([
                    "⚠️ FRAUD ALERT: This transaction was flagged as fraudulent.",
                    "Recommended Actions:",
                    "  1. Contact fraud prevention team immediately",
                    "  2. Block the account temporarily",
                    "  3. Initiate customer verification process",
                ])
            elif amount > 50000:
                report_lines.extend([
                    "⚠️ HIGH VALUE TRANSACTION",
                    "Recommended Actions:",
                    "  1. Prioritize manual review by senior operations staff",
                    "  2. Contact customer directly for verification",
                    "  3. Check for similar patterns in recent transactions",
                ])
            else:
                report_lines.extend([
                    "Recommended Actions:",
                    "  1. Review transaction logs for technical errors",
                    "  2. Contact recipient bank/e-wallet for status",
                    "  3. Prepare refund if transaction cannot be completed",
                ])
            
            report_lines.extend([
                f"Risk Assessment: {priority} priority",
                f"Customer Impact: {'HIGH' if amount > 10000 else 'MEDIUM' if amount > 1000 else 'LOW'}",
                "",
                "7. AUDIT TRAIL",
                "-" * 40,
                f"Original transaction initiated: {convert_to_json_serializable(transaction_data['timestamp_initiated'])}",
            ])
            
            if retry_transactions:
                for i, retry_txn in enumerate(retry_transactions, 1):
                    report_lines.append(f"Retry attempt {i}: {retry_txn['transaction_id']}")
            
            report_lines.extend([
                f"Escalation report created: {datetime.now().isoformat()}",
                "",
                "=" * 70,
                "END OF REPORT",
                "=" * 70,
            ])
            
            # Join all lines into the final report
            full_report = "\n".join(report_lines)
            
            # Get the next message_id (integer)
            max_id_result = await conn.fetchrow("SELECT COALESCE(MAX(message_id), 0) as max_id FROM messages")
            next_message_id = max_id_result['max_id'] + 1
            
            # Save the report to the messages table
            insert_query = """
                INSERT INTO messages (message_id, transaction_id, report)
                VALUES ($1, $2, $3)
            """
            
            await conn.execute(
                insert_query,
                next_message_id,
                transaction_id,
                full_report
            )
            
            # Update the transaction to mark it as escalated
            update_query = """
                UPDATE transactions
                SET manual_escalation_needed = TRUE
                WHERE transaction_id = $1
            """
            await conn.execute(update_query, transaction_id)
            
            await conn.close()
            
            return {
                "status": "success",
                "message": f"{'Success' if is_success else 'Escalation'} report created successfully. Report ID: {report_id}. {'Transaction successfully retried.' if is_success else 'Requires human review.'}",
                "report_id": report_id,
                "message_id": next_message_id,
                "transaction_id": transaction_id,
                "priority": priority,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            if conn:
                await conn.close()
            return {
                "status": "error",
                "message": f"Failed to create escalation report: {str(e)}"
            }
    
    # Execute the async function
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create a new thread to run the async function
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _async_create_report())
                return future.result()
        else:
            return loop.run_until_complete(_async_create_report())
    except RuntimeError:
        # Fallback for when no event loop exists
        return asyncio.run(_async_create_report())