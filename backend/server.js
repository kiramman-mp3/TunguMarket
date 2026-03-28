import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection pool
const { Pool } = pg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'tungumarket',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

// Test DB Connection
pool.connect()
  .then(() => console.log('Successfully connected to PostgreSQL database'))
  .catch((err) => console.error('Error connecting to the database', err.stack));

// Basic Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
