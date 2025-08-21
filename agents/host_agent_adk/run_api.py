#!/usr/bin/env python
"""
Run script for SPARK Host Agent API Server
Usage: uv run python run_api.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from api_server import app
    import uvicorn
    
    print("=" * 60)
    print("SPARK Host Agent API Server")
    print("=" * 60)
    print("Starting server on http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")
    print("Health check: http://localhost:8000/health")
    print("=" * 60)
    print("\nPress Ctrl+C to stop the server\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )