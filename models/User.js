const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [ // Regex to validate email format
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false, // Don't send password back in responses
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Only allows these two values
        default: 'user',
    },
    // We will add profile fields later
    // profile: { ... }
      profile: {
        fullName: { type: String, default: '' },
        bio: { type: String, default: '', maxlength: 250 },
        avatarUrl: { type: String, default: 'assets/images/default-avatar.png' }, // A default avatar
        socialLinks: {
            github: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            website: { type: String, default: '' },
        },
    },

    // --- ADD NEW STREAK FIELDS ---
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActivityDate: { type: Date, default: null },
    },
     
    completedLessons: [{
        type: String, // We'll store the YouTube Video ID
    }],
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to HASH a password before saving a new user
UserSchema.pre('save', async function (next) {
    // Only run this function if password was modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password with a salt round of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;