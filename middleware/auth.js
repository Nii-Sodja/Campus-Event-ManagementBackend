const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth middleware - Headers:', {
            authorization: authHeader ? 'Present' : 'Missing',
            contentType: req.headers['content-type']
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Invalid authorization header format' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verification successful:', {
                decodedId: decoded._id,
                decodedEmail: decoded.email
            });

            // Make sure we have the required fields
            if (!decoded._id || !decoded.email) {
                return res.status(401).json({ 
                    message: 'Token missing required fields' 
                });
            }

            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error('Token verification failed:', {
                error: jwtError.message,
                type: jwtError.name
            });
            return res.status(401).json({ 
                message: 'Invalid or expired token',
                details: jwtError.message 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            message: 'Server error during authentication',
            details: error.message 
        });
    }
};

module.exports = auth;