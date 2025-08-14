# SPARK - Service Proactive AI Response Knowledge

## Overview

SPARK is a sophisticated multi-agent AI system designed for Bank of the Philippine Islands (BPI) to proactively detect and resolve "floating cash" transactional anomalies. Built with **Google's Agent Development Kit (ADK)** and the **A2A (Agent-to-Agent) Protocol**, this system demonstrates state-of-the-art patterns for building collaborative AI agents that can automatically resolve transaction discrepancies.

## 🚀 Key Features

- **Proactive Detection**: Automatically identifies floating cash anomalies in banking transactions
- **Automated Resolution**: Intelligent transaction retry system with configurable retry limits
- **Smart Escalation**: Comprehensive reporting for both successful resolutions and escalations
- **Multilingual Support**: Seamless Tagalog-English communication
- **Secure Architecture**: Sandboxed database access with user-level authorization
- **Audit Trail**: Complete transaction history and resolution tracking

## 🏗️ Architecture

SPARK uses three interconnected agents that communicate via the A2A protocol:

```
┌─────────────────────────────────────────────┐
│            Google ADK Framework             │
├─────────────────────────────────────────────┤
│         A2A Protocol (HTTP/JSON-RPC)        │
├─────────────────────────────────────────────┤
│                  Agents                     │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐     │
│  │  Host   │──│Reconciler│──│Escalator│     │
│  │  Agent  │  │  Agent   │  │  Agent  │     │
│  └─────────┘  └──────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

### Agent Responsibilities

1. **Host Agent** (Port 8000)
   - Primary client-facing interface
   - Detects floating cash anomalies
   - Routes failed transactions to reconciler
   - Provides sandboxed database queries

2. **Reconciler Agent** (Port 8081)
   - Fetches transaction details from database
   - Creates retry transactions (RT1_, RT2_ prefixes)
   - Updates transaction statuses
   - Triggers escalator for report generation

3. **Escalator Agent** (Sub-agent)
   - Generates SUCCESS reports (SUC_ prefix) for resolved transactions
   - Creates ESCALATION reports (ESC_ prefix) for unresolved issues
   - Saves comprehensive reports to messages table

## 📁 Project Structure

```
trybe-lang/
├── .env.example                   # Environment variables template
├── README.md                      # This file
├── CLAUDE.md                      # Instructions for Claude Code AI
├── requirements.txt               # Python dependencies
│
└── spark/                         # SPARK banking resolution system
    ├── host_agent_adk/            # Primary client-facing agent
    │   ├── host/
    │   │   ├── agent.py          # Main HostAgent implementation
    │   │   ├── prompt.py         # System prompt configuration
    │   │   ├── remote_agent_connection.py
    │   │   └── tools/
    │   │       ├── database_tools.py
    │   │       └── query_agent_capabilities.py
    │   └── pyproject.toml
    │
    ├── reconciler_agent/          # Transaction retry agent
    │   ├── agent.py
    │   ├── agent_executor.py     # A2A request handler
    │   ├── prompt.py
    │   ├── tools/
    │   │   ├── transaction_fetcher.py
    │   │   ├── retry_transaction.py
    │   │   └── list_capabilities.py
    │   ├── sub_agents/
    │   │   └── escalator_agent/  # Report generation sub-agent
    │   │       ├── agent.py
    │   │       ├── prompt.py
    │   │       └── tools/
    │   │           └── create_report.py
    │   └── __main__.py           # Entry point
    │
    └── .env   # Environment configuration (create from .env.example)
```

## 🛠️ Technology Stack

- **Framework**: Google Agent Development Kit (ADK)
- **Protocol**: A2A (Agent-to-Agent) Protocol
- **Language**: Python 3.11+
- **LLM**: Google Gemini 2.5 Flash
- **Database**: PostgreSQL
- **Package Management**: uv

## 🚦 Getting Started

### Prerequisites

- Python 3.11 or higher
- Google Cloud account with API access
- PostgreSQL database
- uv package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trybe-lang.git
cd trybe-lang/spark
```

2. Set up virtual environments for each agent:
```bash
# For Host Agent
cd host_agent_adk
uv venv && source .venv/bin/activate
uv pip install -e .

# For Reconciler Agent (in new terminal)
cd ../reconciler_agent
uv venv && source .venv/bin/activate
uv pip install -e .
```

3. Configure environment variables (see Environment Setup section)

4. Set up PostgreSQL database credentials in the `.env file`

## 🔧 Environment Setup

A `.env.example` file is provided in the root directory with all required environment variables. Copy it to create your `.env` file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your configuration:

```env
# GCP Credentials
GOOGLE_GENAI_USE_VERTEXAI=TRUE  # Set to TRUE for Vertex AI, leave empty for API key
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name
GOOGLE_API_KEY=your_api_key_here  # Required if not using Vertex AI

# PostgreSQL Credentials
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Dummy User for Development
DUMMY_USER_ID=test_user_123  # Used for development/testing
```

**Note**: Choose either Google API Key OR Vertex AI configuration, not both.

## 🏃 Running the System

Start each agent in a separate terminal:

### Terminal 1: Host Agent
```bash
cd spark/host_agent_adk
uv run --active adk web
```
Access the web interface at http://localhost:8000

### Terminal 2: Reconciler Agent
```bash
cd spark/reconciler_agent
uv run --active .
```
The reconciler runs on port 8081

**Note**: The Escalator agent is a sub-agent of Reconciler and doesn't run separately.

## 💬 Usage Examples

### Detecting Floating Cash
```
User: "Check for any floating cash issues in my account"
Host Agent: Queries database for anomalies and identifies problematic transactions
```

### Resolving Transactions
```
User: "Resolve transaction TXN_12345"
Host Agent: Routes to Reconciler → Creates retry transaction → Updates status → Generates report
```

### Querying Status
```
User: "What's the status of my recent transactions?"
Host Agent: Retrieves transaction history with resolution statuses
```

## 🔐 Security Features

- **User Sandboxing**: All database queries are restricted to authorized user data
- **Secure Credentials**: API keys and database credentials stored in environment variables
- **Transaction Integrity**: Audit trail for all transaction modifications
- **A2A Protocol Security**: Secure inter-agent communication

## 📊 Transaction Flow

1. **Detection Phase**
   - Host Agent identifies floating cash anomalies
   - Validates user authorization
   - Retrieves transaction details

2. **Resolution Phase**
   - Reconciler creates retry transaction (RT1_, RT2_)
   - Attempts transaction processing
   - Updates original and retry transaction statuses

3. **Reporting Phase**
   - Escalator generates appropriate report (SUCCESS or ESCALATION)
   - Saves comprehensive report to messages table
   - Returns status to user

## 📝 Development Guidelines

### Adding New Tools
1. Create tool module in appropriate `tools/` directory
2. Implement tool function with proper type hints
3. Register tool in agent configuration
4. Update prompt to include tool usage instructions

### Extending Agent Capabilities
1. Follow Google ADK patterns
2. Use A2A protocol for inter-agent communication
3. Implement comprehensive error handling
4. Add logging for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-capability`)
3. Implement changes with tests
4. Commit with descriptive messages
5. Push to your fork
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Agent Development Kit (ADK) team
- A2A Protocol specification contributors
- Bank of the Philippine Islands (BPI) for the use case
- Google Cloud Platform for infrastructure support

## 📚 Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [A2A Protocol Specification](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Gemini API Documentation](https://ai.google.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Note**: This system is designed for production banking environments with appropriate security measures and compliance requirements.