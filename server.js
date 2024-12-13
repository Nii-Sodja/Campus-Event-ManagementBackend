const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors());         // Enable Cross-Origin Resource Sharing

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    auth: req.headers.authorization
  });
  next();
});

// Import Routes
const userRoutes = require('./api_routes/userRoutes');
const eventsRoutes = require('./api_routes/eventsRoutes');
// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit with failure
  }
};
connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventsRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('Campus Event Management System API is running...');
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});