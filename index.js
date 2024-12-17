const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.body,
        query: req.query
    });
    next();
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
      'http://localhost:5173',  
      'http://localhost:5175',
        'https://campus-event-management-frontend.vercel.app',
        'https://campus-frontend-murex.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
};

// Connect to MongoDB before starting the server
const startServer = async () => {
    const isConnected = await connectDB();
    if (!isConnected) {
        console.error('Failed to connect to MongoDB. Server will not start.');
        process.exit(1);
    }

    // Add this before your routes
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
            headers: req.headers,
            query: req.query,
            body: req.method === 'POST' ? req.body : undefined
        });
        next();
    });

    // API Routes
    app.use('/api/users', require('./api_routes/userRoutes'));
    app.use('/api/events', require('./api_routes/eventsRoutes'));

    // Add a health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        });
    });

    // Add this after your routes to catch unmatched routes
    app.use((req, res) => {
        console.log(`[404] Route not found: ${req.method} ${req.url}`);
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.url} not found`,
            availableRoutes: {
                events: '/api/events',
                users: '/api/users',
                auth: '/api/users/login'
            }
        });
    });

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            message: 'Campus Event Management System API',
            version: '1.0.0',
            endpoints: {
                auth: '/api/users/login',
                events: '/api/events',
                status: '/api/status'
            },
            documentation: 'API documentation coming soon'
        });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    });

    // 404 handler
    app.use((req, res) => {
        console.log(`404: ${req.method} ${req.url} not found`);
        res.status(404).json({
            message: 'Route not found',
            requested: {
                method: req.method,
                url: req.url
            }
        });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        console.log(`API available at: ${process.env.NODE_ENV === 'production' ? 'https://campus-event-managementbackend-2z5g.onrender.com' : `http://localhost:${PORT}`}`);
    });
};

startServer().catch(console.error);