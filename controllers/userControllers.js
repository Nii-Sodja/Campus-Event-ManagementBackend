const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    const { name, email, password, preferences } = req.body;
    

    try {
        const user = new User({ name, email, password, preferences });
        await user.save();
        console.log("User saved")
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Something happened")
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Create token payload
        const payload = {
            _id: user._id,
            email: user.email,
            name: user.name
        };

        console.log('Creating token with payload:', payload);

        // Generate token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Token generated:', {
            tokenExists: !!token,
            tokenLength: token.length,
            tokenParts: token.split('.').length
        });

        // Send response
        const responseData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
            preferences: user.preferences
        };

        console.log('Sending response:', {
            hasToken: !!responseData.token,
            userId: responseData._id
        });

        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error logging in user', 
            error: error.message 
        });
    }
};

module.exports = { registerUser, login };