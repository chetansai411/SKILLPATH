// server/config/db.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Make sure dotenv can find the .env file

const connectDB = async () => {
    try {
        // mongoose.connect returns a promise, so we await it
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;