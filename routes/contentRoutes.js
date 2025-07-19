const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Domain = require('../models/Domain');
const Path = require('../models/Path');
const Lesson = require('../models/lesson');

// --- @route   GET /api/content/domains ---
// --- @desc    Get all job roles/domains ---
// --- @access  Public ---
router.get('/domains', async (req, res) => {
    try {
        const domains = await Domain.find();
        res.json(domains);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- @route   GET /api/content/paths/:domainSlug ---
// --- @desc    Get all learning paths for a specific domain ---
// --- @access  Public ---
router.get('/paths/:domainSlug', async (req, res) => {
    try {
        const domain = await Domain.findOne({ slug: req.params.domainSlug });
        if (!domain) {
            return res.status(404).json({ msg: 'Domain not found' });
        }
        
        const paths = await Path.find({ domain: domain._id });
        res.json({ domain, paths });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- @route   GET /api/content/lessons/:pathId ---
// --- @desc    Get all lessons for a specific learning path ---
// --- @access  Public ---
router.get('/lessons/:pathId', async (req, res) => {
    try {
        // const path = await Path.findById(req.params.pathId);
        const pathId = req.params.pathId;
          if (!mongoose.Types.ObjectId.isValid(pathId)) {
            return res.status(400).json({ msg: 'Invalid Path ID format' });
        }

        const path = await Path.findById(pathId);
        if (!path) {
            return res.status(404).json({ msg: 'Path not found' });
        }

         const lessons = await Lesson.find({ path: pathId }).sort({ order: 1 });

        // const lessons = await Lesson.find({ path: req.params.pathId }).sort({ order: 1 });
        res.json({ path, lessons });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/lesson/:videoId', async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ youtubeVideoId: req.params.videoId });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        
        // We can also populate the path and domain info if we want to show breadcrumbs later
        // For now, just sending the lesson is enough.
        res.json(lesson);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// router.get('/paths', async (req, res) => {

//     try {

//         const paths = await Path.find().populate('domain', 'name');
//         res.json(paths);
//     } catch (err) { res.status(500).send('Server Error'); }
// });
// --- @route   GET /api/content/paths-all ---
// --- @desc    Get ALL learning paths for the admin panel dropdown ---
// --- @access  Public ---
router.get('/paths-all', async (req, res) => {
    try {
        // We populate the 'domain' field to get the domain's name
        // This lets us display "Frontend Developer - Mastering React.js" in the dropdown
        const paths = await Path.find().populate('domain', 'name').select('title domain');
        res.json(paths);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/lessons-all', async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ order: 1 }).populate({
            path: 'path',
            select: 'title',
        });
        res.json(lessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;