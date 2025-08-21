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
        rawData: row
      };
    });
    
    res.json(transactions);
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

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log('CORS enabled for all origins');
  console.log('Database connection configured for:', process.env.DB_HOST);
});