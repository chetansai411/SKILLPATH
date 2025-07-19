const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import our User model
const { protect } = require('../middleware/authMiddleware');
// --- @route   POST /api/auth/register ---
// --- @desc    Register a new user ---
// --- @access  Public ---
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Create a new user instance (password will be hashed by the pre-save hook in the model)
        user = new User({
            username,
            email,
            password,
        });

        // 3. Save the user to the database
        await user.save();

        // 4. Create and return a JWT token for immediate login
        const payload = {
            user: {
                id: user.id, // Mongoose uses 'id' as a virtual getter for '_id'
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Your secret key from .env
            { expiresIn: '5h' }, // Token expires in 5 hours
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// --- @route   POST /api/auth/login ---
// --- @desc    Authenticate user and get token ---
// --- @access  Public ---
/*router.post('/login', async (req, res) => {
    // The implementation for login will go here in the next step!
    res.send('Login Route');
});*/

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide an email and password' });
    }

    try {
        // 1. Check for user by email
        // We explicitly .select('+password') because we set select: false in the model
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // Use a generic message for security
        }

        // 2. Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' }); // Same generic message
        }

        // 3. User is valid, create and return a token
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

router.get('/me', protect, async (req, res) => {
    // Because the 'protect' middleware ran successfully,
    // we have access to the user's data on the request object.
    // req.user was attached by the middleware!
    res.json(req.user);
});


module.exports = router;