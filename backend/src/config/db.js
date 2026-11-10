import mongoose from 'mongoose';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Connect to MongoDB Atlas / Replica Set
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'bike';

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
}

/**
 * Disconnect cleanly from MongoDB
 */
export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed cleanly.');
  } catch (error) {
    console.error('[MongoDB] Error during disconnection:', error.message);
  }
}

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[MongoDB Event] Mongoose connected to DB cluster.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Event] Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Event] Mongoose connection lost / disconnected.');
});

// Process signal handling for clean shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

export default connectDB;

