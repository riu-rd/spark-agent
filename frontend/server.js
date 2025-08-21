import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.API_PORT || 3081;

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  // @ts-ignore
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Query params:', req.query);
  next();
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching user data for: ${userId}`);
    const result = await pool.query(
      'SELECT user_id, wallet_balance FROM users WHERE user_id = $1',
      [userId]
    );
    console.log(`User query result:`, result.rows);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    console.log(`Fetching transactions for user: ${userId}, limit: ${limit}, offset: ${offset}`);
    
    const result = await pool.query(
      `SELECT 
        transaction_id,
        user_id,
        timestamp_initiated,
        amount,
        transaction_type,
        recipient_type,
        recipient_account_id,
        recipient_bank_name_or_ewallet,
        device_id,
        location_coordinates,
        simulated_network_latency,
        status_timestamp_1,
        status_1,
        status_timestamp_2,
        status_2,
        status_timestamp_3,
        status_3,
        status_timestamp_4,
        status_4,
        expected_completion_time,
        is_floating_cash,
        floating_duration_minutes,
        is_fraudulent_attempt,
        is_cancellation,
        is_retry_successful,
        manual_escalation_needed,
        transaction_types
      FROM transactions 
      WHERE user_id = $1 
      ORDER BY timestamp_initiated DESC 
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    console.log(`Found ${result.rows.length} transactions for user ${userId}`);
    
    // Check for RT transactions that need to be processed
    let walletUpdateAmount = 0;
    const rtTransactionsToProcess = [];
    
    for (const transaction of result.rows) {
      // Check if this is an RT transaction with null transaction_types (not yet processed)
      if (transaction.transaction_id && 
          transaction.transaction_id.startsWith('RT') && 
          transaction.transaction_types === null) {
        
        console.log(`Found unprocessed RT transaction: ${transaction.transaction_id}, amount: ${transaction.amount}`);
        rtTransactionsToProcess.push(transaction);
        walletUpdateAmount += parseFloat(transaction.amount);
      }
    }
    
    // If we found RT transactions to process, update wallet and mark them as DONE
    if (rtTransactionsToProcess.length > 0) {
      console.log(`Processing ${rtTransactionsToProcess.length} RT transactions, total amount: ${walletUpdateAmount}`);
      
      // Start a transaction for atomicity
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Update wallet balance
        const updateBalanceResult = await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE user_id = $2 RETURNING wallet_balance',
          [walletUpdateAmount, userId]
        );
        
        console.log(`Updated wallet balance for ${userId}: new balance = ${updateBalanceResult.rows[0].wallet_balance}`);
        
        // Mark RT transactions as DONE
        for (const rtTxn of rtTransactionsToProcess) {
          await client.query(
            'UPDATE transactions SET transaction_types = $1 WHERE transaction_id = $2',
            ['DONE', rtTxn.transaction_id]
          );
          console.log(`Marked transaction ${rtTxn.transaction_id} as DONE`);
        }
        
        await client.query('COMMIT');
        
        // Update the transaction_types in our result set to reflect the changes
        result.rows.forEach(row => {
          if (rtTransactionsToProcess.find(rt => rt.transaction_id === row.transaction_id)) {
            row.transaction_types = 'DONE';
          }
        });
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing RT transactions:', error);
        throw error;
      } finally {
        client.release();
      }
    }
    
    const transactions = result.rows.map(row => {
      let currentStatus = 'pending';
      let statusTimestamp = row.timestamp_initiated;
      
      if (row.status_4) {
        currentStatus = row.status_4;
        statusTimestamp = row.status_timestamp_4;
      } else if (row.status_3) {
        currentStatus = row.status_3;
        statusTimestamp = row.status_timestamp_3;
      } else if (row.status_2) {
        currentStatus = row.status_2;
        statusTimestamp = row.status_timestamp_2;
      } else if (row.status_1) {
        currentStatus = row.status_1;
        statusTimestamp = row.status_timestamp_1;
      }
      
      const status = currentStatus === 'completed' ? 'completed' : 
                    currentStatus === 'failed' ? 'failed' : 
                    'processing';
      
      return {
        id: row.transaction_id,
        type: row.transaction_type === 'send_money' || row.transaction_type === 'bank_transfer' ? 'send' : 
              row.transaction_type === 'receive_money' ? 'receive' : 'send',
        recipient: row.recipient_account_id || row.recipient_bank_name_or_ewallet || 'Unknown',
        amount: parseFloat(row.amount),
        status: status,
        date: row.timestamp_initiated,
        method: row.recipient_type || row.transaction_type || 'Bank Transfer',
        source: 'database',
        isFloatingCash: row.is_floating_cash,
        floatingDuration: row.floating_duration_minutes,
        isFraudulent: row.is_fraudulent_attempt,
        isCancellation: row.is_cancellation,
        isRetrySuccessful: row.is_retry_successful,
        needsEscalation: row.manual_escalation_needed,
        rawData: row,
        transactionTypes: row.transaction_types
      };
    });
    
    // Include wallet update info in response if RT transactions were processed
    const response = {
      transactions: transactions,
      walletUpdated: rtTransactionsToProcess.length > 0,
      walletUpdateAmount: walletUpdateAmount,
      processedRTCount: rtTransactionsToProcess.length
    };
    
    // If not returning wrapper object for backward compatibility, just return transactions
    if (rtTransactionsToProcess.length === 0) {
      res.json(transactions);
    } else {
      // Include metadata about the wallet update
      res.json({
        transactions: transactions,
        walletUpdated: true,
        walletUpdateAmount: walletUpdateAmount,
        processedRTTransactions: rtTransactionsToProcess.map(t => t.transaction_id),
        message: `Wallet updated: +₱${walletUpdateAmount.toFixed(2)} from ${rtTransactionsToProcess.length} retry transaction(s)`
      });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const countResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_4 = 'completed' OR status_3 = 'completed' OR status_2 = 'completed' OR status_1 = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status_4 = 'failed' OR status_3 = 'failed' OR status_2 = 'failed' OR status_1 = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN is_floating_cash = true THEN 1 ELSE 0 END) as floating_cash,
        SUM(CASE WHEN manual_escalation_needed = true THEN 1 ELSE 0 END) as needs_escalation
      FROM transactions 
      WHERE user_id = $1`,
      [userId]
    );
    
    const stats = countResult.rows[0];
    stats.processing = stats.total - stats.completed - stats.failed;
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const transaction = req.body;
    
    const result = await pool.query(
      `INSERT INTO transactions (
        transaction_id,
        user_id,
        timestamp_initiated,
        amount,
        transaction_type,
        recipient_account_id,
        recipient_bank_name_or_ewallet,
        status_1,
        status_timestamp_1
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        transaction.id || `TXN_${Date.now()}`,
        userId,
        new Date(),
        transaction.amount,
        transaction.type === 'send' ? 'send_money' : 'receive_money',
        transaction.recipient,
        transaction.method,
        'processing',
        new Date()
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for creating floating cash transactions with all fields
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = req.body;
    console.log('Creating new transaction:', transaction.transaction_id);
    
    const result = await pool.query(
      `INSERT INTO transactions (
        transaction_id,
        user_id,
        timestamp_initiated,
        amount,
        transaction_type,
        recipient_type,
        recipient_account_id,
        recipient_bank_name_or_ewallet,
        device_id,
        location_coordinates,
        simulated_network_latency,
        status_timestamp_1,
        status_1,
        status_timestamp_2,
        status_2,
        status_timestamp_3,
        status_3,
        status_timestamp_4,
        status_4,
        expected_completion_time,
        is_floating_cash,
        floating_duration_minutes,
        is_fraudulent_attempt,
        is_cancellation,
        is_retry_successful,
        manual_escalation_needed,
        transaction_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27) 
      RETURNING *`,
      [
        transaction.transaction_id,
        transaction.user_id,
        transaction.timestamp_initiated,
        transaction.amount,
        transaction.transaction_type,
        transaction.recipient_type,
        transaction.recipient_account_id,
        transaction.recipient_bank_name_or_ewallet,
        transaction.device_id,
        transaction.location_coordinates,
        transaction.simulated_network_latency,
        transaction.status_timestamp_1,
        transaction.status_1,
        transaction.status_timestamp_2,
        transaction.status_2,
        transaction.status_timestamp_3,
        transaction.status_3,
        transaction.status_timestamp_4,
        transaction.status_4,
        transaction.expected_completion_time,
        transaction.is_floating_cash,
        transaction.floating_duration_minutes,
        transaction.is_fraudulent_attempt,
        transaction.is_cancellation,
        transaction.is_retry_successful,
        transaction.manual_escalation_needed,
        transaction.transaction_types
      ]
    );
    
    console.log('Transaction created successfully:', result.rows[0].transaction_id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy endpoints for Host Agent (ADK)
app.post('/api/agent/chat', async (req, res) => {
  try {
    console.log('Proxying chat request to host agent:', req.body);
    // Forward request to host agent API on port 8000
    const axios = (await import('axios')).default;
    const response = await axios.post('http://localhost:8000/chat', req.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Host agent response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to host agent:', error.message);
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Host agent is not running',
        message: 'Please start the host agent API with: uv run python run_api.py'
      });
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Host agent error response:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to communicate with host agent' });
    }
  }
});

// Streaming chat endpoint using Server-Sent Events
app.get('/api/agent/chat/stream', async (req, res) => {
  try {
    console.log('Proxying streaming chat request to host agent:', req.query);
    
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Create request body from query params
    const requestBody = {
      session_id: req.query.session_id,
      message: req.query.message,
      user_id: req.query.user_id || 'user_1',
      timestamp: req.query.timestamp || new Date().toISOString()
    };
    
    // Forward streaming request to host agent API on port 8000
    const axios = (await import('axios')).default;
    const response = await axios.post('http://localhost:8000/chat/stream', requestBody, {
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      }
    });
    
    // Pipe the stream from host agent to client
    response.data.on('data', (chunk) => {
      res.write(chunk);
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected from stream');
      if (response.data && response.data.destroy) {
        response.data.destroy();
      }
    });
    
  } catch (error) {
    console.error('Error setting up streaming proxy:', error.message);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      content: 'Failed to connect to host agent streaming endpoint' 
    })}\n\n`);
    res.end();
  }
});

app.get('/api/agent/health', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('http://localhost:8000/health', {
      timeout: 5000
    });
    console.log('Host agent health check:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Host agent health check failed:', error.message);
    res.status(503).json({ status: 'offline', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log('CORS enabled for all origins');
  console.log('Database connection configured for:', process.env.DB_HOST);
  console.log('Host agent proxy enabled on /api/agent/*');
});