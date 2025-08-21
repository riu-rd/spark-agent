# SPARK Host Agent API Server

This API server enables your React frontend to communicate with the SPARK Host Agent for AI-powered banking transaction resolution.

## Setup Instructions

### Prerequisites
- Python 3.10+
- uv package manager
- PostgreSQL database configured
- `.env` file with necessary credentials

### Running the API Server

Instead of running `uv run adk web` (which opens a debug console), you'll run the API server that exposes REST endpoints:

```bash
# Navigate to the host agent directory
cd agents/host_agent_adk

# Install dependencies (if not already done)
uv sync

# Run the API server
uv run python run_api.py
```

The API server will start on **http://localhost:8000**

### API Endpoints

- **POST /chat** - Send messages to the agent
  ```json
  {
    "session_id": "session_123",
    "message": "Check my recent transactions",
    "user_id": "user_1"
  }
  ```

- **GET /health** - Check if the agent is online
- **GET /capabilities** - Get agent capabilities
- **POST /chat/stream** - Stream responses (SSE)
- **POST /trigger/discrepancy** - Trigger proactive alerts

### Full System Setup

To run the complete SPARK system with React frontend:

#### 1. Start the Reconciler Agent (Terminal 1)
```bash
cd agents/reconciler_agent
uv run .
```
This runs on port 8081

#### 2. Start the Host Agent API (Terminal 2)
```bash
cd agents/host_agent_adk
uv run python run_api.py
```
This runs on port 8000

#### 3. Start the Frontend Backend Server (Terminal 3)
```bash
cd frontend
npm install  # if not done already
npm run server  # or node server.js
```
This runs on port 3081

#### 4. Start the React Frontend (Terminal 4)
```bash
cd frontend
npm run dev
```
This runs on port 5173

### Testing the Integration

1. Open your browser to http://localhost:5173
2. Navigate to the chat interface
3. Send a message like "Check my transactions"
4. The message flow will be:
   - React Frontend (5173) → Backend Server (3081) → Host Agent API (8000)
   - Host Agent may communicate with Reconciler Agent (8081) as needed

### Troubleshooting

**Agent not responding?**
- Check that the API server is running on port 8000
- Check logs in the terminal running `run_api.py`
- Verify the Reconciler Agent is running on port 8081

**CORS errors?**
- The API server has CORS enabled for all origins
- If issues persist, check browser console for specific errors

**Database connection issues?**
- Verify `.env` file has correct database credentials
- Check PostgreSQL is running and accessible

### Development Tips

- The API server logs all requests and responses
- Use http://localhost:8000/docs for interactive API documentation (FastAPI)
- Session IDs persist across messages for conversation context
- The agent maintains state within each session

### Architecture

```
React Frontend (5173)
        ↓
Backend Proxy Server (3081)
        ↓
Host Agent API Server (8000)
        ↓
     Host Agent
        ↓
Reconciler Agent (8081) ← (when needed for transaction retry)
```