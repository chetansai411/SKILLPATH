const mongoose = require('mongoose');

const QnASchema = new mongoose.Schema({
    lessonId: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // This allows for threaded replies. A top-level question won't have a parentId.
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QnA',
        default: null,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// To quickly fetch user info along with the comment
QnASchema.pre(/^find/, function(next) {
    this.populate({
        path: 'userId',
        select: 'username profile.avatarUrl' // Select only username and avatar
    });
    next();
});

const QnA = mongoose.model('QnA', QnASchema);

module.exports = QnA;