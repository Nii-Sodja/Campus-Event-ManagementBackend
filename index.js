const express = require('express');
const app = express();
const cors = require('cors');

// Basic middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/', (req, res) => {
    res.json({ message: "Server is running!" });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});