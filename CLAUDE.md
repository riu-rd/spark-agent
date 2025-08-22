# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains two integrated systems for AI-powered banking solutions:

**SPARK (agents/)**: Multi-agent banking transaction resolution system for BPI (Bank of the Philippine Islands) that detects and resolves floating cash anomalies. Uses A2A protocol for agent communication and PostgreSQL for transaction data.

**SPARK Frontend (frontend/)**: React-based digital banking application that provides the user interface for the AI-powered transaction monitoring system. Features real-time transaction tracking, payment processing, and intelligent anomaly detection.

## Architecture

### SPARK (Banking Transaction Resolution System)
- **Host Agent** (ADK): Primary client-facing agent with database access
  - Detects floating cash anomalies using ML models (trybe_discrepancy_detector.pkl)
  - Routes failed transactions to reconciler for retry
  - Sandboxed database queries limited to authorized user
  - Integrates risk prediction model for transaction assessment
- **Reconciler Agent** (ADK): Automated transaction retry system
  - Fetches transaction details from database
  - Creates retry transactions (RT1_, RT2_ prefixes)
  - Updates both original and retry transactions as successful
  - Always calls escalator for report generation
- **Escalator Agent** (ADK Sub-agent): Report generation system
  - Creates SUCCESS reports (SUC_ prefix) for successful retries
  - Creates ESCALATION reports (ESC_ prefix) for failures
  - Saves comprehensive reports to messages table
- All agents use A2A protocol over HTTP (ports 8000, 8081)

### Machine Learning Models
- **Discrepancy Detector** (trybe_discrepancy_detector.pkl): Identifies transaction anomalies
- **Risk Predictor** (trybe_risk_predictor.pkl): Assesses transaction risk levels
- Located in `models/` and `agents/host_agent_adk/host/tools/`

### SPARK Frontend (Banking UI Application)
- **React 18** with Vite build system for fast development
- **Routing**: React Router v6 for single-page application navigation
- **Styling**: Tailwind CSS for utility-first styling
- **Animations**: Framer Motion for smooth UI transitions
- **State Management**: React hooks and context for transaction state
- **Icons**: Lucide React for consistent iconography
- **Notifications**: React Hot Toast for user feedback

#### Frontend Components
- **BottomNavigation**: Mobile-first navigation bar
- **PaymentInfoCard**: Display payment and transaction details
- **PrivacyNoticeModal**: User privacy information
- **TransactionList**: Real-time transaction status display
- **VybeLogo**: Brand identity component

#### Frontend Pages
- **Home**: Main dashboard with account balance and quick actions
- **AddMoney**: Fund transfer and top-up interface
- **Transactions**: Transaction history and status tracking
- **PaymentDelayedScreen**: Handles delayed payment scenarios
- **NotFound**: 404 error handling

## Development Commands

### Initial Setup for SPARK agents:
```bash
# Install uv package manager if not already installed
pip install uv

# Setup Host Agent
cd agents/host_agent_adk
uv venv
uv sync

# Setup Reconciler Agent
cd agents/reconciler_agent
uv venv
uv sync
```

### Running SPARK agents:
Each agent must run in separate terminal:
```bash
# Host Agent (run with web interface, port 8000)
cd agents/host_agent_adk
uv run python -m google.adk.cli web

# Or to run the API server directly:
cd agents/host_agent_adk
uv run python run_api.py

# Reconciler Agent (run on port 8081)
cd agents/reconciler_agent
uv run python __main__.py

# Note: Escalator is a sub-agent of Reconciler and doesn't run separately
```

### For SPARK Frontend:
```bash
# Install dependencies
cd frontend
npm install

# Run development server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Environment Setup

### SPARK
Create `.env` in project root or in each agent directory:
```
GOOGLE_API_KEY="your_api_key_here"
# OR for Vertex AI:
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1

# Database configuration (PostgreSQL)
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Optional: Dummy user for development
DUMMY_USER_ID=test_user_123
```

### SPARK Frontend
No additional environment variables required for basic frontend operation. The frontend connects to SPARK agents via configured API endpoints.

## Key Technical Details

### Backend (SPARK)
- **Python Version**: 3.11+
- **Package Management**: uv
- **Testing Framework**: pytest with pytest-asyncio
- **Main Dependencies**: google-adk, google-genai, pydantic, python-dotenv

### Frontend (SPARK)
- **Node Version**: 16+ recommended
- **Package Management**: npm
- **Build Tool**: Vite 4.3+
- **React Version**: 18.2.0
- **Main Dependencies**: react, react-router-dom, tailwindcss, framer-motion, lucide-react
- **Backend Communication**: Express server (server.js) for API integration

## Project Structure Patterns

### Backend (SPARK)
- Agent definitions in `agent.py` files
- Tool implementations in separate tool modules
- Pydantic models for type safety
- Session state management for memory
- HTTP/API communication between agents

### Frontend (SPARK)
- Component-based architecture with reusable UI components
- Page components for main application routes
- Utility functions for transaction management
- Tailwind CSS for styling with custom configuration
- Vite configuration for optimized build process

## Testing Approach

- Currently no automated tests are implemented
- Manual testing through web interface and API endpoints
- Agents must be started in correct order for testing (Host first, then Reconciler)

## Important Notes

### Backend (SPARK)
- Always ensure virtual environments are activated before running agents
- Host agent must be started before testing user interactions
- Reconciler agent handles all retry logic and escalation
- Database queries are sandboxed to prevent cross-user data access
- Agents communicate via A2A protocol (JSON-RPC over HTTP)
- Host Agent API endpoints available at http://localhost:8000/docs

### Frontend (SPARK) 
- Frontend runs on Vite dev server (default port 5173)
- Connects to SPARK backend agents for transaction processing
- Implements mobile-first responsive design
- Features real-time transaction status updates
- Includes intelligent agent capabilities for anomaly detection and resolution
- Express backend server (server.js) provides database integration

### Inter-Agent Communication
- Host Agent connects to Reconciler via remote_agent_connection.py
- Messages are passed using A2A protocol with proper task IDs
- Escalator runs as sub-agent within Reconciler's context

## Common Development Tasks

### Adding a new tool to an agent:
1. Create tool module in agent's `tools/` directory
2. Implement tool function with proper type hints and docstring
3. Register tool in agent's `agent.py` using `@agent.tool()` decorator
4. Update agent's prompt to include tool usage instructions

### Debugging agent interactions:
1. Check agent logs in terminal output
2. Use Host Agent web interface at http://localhost:8000
3. Monitor A2A protocol messages in agent logs
4. Test individual tools before integration

### Database operations:
- All database queries use asyncpg or psycopg2
- Connection pooling handled automatically
- Queries are user-scoped for security
- Transaction tables: transactions, retry_transactions, messages

# Important Instruction Reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.