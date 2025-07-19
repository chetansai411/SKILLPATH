const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activityDate: {
        type: Date,
        required: true,
    },
    completionCount: {
        type: Number,
        default: 1,
    },
});


ActivitySchema.index({ userId: 1, activityDate: 1 }, { unique: true });

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = Activity;