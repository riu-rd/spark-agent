"""
API Server for SPARK Host Agent
Provides HTTP REST endpoints for React frontend communication
"""

import asyncio
import json
import uuid
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from host.agent import HostAgent, RECONCILER_AGENT_URL

load_dotenv()

app = FastAPI(title="SPARK Host Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

host_agent: Optional[HostAgent] = None
sessions: Dict[str, Dict[str, Any]] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str = "user_1"
    timestamp: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    session_id: str
    timestamp: str
    is_complete: bool = True
    metadata: Optional[Dict[str, Any]] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the Host Agent on server startup."""
    global host_agent
    print("Initializing SPARK Host Agent API Server...")
    
    remote_agent_urls = [RECONCILER_AGENT_URL]
    
    try:
        host_agent = await HostAgent.create(remote_agent_addresses=remote_agent_urls)
        print(f"[OK] Host Agent initialized successfully")
        print(f"[OK] Connected agents: {list(host_agent.remote_agent_connections.keys())}")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Host Agent: {e}")
        print("  Note: The server will still start but some features may be limited")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online" if host_agent else "initializing",
        "timestamp": datetime.now().isoformat(),
        "agent": "SPARK_Host_Agent",
        "connected_agents": list(host_agent.remote_agent_connections.keys()) if host_agent else []
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint for React frontend.
    Processes messages through the Host Agent.
    """
    if not host_agent:
        raise HTTPException(status_code=503, detail="Host Agent not initialized")
    
    try:
        print(f"[API] Received chat request - Session: {request.session_id}, Message: {request.message}")
        
        # Store session info
        if request.session_id not in sessions:
            sessions[request.session_id] = {
                "created_at": datetime.now().isoformat(),
                "user_id": request.user_id,
                "messages": []
            }
        
        sessions[request.session_id]["messages"].append({
            "role": "user",
            "content": request.message,
            "timestamp": request.timestamp or datetime.now().isoformat()
        })
        
        # Process through host agent
        response_text = ""
        async for event in host_agent.stream(
            query=request.message,
            session_id=request.session_id
        ):
            if event.get("is_task_complete"):
                response_text = event.get("content", "")
                break
            else:
                # For non-streaming response, we just collect updates
                print(f"[API] Processing: {event.get('updates', '')}")
        
        # Store agent response
        sessions[request.session_id]["messages"].append({
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now().isoformat()
        })
        
        return ChatResponse(
            message=response_text,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            is_complete=True
        )
        
    except Exception as e:
        print(f"[API] Error processing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint for real-time responses.
    Returns Server-Sent Events (SSE) stream.
    """
    if not host_agent:
        raise HTTPException(status_code=503, detail="Host Agent not initialized")
    
    async def generate() -> AsyncGenerator[str, None]:
        try:
            print(f"[API] Starting stream for session: {request.session_id}")
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing your message...', 'timestamp': time.time()})}\n\n"
            await asyncio.sleep(0.1)
            
            # Check if message contains transaction-related keywords
            message_lower = request.message.lower()
            if any(word in message_lower for word in ['transaction', 'payment', 'transfer', 'money', 'problem', 'issue', 'failed']):
                yield f"data: {json.dumps({'type': 'status', 'content': 'Scanning transaction records...', 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.5)
                
                yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing transaction patterns...', 'timestamp': time.time()})}\n\n"
                await asyncio.sleep(0.5)
            
            # Process through host agent with status updates
            response_text = ""
            flagged_transactions = False
            consulting_agents = False
            
            async for event in host_agent.stream( # type: ignore
                query=request.message,
                session_id=request.session_id
            ):
                if event.get("is_task_complete"):
                    response_text = event.get('content', '')
                    
                    # Send final response
                    yield f"data: {json.dumps({'type': 'complete', 'content': response_text, 'timestamp': time.time()})}\n\n"
                    yield "data: [DONE]\n\n"
                    break
                else:
                    updates = event.get('updates', '')
                    
                    # Parse updates to provide specific status messages
                    if 'consulting with bpi specialist' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Consulting with BPI specialist agents...', 'timestamp': time.time()})}\n\n"
                        await asyncio.sleep(0.3)
                    elif 'connected to reconciler' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Connected to transaction reconciliation specialist...', 'timestamp': time.time()})}\n\n"
                        await asyncio.sleep(0.2)
                    elif 'checking transaction patterns' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Checking transaction patterns...', 'timestamp': time.time()})}\n\n"
                        await asyncio.sleep(0.3)
                    elif 'evaluating for anomalies' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Evaluating for anomalies...', 'timestamp': time.time()})}\n\n"
                        await asyncio.sleep(0.3)
                    elif 'analyzing' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing transaction details...', 'timestamp': time.time()})}\n\n"
                    elif 'flagged' in updates.lower() and not flagged_transactions:
                        flagged_transactions = True
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Detected potential issues in transactions...', 'timestamp': time.time()})}\n\n"
                        await asyncio.sleep(0.3)
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Preparing resolution strategy...', 'timestamp': time.time()})}\n\n"
                    elif 'retry' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Initiating transaction retry process...', 'timestamp': time.time()})}\n\n"
                    elif 'report' in updates.lower():
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Generating detailed report...', 'timestamp': time.time()})}\n\n"
                    
                    print(f"[API] Stream update: {updates}")
                    
        except Exception as e:
            print(f"[API] Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e), 'timestamp': time.time()})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/trigger/discrepancy")
async def trigger_discrepancy(transaction_id: str):
    """
    Trigger a proactive discrepancy alert for a transaction.
    This simulates the external Discrepancy Detector.
    """
    if not host_agent:
        raise HTTPException(status_code=503, detail="Host Agent not initialized")
    
    try:
        session_id = await host_agent.trigger_discrepancy_alert(transaction_id)
        
        # Start the proactive conversation
        response_text = ""
        metadata = {
            "trigger_type": "discrepancy_detected",
            "transaction_id": transaction_id
        }
        
        async for event in host_agent.stream(
            query="",  # Empty query, the agent will handle the proactive message
            session_id=session_id,
            metadata=metadata
        ):
            if event.get("is_task_complete"):
                response_text = event.get("content", "")
                break
        
        return {
            "session_id": session_id,
            "transaction_id": transaction_id,
            "initial_message": response_text,
            "status": "alert_triggered"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session history."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]


@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear a specific session."""
    if session_id in sessions:
        del sessions[session_id]
        return {"message": "Session cleared"}
    return {"message": "Session not found"}


@app.get("/capabilities")
async def get_capabilities():
    """Get agent capabilities."""
    return {
        "agent": "SPARK_Host_Agent",
        "capabilities": [
            "Detect floating cash anomalies",
            "Route failed transactions for retry",
            "Query transaction history", 
            "Provide payment resolution assistance",
            "Generate transaction reports",
            "Proactive discrepancy alerts"
        ],
        "connected_agents": list(host_agent.remote_agent_connections.keys()) if host_agent else [],
        "status": "online" if host_agent else "offline"
    }


if __name__ == "__main__":
    print("Starting SPARK Host Agent API Server...")
    print("Server will be available at http://localhost:8000")
    print("API documentation available at http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )