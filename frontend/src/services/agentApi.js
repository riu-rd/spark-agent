import axios from 'axios';

// Use the backend server as proxy to avoid CORS issues
const API_BASE_URL = 'http://localhost:3081/api';

// Create axios instance for agent communication
const agentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for agent responses
});

export const agentService = {
  // Create a new chat session
  async createSession() {
    try {
      console.log('Creating new chat session with host agent...');
      // ADK agents typically use a session-based approach
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { id: sessionId };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Send a message to the host agent
  async sendMessage(sessionId, message) {
    try {
      console.log(`Sending message to host agent: "${message}"`);
      
      // ADK agents expect messages in a specific format
      const payload = {
        session_id: sessionId,
        message: message,
        user_id: 'user_1', // Using the same user_id from database
        timestamp: new Date().toISOString(),
      };

      // Use the proxy endpoint to communicate with host agent
      const response = await agentApi.post('/agent/chat', payload);
      console.log('Host agent response:', response.data);
      
      // Check if we got an actual response or an error
      if (response.data.error) {
        throw new Error(response.data.message || response.data.error);
      }
      
      // Extract the message from the response
      if (response.data.message) {
        return {
          message: response.data.message,
          session_id: response.data.session_id,
          timestamp: response.data.timestamp,
          isError: false
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error sending message to host agent:', error);
      
      // If host agent is not available, provide helpful error message
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return {
          message: `I'm currently offline. Please ensure the host agent API is running:
1. Open a terminal
2. Navigate to: agents/host_agent_adk
3. Run: uv run python run_api.py

Also ensure the reconciler agent is running:
1. Open another terminal
2. Navigate to: agents/reconciler_agent
3. Run: uv run .

Once both agents are running, I'll be able to help you with your banking needs.`,
          isError: true
        };
      }
      
      // Return a fallback response for demo purposes
      return {
        message: "I'm processing your request. Please note that for full functionality, the host agent needs to be running on port 8000.",
        isError: true
      };
    }
  },

  // Send a message with streaming support for real-time updates
  async sendMessageStream(sessionId, message, onStatus, onComplete, onError) {
    try {
      console.log(`Sending streaming message to host agent: "${message}"`);
      
      // Create the request payload
      const payload = {
        session_id: sessionId,
        message: message,
        user_id: 'user_1',
        timestamp: new Date().toISOString(),
      };

      // Use EventSource for Server-Sent Events
      const eventSource = new EventSource(
        `${API_BASE_URL}/agent/chat/stream?` + new URLSearchParams({
          session_id: payload.session_id,
          message: payload.message,
          user_id: payload.user_id,
          timestamp: payload.timestamp
        })
      );

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          return;
        }

        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            // Intermediate status update
            onStatus(data.content);
          } else if (data.type === 'complete') {
            // Final response
            eventSource.close();
            onComplete(data.content);
          } else if (data.type === 'error') {
            // Error occurred
            eventSource.close();
            onError(new Error(data.content));
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        
        // Fall back to non-streaming if SSE fails
        this.sendMessage(sessionId, message)
          .then(response => {
            if (response.isError) {
              onError(new Error(response.message));
            } else {
              onComplete(response.message);
            }
          })
          .catch(onError);
      };

    } catch (error) {
      console.error('Error setting up streaming:', error);
      onError(error);
    }
  },

  // Check if host agent is available
  async checkHealth() {
    try {
      const response = await agentApi.get('/agent/health');
      return response.data;
    } catch (error) {
      console.error('Host agent health check failed:', error);
      return { status: 'offline', error: error.message };
    }
  },

  // Get agent capabilities
  async getCapabilities() {
    return {
      capabilities: [
        'Detect floating cash anomalies',
        'Route failed transactions for retry',
        'Query transaction history',
        'Provide payment resolution assistance',
        'Generate transaction reports'
      ]
    };
  }
};

export default agentService;