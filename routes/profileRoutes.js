const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // To protect our update route
const User = require('../models/User');

// --- @route   GET /api/profiles/:username ---
// --- @desc    Get a user's profile by username ---
// --- @access  Public ---
router.get('/:username', async (req, res) => {
    try {
        const userProfile = await User.findOne({ username: req.params.username })
                                      .select('-password'); // Always exclude the password

        if (!userProfile) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(userProfile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   PUT /api/profiles/me ---
// --- @desc    Update the logged-in user's profile ---
// --- @access  Private ---
router.put('/me', protect, async (req, res) => {
    // The user's ID is available from the 'protect' middleware via req.user.id
    const { fullName, bio, avatarUrl, socialLinks } = req.body;

    // Build the profile object from the request body
    const profileFields = {};
    if (fullName) profileFields.fullName = fullName;
    if (bio) profileFields.bio = bio;
    if (avatarUrl) profileFields.avatarUrl = avatarUrl;
    
    // Build social links object
    profileFields.socialLinks = {};
    if (socialLinks) {
        if (socialLinks.github) profileFields.socialLinks.github = socialLinks.github;
        if (socialLinks.linkedin) profileFields.socialLinks.linkedin = socialLinks.linkedin;
        if (socialLinks.website) profileFields.socialLinks.website = socialLinks.website;
    }

    try {
        // Find the user and update their profile
        // Using findByIdAndUpdate with the $set operator is efficient
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profile: profileFields } },
            { new: true, runValidators: true } // 'new: true' returns the updated document
        ).select('-password');

        res.json(updatedUser);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.get('/me/completed-lessons', protect, async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware, but it might not have the
        // completedLessons field if it wasn't populated. A direct DB call is safest.
        const user = await User.findById(req.user.id).select('completedLessons');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.completedLessons);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;