const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    youtubeVideoId: {
        type: String,
        required: true,
        unique: true,
    },
    // Reference to the parent Path
    path: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Path',
        required: true,
    },
    order: { // To keep lessons in sequence
        type: Number,
        required: true,
    },
});

const Lesson = mongoose.model('Lesson', LessonSchema);
module.exports = Lesson;