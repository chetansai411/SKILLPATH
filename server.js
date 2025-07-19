// server/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the connection function

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
//Middleware
app.use(cors());


// Body parser middleware (to accept JSON in request bodies)
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
    res.send('API is running...');
});

// Use the new auth routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/profiles', require('./routes/profileRoutes')); 
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});