const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    slug: { // URL-friendly version of the name
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
});

const Domain = mongoose.model('Domain', DomainSchema);
module.exports = Domain;