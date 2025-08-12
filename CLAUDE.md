# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains two main multi-agent AI applications built with Google's Agent Development Kit (ADK) and related frameworks:

1. **a2a_friend_scheduling**: Demonstration of Google's A2A (Agent-to-Agent) protocol. Multi-agent system for scheduling meetings between friends using different agent frameworks (ADK, LangGraph, CrewAI). **This folder should be referenced religiously as the canonical example for A2A implementations.**

2. **travel-concierge**: Comprehensive example of a production-ready agent built with Google ADK. Shows best practices for complex multi-agent orchestration. **This folder should be referenced religiously as the canonical example for comprehensive ADK agent implementations.**

## IMPORTANT: Reference Implementation Folders

**Both `a2a_friend_scheduling` and `travel-concierge` folders are reference implementations that should be studied and followed religiously when creating new agent implementations. They demonstrate best practices, proper architecture patterns, and standard approaches for building agents with Google's technologies.**

## Architecture

### a2a_friend_scheduling
- **Host Agent** (ADK): Orchestrates scheduling between friend agents
- **Kaitlynn Agent** (LangGraph): Personal scheduling agent
- **Nate Agent** (CrewAI): Personal scheduling agent  
- **Karley Agent** (ADK): Personal scheduling agent
- Agents communicate via HTTP endpoints to coordinate availability

### travel-concierge
- **Root Agent**: Main orchestrator
- **Pre-booking agents**: inspiration, planning, booking
- **Post-booking agents**: pre_trip, in_trip, post_trip
- Integrations with Google Places API, Google Search, and MCP tools

## Development Commands

### For a2a_friend_scheduling agents:
Each agent must run in separate terminal:
```bash
# Kaitlynn Agent (LangGraph)
cd a2a_friend_scheduling/kaitlynn_agent_langgraph
uv venv && source .venv/bin/activate
uv run --active app/__main__.py

# Nate Agent (CrewAI)
cd a2a_friend_scheduling/nate_agent_crewai  
uv venv && source .venv/bin/activate
uv run --active .

# Karley Agent (ADK)
cd a2a_friend_scheduling/karley_agent_adk
uv venv && source .venv/bin/activate
uv run --active .

# Host Agent (ADK) - run last
cd a2a_friend_scheduling/host_agent_adk
uv venv && source .venv/bin/activate
uv run --active adk web
```

### For travel-concierge:
```bash
cd travel-concierge
poetry install
eval $(poetry env activate)

# Run agent via CLI
adk run travel_concierge

# Run agent with web interface
adk web

# Run tests
poetry install --with dev
pytest tests  # Unit tests
pytest eval   # Trajectory tests

# Deploy to Vertex AI
poetry install --with deployment
python deployment/deploy.py --create
```

## Environment Setup

### a2a_friend_scheduling
Create `.env` in `a2a_friend_scheduling/`:
```
GOOGLE_API_KEY="your_api_key_here"
```

### travel-concierge
Create `.env` in `travel-concierge/`:
```
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_PLACES_API_KEY=your_places_api_key
TRAVEL_CONCIERGE_SCENARIO=travel_concierge/profiles/itinerary_empty_default.json
```

## Key Technical Details

- **Python Version**: 3.11+ (travel-concierge), 3.13 (a2a_friend_scheduling with a2a-sdk)
- **Package Management**: Poetry (travel-concierge), uv (a2a_friend_scheduling)
- **Testing Framework**: pytest with pytest-asyncio
- **Main Dependencies**: google-adk, google-genai, pydantic, python-dotenv

## Project Structure Patterns

Both projects follow similar patterns:
- Agent definitions in `agent.py` files
- Tool implementations in separate tool modules
- Pydantic models for type safety
- Session state management for memory
- HTTP/API communication between agents

## Testing Approach

- Unit tests check agent and tool responses
- Trajectory tests validate end-to-end agent interactions
- Example sessions provided in markdown files (pre_booking_sample.md, post_booking_sample.md)
- Programmatic test examples in tests/programmatic_example.py

## Important Notes

- Always ensure virtual environments are activated before running agents
- Agents must be started in correct order (friend agents before host agent)
- Travel-concierge can load predefined itineraries for testing
- Both projects use mocked external services (flights, hotels, etc.) suitable for demonstrations