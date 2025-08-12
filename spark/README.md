# SPARK Host Agent - BPI Transaction Discrepancy Resolution

## Overview
SPARK (Smart Proactive Agent for Resolution and Knowledge) is an AI-powered multi-agent system designed for Bank of the Philippine Islands (BPI) to proactively detect and resolve "floating cash" transactional anomalies. This is the foundational Host Agent that serves as the primary, client-facing component.

## Features
- **Multilingual Support**: Seamlessly communicates in Tagalog-English (Taglish)
- **Proactive Detection**: Can be triggered by external discrepancy detection systems
- **User Session Management**: Maintains stateful conversations with users
- **Sandboxed Database Access**: Strictly limited to authorized user transactions
- **Remote Agent Integration**: Ready for connection with Reconciler and Escalator agents

## Architecture
```
SPARK System
├── Host Agent (This component)
│   ├── User Interface Layer
│   ├── Session Management
│   ├── Tool Integration
│   └── Remote Agent Connections
├── Reconciler Agent (Future)
└── Escalator Agent (Future)
```

## Installation

### Prerequisites
- Python 3.10+
- PostgreSQL database access
- Google Cloud Platform credentials

### Setup
1. Navigate to the host agent directory:
```bash
cd spark/host_agent_adk
```

2. Install dependencies using uv:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

3. Environment variables are configured in `spark/.env`

## Usage

### CLI Mode
Run the agent in interactive command-line mode:
```bash
python -m host_agent_adk --mode cli
```

Commands:
- Type messages to chat with SPARK
- `/trigger <transaction_id>` - Simulate a discrepancy alert
- `/exit` - Exit the session

### Web Interface Mode
Run the agent with a web interface:
```bash
python -m host_agent_adk --mode web
```
Access at: http://localhost:8000

## Development Mode
The agent is configured with `DUMMY_USER_ID = "user_1"` for development purposes.

## Security Features
- **Sandboxed Queries**: Database access strictly limited to authorized user_id
- **No Cross-User Access**: Cannot query other users' transactions
- **Secure Credential Management**: Uses environment variables for sensitive data

## Tools
1. **query_user_transactions**: Sandboxed database query tool
2. **run_discrepancy_check**: Boilerplate discrepancy detection (simulated)
3. **get_transaction_status**: Transaction status retrieval
4. **send_message_to_remote_agent**: Remote agent communication (when available)

## Session Triggers
1. **User-Initiated**: User starts a conversation
2. **System-Initiated**: External discrepancy detector triggers a proactive session

## Project Structure
```
spark/
├── host_agent_adk/
│   ├── host/
│   │   ├── agent.py           # Main HostAgent implementation
│   │   ├── prompt.py          # System prompt configuration
│   │   └── remote_agent_connection.py
│   │   └── tools/
│   │       └── database_tools.py  # Sandboxed database tools
│   └── pyproject.toml         # Dependencies
└── .env                       # Environment configuration
```

## Future Enhancements
- Integration with actual Reconciler and Escalator agents
- Production ML model for discrepancy detection
- Enhanced monitoring and logging
- Multi-user session management
- Advanced analytics dashboard