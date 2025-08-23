# SPARK Multi-Agent System - Google ADK with A2A Protocol

## 🚀 Quick Setup

### Prerequisites
- Python 3.11 or higher
- PostgreSQL database
- Google API key or Vertex AI credentials
- Configured `.env` file in root directory

### Installation & Running

1. **Navigate to root directory and create Python environment**:

#### Option A: Using venv
```bash
# From trybe-lang root directory
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Option B: Using Conda
```bash
# From trybe-lang root directory
conda create -n spark-agents python=3.11
conda activate spark-agents
```

2. **Install dependencies**:
```bash
# In root directory with activated environment
pip install -r requirements.txt
pip install uv  # Install uv package manager
```

3. **Setup agent environments**:
```bash
# Setup Host Agent
cd agents/host_agent_adk
uv venv
uv sync
cd ../..

# Setup Reconciler Agent
cd agents/reconciler_agent
uv venv
uv sync
cd ../..
```

4. **Configure environment**:
Ensure `.env` file exists in root directory with:
```env
# Google AI Configuration
GOOGLE_API_KEY="your_api_key_here"
# OR for Vertex AI:
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1

# PostgreSQL Configuration
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

5. **Run the multi-agent system**:

**Important**: Use separate terminals with activated Python environment for each agent.

#### Terminal 1 - Reconciler Agent (Port 8081)
```bash
cd agents/reconciler_agent
uv run --active .
```

#### Terminal 2 - Host Agent with ADK Web Console (Port 8000)
```bash
cd agents/host_agent_adk
uv run --active adk web
```
Access the ADK debugging console at http://localhost:8000

**Alternative**: Run Host Agent API server directly:
```bash
cd agents/host_agent_adk
uv run python run_api.py
```

## 📁 System Overview

The SPARK agent system implements a sophisticated multi-agent architecture using Google's Agent Development Kit (ADK) and the A2A (Agent-to-Agent) Protocol. This design enables secure, distributed AI agents that can communicate across different environments while maintaining isolation and security.

### Architecture Philosophy

Unlike traditional tightly-coupled multi-agent systems, SPARK uses A2A protocol to achieve:
- **Agent Isolation**: Each agent runs in its own environment
- **Security by Separation**: Confidential agents remain on secure infrastructure
- **Flexible Deployment**: Agents can be deployed independently
- **Protocol-Based Communication**: Standardized message passing via A2A

## 🏗️ Agent Structure

```
agents/
├── README.md                      # This file
├── direct_client.py              # Proof-of-concept A2A client
│
├── host_agent_adk/               # User-facing representative agent
│   ├── __init__.py
│   ├── api_server.py            # FastAPI server implementation
│   ├── run_api.py               # API server launcher
│   ├── pyproject.toml           # Package dependencies
│   ├── uv.lock                  # Locked dependencies
│   │
│   └── host/
│       ├── __init__.py
│       ├── agent.py             # Main HostAgent class
│       ├── prompt.py            # System prompts
│       ├── remote_agent_connection.py  # A2A connection handler
│       │
│       └── tools/               # Agent capabilities
│           ├── __init__.py
│           ├── database_tools.py        # PostgreSQL operations
│           ├── trybe_models.py          # ML model integration
│           └── trybe_discrepancy_detector.pkl  # Detection model
│
├── TEST_host_agent_adk/          # Test results and outputs for host agent
│                                 # Contains testing artifacts and validation results
│
└── reconciler_agent/             # Transaction resolution agent
    ├── __init__.py
    ├── __main__.py              # Entry point
    ├── agent.py                 # ReconcilerAgent class
    ├── agent_executor.py        # A2A request handler
    ├── prompt.py                # Agent instructions
    ├── pyproject.toml           # Dependencies
    ├── uv.lock                  # Locked dependencies
    │
    ├── tools/                   # Reconciler capabilities
    │   ├── __init__.py
    │   ├── transaction_fetcher.py      # Fetch transaction data
    │   └── retry_transaction.py        # Retry logic
    │
    └── sub_agents/              # Nested agent architecture
        └── escalator_agent/     # Report generation sub-agent
            ├── __init__.py
            ├── agent.py         # EscalatorAgent class
            ├── prompt.py        # Escalation instructions
            │
            └── tools/           # Escalator capabilities
                ├── __init__.py
                ├── fetch_transaction_for_report.py
                └── save_generated_report.py
```

## 🤖 Agent Descriptions

### Host Agent (Port 8000)
**Role**: Primary user interface and transaction monitoring

**Responsibilities**:
- Detect floating cash anomalies using ML models
- Process user queries with natural language understanding
- Route failed transactions to reconciler
- Provide sandboxed database access
- Maintain user session context

**Key Features**:
- Rule-based and ML-based detection models
- Real-time transaction monitoring
- Multilingual support (English/Tagalog)
- Web-based debugging console
- RESTful API endpoints

**Tools**:
- `database_tools.py`: Secure PostgreSQL queries
- `trybe_models.py`: ML model inference
- Remote agent communication via A2A

### Reconciler Agent (Port 8081)
**Role**: Automated transaction resolution and retry management

**Responsibilities**:
- Fetch failed transaction details
- Create retry transactions (RT1_, RT2_ prefixes)
- Update transaction statuses
- Trigger escalation when needed
- Generate comprehensive reports

**Key Features**:
- Configurable retry limits
- Intelligent retry timing
- Status tracking and updates
- Automatic escalation triggers
- Sub-agent orchestration

**Tools**:
- `transaction_fetcher.py`: Database queries
- `retry_transaction.py`: Retry logic implementation

### Escalator Agent (Sub-agent)
**Role**: Report generation and case escalation

**Responsibilities**:
- Generate SUCCESS reports (SUC_ prefix)
- Create ESCALATION reports (ESC_ prefix)
- Store reports in database
- Format comprehensive documentation
- Notify relevant stakeholders

**Key Features**:
- Template-based report generation
- Multi-format output support
- Automatic report storage
- Contextual report content
- Audit trail maintenance

**Tools**:
- `fetch_transaction_for_report.py`: Gather report data
- `save_generated_report.py`: Persist reports

## 🔌 A2A Protocol Communication

### How Agents Communicate

1. **Message Format**: JSON-RPC over HTTP
2. **Authentication**: Token-based (configured in .env)
3. **Endpoints**: RESTful API with standardized paths
4. **Error Handling**: Graceful degradation with fallbacks

### Communication Flow
```
User Query
    ↓
Host Agent (Port 8000)
    ↓ [Detects Issue]
    ↓ A2A Protocol
Reconciler Agent (Port 8081)
    ↓ [Attempts Retry]
    ↓ Internal Call
Escalator Sub-agent
    ↓ [Generates Report]
Database
```

### direct_client.py - Proof of Concept

The `direct_client.py` file demonstrates that A2A protocol is not limited to agent-to-agent communication:

```python
# Example usage
from direct_client import send_risk_alert

# ML model can directly notify reconciler
risk_score = model.predict(transaction)
if risk_score > threshold:
    response = send_risk_alert(
        transaction_id="TXN_12345",
        risk_level="HIGH",
        agent_url="http://localhost:8081"
    )
```

This shows how:
- External systems can integrate via A2A
- ML models can trigger agent actions
- Non-agent services can participate
- Protocol enables flexible architecture


## 🔍 Debugging

### Common Issues

**Agent Connection Failed**
```bash
# Check if agents are running
netstat -an | grep 8000  # Host agent
netstat -an | grep 8081  # Reconciler agent

# Verify A2A configuration
curl http://localhost:8000/health
curl http://localhost:8081/health
```

**Database Connection Error**
```python
# Test connection
import psycopg2
conn = psycopg2.connect(
    dbname="your_db",
    user="your_user",
    password="your_pass",
    host="localhost"
)
```

**Google API Issues**
```bash
# Verify API key
echo $GOOGLE_API_KEY

# Test API directly
curl -H "X-Goog-Api-Key: $GOOGLE_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

### Logging

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

View agent logs:
```bash
# Logs appear in terminal where agent is running
# Look for:
# - A2A message exchanges
# - Tool invocations
# - Error traces
```

## 🔐 Security Considerations

### Agent Isolation
- Each agent runs in separate process
- No shared memory between agents
- Communication only via A2A protocol
- Credentials isolated per agent

### Database Security
- User-scoped queries only
- Parameterized queries prevent SQL injection
- Connection pooling with limits
- Read-only access where appropriate

### A2A Protocol Security
- HTTPS in production
- Token authentication
- Request validation
- Rate limiting

### Deployment Security
- Confidential agents on secure infrastructure
- Public agents with limited capabilities
- Network segmentation
- Regular security audits

## 📊 Performance Optimization

### Agent Performance
- Async operations throughout
- Connection pooling for database
- Caching for frequently accessed data
- Batch processing where applicable

### A2A Communication
- Keep messages concise
- Use compression for large payloads
- Implement retry with exponential backoff
- Monitor latency metrics

### Database Optimization
- Index key columns
- Use materialized views for reports
- Implement query optimization
- Regular VACUUM and ANALYZE

## 📚 Additional Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Python Async Programming](https://docs.python.org/3/library/asyncio.html)

---

For complete system documentation, refer to the main [SPARK documentation](../README.md).