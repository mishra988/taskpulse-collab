import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './sockets/socketHandlers.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TaskFlow Real-Time Collaboration API',
  });
});

// Register real-time Socket.IO events
registerSocketHandlers(io);

// Start Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 TaskPulse Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO listening on port ${PORT}`);
    console.log(`🌐 Configured client URL: ${CLIENT_URL}`);
  });
};

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
});
