const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Domain = require('../models/Domain');
const Path = require('../models/Path');
const Lesson = require('../models/lesson');


router.post('/domains', protect, admin, async (req, res) => {
    const { name, slug, description, imageUrl } = req.body;

    try {
        const domainExists = await Domain.findOne({ slug });
        if (domainExists) {
            return res.status(400).json({ message: 'Domain with this slug already exists' });
        }

        const domain = new Domain({
            name,
            slug,
            description,
            imageUrl,
        });

        const createdDomain = await domain.save();
        res.status(201).json(createdDomain);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.post('/paths', protect, admin, async (req, res) => {
    // We expect title, description, and the ID of the parent domain
    const { title, description, domainId } = req.body;

    if (!title || !description || !domainId) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Optional: Check if the domainId provided actually exists
        const parentDomain = await Domain.findById(domainId);
        if (!parentDomain) {
            return res.status(404).json({ message: 'Parent domain not found' });
        }

        const path = new Path({
            title,
            description,
            domain: domainId, // Assign the parent domain's ID
        });

        const createdPath = await path.save();
        res.status(201).json(createdPath);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.post('/lessons', protect, admin, async (req, res) => {
    const { title, youtubeVideoId, pathId, order } = req.body;

    if (!title || !youtubeVideoId || !pathId || !order) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Optional: Check if the parent path exists
        const parentPath = await Path.findById(pathId);
        if (!parentPath) {
            return res.status(404).json({ message: 'Parent path not found' });
        }
        
        // Optional: Check if a lesson with this YouTube ID already exists
        const lessonExists = await Lesson.findOne({ youtubeVideoId });
        if (lessonExists) {
            return res.status(400).json({ message: 'A lesson with this YouTube Video ID already exists' });
        }

        const lesson = new Lesson({
            title,
            youtubeVideoId,
            path: pathId,
            order: parseInt(order, 10), // Ensure order is a number
        });

        const createdLesson = await lesson.save();
        res.status(201).json(createdLesson);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.put('/domains/:id', protect, admin, async (req, res) => {
    const { name, slug, description, imageUrl } = req.body;

    try {
        const domain = await Domain.findById(req.params.id);
        if (!domain) {
            return res.status(404).json({ message: 'Domain not found' });
        }

        domain.name = name || domain.name;
        domain.slug = slug || domain.slug;
        domain.description = description || domain.description;
        domain.imageUrl = imageUrl || domain.imageUrl;

        const updatedDomain = await domain.save();
        res.json(updatedDomain);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.delete('/domains/:id', protect, admin, async (req, res) => {
    console.log(`--- [DELETE /domains] Received request to delete domain ID: ${req.params.id}`);
    try {
        const domainId = req.params.id;

        console.log('[1] Finding domain to delete...');
        const domain = await Domain.findById(domainId);
        if (!domain) {
            console.log('[FAIL] Domain not found.');
            return res.status(404).json({ message: 'Domain not found' });
        }
        console.log('[OK] Domain found:', domain.name);

        // --- CASCADING DELETE LOGIC ---
        console.log('[2] Finding paths associated with this domain...');
        const pathsToDelete = await Path.find({ domain: domainId });
        console.log(`[OK] Found ${pathsToDelete.length} paths to delete.`);

        if (pathsToDelete.length > 0) {
            const pathIds = pathsToDelete.map(p => p._id);
            console.log('   - Path IDs to be deleted:', pathIds);

            console.log('[3] Deleting lessons associated with these paths...');
            const lessonDeletionResult = await Lesson.deleteMany({ path: { $in: pathIds } });
            console.log(`[OK] Deleted ${lessonDeletionResult.deletedCount} lessons.`);
            
            console.log('[4] Deleting the paths themselves...');
            const pathDeletionResult = await Path.deleteMany({ domain: domainId });
            console.log(`[OK] Deleted ${pathDeletionResult.deletedCount} paths.`);
        } else {
            console.log('[SKIP] No paths to delete, skipping lesson and path deletion.');
        }
        
        console.log('[5] Deleting the domain itself...');
        // Let's use the static method for consistency, it's more robust.
        await Domain.findByIdAndDelete(domainId);
        console.log('[OK] Domain deleted successfully.');

        res.json({ message: 'Domain and all associated content deleted successfully' });
    } catch (error) {
        console.error('--- [FATAL ERROR in DELETE /domains] ---');
        console.error(error); // Log the full error object
        res.status(500).send('Server Error');
    }
});

router.put('/paths/:id', protect, admin, async (req, res) => {
    const { title, description, domainId } = req.body;
    try {
        const path = await Path.findById(req.params.id);
        if (!path) {
            return res.status(404).json({ message: 'Path not found' });
        }

        path.title = title || path.title;
        path.description = description || path.description;
        path.domain = domainId || path.domain;

        const updatedPath = await path.save();
        res.json(updatedPath);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.delete('/paths/:id', protect, admin, async (req, res) => {
    try {
        const path = await Path.findById(req.params.id);
        if (!path) {
            return res.status(404).json({ message: 'Path not found' });
        }
        await Lesson.deleteMany({ path: req.params.id });
        await path.remove();

        res.json({ message: 'Path and all associated lessons deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.put('/lessons/:id', protect, admin, async (req, res) => {
    const { title, youtubeVideoId, pathId, order } = req.body;
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        lesson.title = title || lesson.title;
        lesson.youtubeVideoId = youtubeVideoId || lesson.youtubeVideoId;
        lesson.path = pathId || lesson.path;
        lesson.order = order !== undefined ? parseInt(order, 10) : lesson.order;

        const updatedLesson = await lesson.save();
        res.json(updatedLesson);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
router.delete('/lessons/:id', protect, admin, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        await lesson.remove();

        res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;