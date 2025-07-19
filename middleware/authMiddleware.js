const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    console.log('--- PROTECT MIDDLEWARE RUNNING ---');
    let token;

    // Check if the token is sent in the headers and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // 1. Get token from header (e.g., "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];
            console.log('Token found:', token);
            console.log('Verifying token with secret:', process.env.JWT_SECRET);
            

            // 2. Verify the token using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', decoded);

            // 3. Get user from the token's payload and attach it to the request object
            // We exclude the password when fetching the user data
            req.user = await User.findById(decoded.user.id).select('-password');
            console.log('User found in DB:', req.user.username);

            if (!req.user) {
                console.log('Error: User specified in token not found in DB.');
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // 4. Move on to the next step (the actual route handler)
            console.log('--- AUTHORIZATION SUCCESSFUL ---');
            next();
        } catch (error) {
            console.error('Error Name:', error.name);
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('Error: No token found in headers.');
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
const admin = (req, res, next) => {
    // This middleware should run AFTER the 'protect' middleware,
    // so we will have access to req.user.
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed to the route
    } else {
        res.status(403).json({ message: 'Forbidden: Not authorized as an admin' });
    }
};

module.exports = { protect, admin};