// IMPORT DEPENDENCIES
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

// Import database connection
import connectDB from './config/db.js';

// Import route files
import authRoutes from './routes/authRoutes.js';
import burialRoutes from './routes/burialRoutes.js';
import permitRoutes from './routes/permitRoutes.js';
import leaseRoutes from './routes/leaseRoutes.js';
import plotRoutes from './routes/plotRoutes.js';

// INITIALIZE APP
const app = express();
const PORT = process.env.PORT || 5000;

// CONNECT TO DATABASE
connectDB();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedLocalOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
    ];

    const isLocal = allowedLocalOrigins.includes(origin);
    const isDevTunnel = origin.includes('devtunnels.ms');
    const isProductionFrontend = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;
    const isVercelPreview = origin.endsWith('.vercel.app');

    if (isLocal || isDevTunnel || isProductionFrontend || isVercelPreview) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Bypass-Tunnel-Reminder'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,  // cors middleware handles OPTIONS preflight internally
  optionsSuccessStatus: 204, // returns 204 for preflight requests
}));

// BODY PARSING MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SECURITY HEADERS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/burials', burialRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/plots', plotRoutes);

// ROOT
app.get('/', (req, res) => {
  res.json({
    message: 'Cemetery Management System API',
    status: 'running',
    environment: process.env.NODE_ENV || 'production',
  });
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
  });
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// START SERVER
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
});