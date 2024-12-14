const express = require('express');
const router = express.Router();
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth'); // Import the auth middleware
require("dotenv").config()

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id,
      email: user.email,
      name: user.name
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, preferences, isAdmin } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const user = await User.create({
      name,
      email,
      password,
      preferences,
      isAdmin
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        isAdmin: user.isAdmin,
        token: generateToken(user),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Generate token once
      const token = generateToken(user);
      
      console.log('Login - Token generation:', {
        user: {
          _id: user._id,
          email: user.email
        },
        tokenPreview: token.substring(0, 20) + '...'
      });

      const responseData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        preferences: user.preferences,
        token
      };

      res.json(responseData);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update preferences route
router.post('/preferences', auth, async (req, res) => {
    try {
        console.log('Updating preferences for user:', {
            userId: req.user._id,
            preferences: req.body,
            authHeader: req.headers.authorization ? 'Present' : 'Missing'
        });

        // Verify user exists
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('User not found:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Current user preferences:', user.preferences);
        console.log('New preferences:', req.body);

        // Update preferences with validation
        const validPreferences = {
            sports: !!req.body.sports,
            academic: !!req.body.academic,
            social: !!req.body.social,
            cultural: !!req.body.cultural,
            technology: !!req.body.technology
        };

        user.preferences = validPreferences;

        // Save and handle potential validation errors
        try {
            await user.save();
            console.log('Updated preferences:', user.preferences);
            
            res.json({ 
                message: 'Preferences saved successfully',
                preferences: user.preferences 
            });
        } catch (saveError) {
            console.error('Error saving user:', {
                error: saveError.message,
                validationErrors: saveError.errors
            });
            throw saveError;
        }
    } catch (error) {
        console.error('Error updating preferences:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id
        });
        res.status(500).json({ 
            message: 'Error updating preferences',
            details: error.message
        });
    }
});

// Add a route to get preferences
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ preferences: user.preferences });
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ message: 'Error fetching preferences' });
    }
});

module.exports = router;