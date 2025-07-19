const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Note = require('../models/Note');
const QnA = require('../models/QnA');
const mongoose = require('mongoose');

// --- @route   POST /api/activity/complete-lesson ---
// --- @desc    Logs a lesson completion, updates streak and calendar ---
// --- @access  Private ---
router.post('/complete-lesson', protect, async (req, res) => {

    const { lessonId } = req.body; // We'll need the frontend to send this

    if (!lessonId) {
        return res.status(400).json({ message: 'Lesson ID is required' });
    }


    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day in server's timezone

        // --- Part 1: Update Streak Logic ---
        const lastActivity = user.streak.lastActivityDate;
        if (lastActivity) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            // If last activity was yesterday, increment streak
            if (lastActivity.getTime() === yesterday.getTime()) {
                user.streak.current += 1;
            } 
            // If last activity was not today (and not yesterday), streak is broken
            else if (lastActivity.getTime() !== today.getTime()) {
                user.streak.current = 1; // Reset to 1 for today's activity
            }
        } else {
            // First activity ever
            user.streak.current = 1;
        }

        user.streak.lastActivityDate = today;
        if (user.streak.current > user.streak.longest) {
            user.streak.longest = user.streak.current;
        }

        if (!user.completedLessons.includes(lessonId)) {
            user.completedLessons.push(lessonId);
        }

        await user.save();


        // --- Part 2: Update Contribution Calendar Logic ---
        // Use findOneAndUpdate with upsert to either create a new activity log or increment an existing one
        await Activity.findOneAndUpdate(
            { userId: req.user.id, activityDate: today },
            { $inc: { completionCount: 1 } },
            { upsert: true, new: true }
        );
        
        res.json({
            message: 'Activity logged successfully',
            currentStreak: user.streak.current,
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// --- @route   GET /api/activity/calendar ---
// --- @desc    Get data for the contribution calendar ---
// --- @access  Public (or Private if you only want logged-in users to see it)
router.get('/calendar/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const activities = await Activity.find({
            userId: user._id,
            activityDate: { $gte: oneYearAgo },
        }).select('activityDate completionCount -_id'); // Select only needed fields

        res.json(activities);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.post('/notes', protect, async (req, res) => {
    const { lessonId, text, timestamp } = req.body;

    if (!lessonId || !text || timestamp === undefined) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const newNote = new Note({
            userId: req.user.id, // from the protect middleware
            lessonId,
            text,
            timestamp,
        });

        const savedNote = await newNote.save();
        res.status(201).json(savedNote);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   GET /api/activity/notes/:lessonId ---
// --- @desc    Get all notes for a specific lesson by the logged-in user ---
// --- @access  Private ---
router.get('/notes/:lessonId', protect, async (req, res) => {
    console.log(`--- [FLEXIBLE QUERY TEST] for lessonId: ${req.params.lessonId}`);
    try {
        // const userIdAsObject = mongoose.Types.ObjectId(req.user.id);
        const notes = await Note.find({
            userId: req.user.id,
            lessonId: req.params.lessonId,
        }).sort({ timestamp: 'asc' }); // Sort notes by their timestamp
        // console.log(`--- [GET /notes] Found ${notes.length} notes in the database.`);
        console.log(`--- [FLEXIBLE QUERY TEST] Found ${notes.length} notes in the database.`);
        res.json(notes);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.post('/qna', protect, async (req, res) => {
    const { lessonId, content, parentId = null } = req.body;

    if (!lessonId || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const newQnA = new QnA({
            userId: req.user.id,
            lessonId,
            content,
            parentId,
        });

        const savedQnA = await newQnA.save();
        // Manually populate the just-saved item so the response is complete
        const populatedQnA = await QnA.findById(savedQnA._id); 

        res.status(201).json(populatedQnA);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   GET /api/activity/qna/:lessonId ---
// --- @desc    Get all Q&A for a specific lesson ---
// --- @access  Public ---
router.get('/qna/:lessonId', async (req, res) => {
    try {
        // Fetch only top-level questions (where parentId is null)
        const questions = await QnA.find({
            lessonId: req.params.lessonId,
            parentId: null,
        }).sort({ createdAt: 'desc' }); // Show newest questions first

        res.json(questions);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// We can add routes for replies and upvotes later. This is a great start.
router.get('/qna/replies/:questionId', async (req, res) => {
    try {
        const replies = await QnA.find({
            parentId: req.params.questionId,
        }).sort({ createdAt: 'asc' }); // Show oldest replies first (chronological order)

        res.json(replies);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/qna/:id', protect, async (req, res) => {
    console.log(`--- DELETE /qna/:id route handler was reached for ID: ${req.params.id} ---`);
    // console.log(`--- User who made the request: ${req.user.username} ---`);

    // res.status(200).json({ message: 'DEBUG: Delete handler reached successfully.' });
    try {
        console.log('[1] Finding item by ID...');
        const qnaItem = await QnA.findById(req.params.id);
        console.log('[2] Checking if item exists...');
        if (!qnaItem) {
            console.log('[FAIL] Item not found in DB.');
            return res.status(404).json({ message: 'Item not found' });
        }
        console.log('[OK] Item found:', qnaItem);

        // --- OWNERSHIP CHECK ---
        // Convert both to strings for a safe comparison.
        // req.user.id comes from the 'protect' middleware.
        console.log('[3] Checking ownership...');
        console.log(`   - Item Owner ID: ${qnaItem.userId.toString()}`);
        console.log(`   - Requester ID:  ${req.user.id}`);
        if (qnaItem.userId._id.toString() !== req.user.id) {
            console.log('[FAIL] Ownership check failed.');
            return res.status(401).json({ message: 'User not authorized to delete this item' });
        }
        console.log('[OK] Ownership confirmed.');

        // If the item is a top-level question, we should also delete all its replies.
        console.log('[4] Checking if it is a parent question...');
        if (!qnaItem.parentId) {
            console.log('   - It is a parent. Deleting replies...');
            await QnA.deleteMany({ parentId: req.params.id });
            console.log('   - Replies deleted.');
        }
        console.log('[5] Removing the main item...');
        // await qnaItem.remove();
        await QnA.findByIdAndDelete(req.params.id);
        
        console.log('[OK] Item removed.');

        console.log('[6] Sending success response.');
        res.json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('--- [FATAL ERROR in DELETE /qna/:id] ---');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.put('/qna/:id', protect, async (req, res) => {
    
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content cannot be empty' });
    }

    try {
        let qnaItem = await QnA.findById(req.params.id);

        if (!qnaItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // --- OWNERSHIP CHECK (CRITICAL) ---
        if (qnaItem.userId._id.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to edit this item' });
        }

        // Update the content and save
        qnaItem.content = content;
        await qnaItem.save();
        
        // Manually re-populate the user data after saving so the response is complete
        qnaItem = await QnA.findById(req.params.id);

        res.json(qnaItem);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;