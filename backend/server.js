import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import * as models from './src/models/index.js';

// Import Route Handlers
import authRoutes from './src/routes/authRoutes.js';
import bikeRoutes from './src/routes/bikeRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import ownerRoutes from './src/routes/ownerRoutes.js';
import renterRoutes from './src/routes/renterRoutes.js';
import supportRoutes from './src/routes/supportRoutes.js';
import hubRoutes from './src/routes/hubRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import seedRoutes from './src/routes/seedRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:8081,http://localhost:19006,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev mode
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API route
app.get('/', (req, res) => {
  res.json({
    name: 'The Road Eagle (Bike_Rentals) API',
    version: '1.0.0',
    status: 'ONLINE',
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    modelsCount: Object.keys(models).length,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'HEALTHY' : 'UNHEALTHY',
    database: {
      connected: isConnected,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes (Both /api/v1 and /api for high compatibility)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/v1/owners', ownerRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/v1/renters', renterRoutes);
app.use('/api/renters', renterRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/v1/hubs', hubRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/seed', seedRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/documents', documentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

import { cleanupExpiredBookings } from './src/controllers/bookingController.js';

// Start Server
async function startServer() {
  app.listen(PORT, () => {
    console.log(`[The Road Eagle Backend] Server running on http://localhost:${PORT}`);
  });

  try {
    await connectDB();
    console.log(`[The Road Eagle Backend] Connected to MongoDB database: "${mongoose.connection.name}"`);

    // Run automated data cleanup immediately on startup, then every 60 seconds
    cleanupExpiredBookings().catch(() => {});
    setInterval(() => {
      cleanupExpiredBookings().catch(() => {});
    }, 60 * 1000);
    console.log('[Automated Cleanup] Expired booking and document cleanup worker started (60s interval).');
  } catch (err) {
    console.warn(`[MongoDB Notice]: Remote MongoDB Atlas connection unavailable (${err.message}). Server running in offline-resilient mode.`);
  }
}

startServer();

export default app;
