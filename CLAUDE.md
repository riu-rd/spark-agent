# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains the SPARK multi-agent AI application built with Google's Agent Development Kit (ADK):

**SPARK**: Multi-agent banking transaction resolution system for BPI (Bank of the Philippine Islands) that detects and resolves floating cash anomalies. Uses A2A protocol for agent communication and PostgreSQL for transaction data.

## Architecture

### SPARK (Banking Transaction Resolution System)
- **Host Agent** (ADK): Primary client-facing agent with database access
  - Detects floating cash anomalies in transactions
  - Routes failed transactions to reconciler for retry
  - Sandboxed database queries limited to authorized user
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

## Development Commands

### For SPARK agents:
Each agent must run in separate terminal:
```bash
# Host Agent (run with web interface)
cd spark/host_agent_adk
python -m host adk web

# Reconciler Agent (run on port 8081)
cd spark/reconciler_agent
python __main__.py

# Note: Escalator is a sub-agent of Reconciler and doesn't run separately
```

## Environment Setup

### SPARK
Create `.env` in `spark/`:
```
GOOGLE_API_KEY="your_api_key_here"
# OR for Vertex AI:
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1

# Database configuration
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

## Key Technical Details

- **Python Version**: 3.11+
- **Package Management**: uv
- **Testing Framework**: pytest with pytest-asyncio
- **Main Dependencies**: google-adk, google-genai, pydantic, python-dotenv

## Project Structure Patterns

The project follows these patterns:
- Agent definitions in `agent.py` files
- Tool implementations in separate tool modules
- Pydantic models for type safety
- Session state management for memory
- HTTP/API communication between agents

## Testing Approach

- Unit tests check agent and tool responses
- Integration tests validate end-to-end agent interactions
- Agents must be started in correct order for testing

## Important Notes

- Always ensure virtual environments are activated before running agents
- Host agent must be started before testing user interactions
- Reconciler agent handles all retry logic and escalation
- Database queries are sandboxed to prevent cross-user data access

# Important Instruction Reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.