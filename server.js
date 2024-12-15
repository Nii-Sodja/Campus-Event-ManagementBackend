const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: "*",
  })
);

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
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
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Connect to MongoDB before starting the server
connectDB().then(() => {
    // API Routes
    app.use('/api/users', require('./api_routes/userRoutes'));
    app.use('/api/events', require('./api_routes/eventsRoutes'));

    // Default Route
    app.get('/', (req, res) => {
        res.send('Campus Event Management System API is running...');
    });

    // Health check route
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            message: 'Something broke!',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});