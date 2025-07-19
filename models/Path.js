const mongoose = require('mongoose');

const PathSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    // Reference to the parent Domain
    domain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Domain',
        required: true,
    },
});

const Path = mongoose.model('Path', PathSchema);
module.exports = Path;