const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // We'll use a simple lessonId string for now.
    // In a bigger app, this would be a reference to a Lesson model.
    lessonId: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: [true, 'Note text cannot be empty'],
        trim: true,
    },
    timestamp: {
        type: Number, // Stored in seconds
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;