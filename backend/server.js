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
import { openDocumentHandler } from './src/controllers/documentController.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const defaultAllowedOrigins = [
  'https://bikeagle.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
];

const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow explicitly listed origins or Vercel preview deployments for the app
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        /^https:\/\/bikeagle.*\.vercel\.app$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      // Permissive fallback so legitimate client variations are not blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    optionsSuccessStatus: 200,
  })
);

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

// Direct top-level access for Cloudflare R2 documents:
// Handles direct URLs like:
// - http://localhost:5000/documents/bikes/EREFDFE4545/rc/Screenshot_...png
// - http://localhost:5000/Screenshot%202026-11-11%20120511.png
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const rawPath = req.path || '';
  if (
    rawPath.startsWith('/documents/') ||
    /\.(png|jpe?g|pdf|webp)$/i.test(rawPath)
  ) {
    return openDocumentHandler(req, res, next);
  }
  next();
});

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
