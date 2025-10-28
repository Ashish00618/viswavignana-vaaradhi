// api/routes/grievance.js
const express = require('express');
const router = express.Router();
const Grievance = require('../models/grievance'); // Ensure model is imported
const logger = require('../utils/logger'); // Assuming logger path

// Import the connectToDatabase function (adjust path if needed)
// We need the function itself, assuming index.js exports it or it's separate
// If it's defined ONLY in index.js and not exported, we need to adjust index.js first.
// FOR NOW, let's assume connectToDatabase is accessible or redefine it here if necessary.
// **It's better practice to define connectToDatabase in a separate utility file.**

// TEMPORARY: Redefine connectToDatabase here if not exported from index.js
// Replace this with an import if you move connectToDatabase to a utility file
const mongoose = require('mongoose');
let isConnected;
async function connectToDatabase() {
    if (isConnected === 1) { logger.info('=> using existing database connection'); return; }
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri || !(dbUri.startsWith('mongodb://') || dbUri.startsWith('mongodb+srv://'))) {
        const errorMsg = "FATAL: MONGODB_URI environment variable is not set or has an invalid scheme."; logger.error(errorMsg); throw new Error(errorMsg);
    }
    logger.info('=> using new database connection');
    try {
        await mongoose.connect(dbUri, { bufferCommands: false, serverSelectionTimeoutMS: 5000 });
        isConnected = mongoose.connections[0].readyState;
        if (isConnected !== 1) { throw new Error(`Mongoose connection readyState is ${isConnected}`); }
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) { logger.error("MongoDB connection error:", error); isConnected = 0; throw error; }
}


router.post('/', async (req, res) => {
    try {
        await connectToDatabase(); // Ensure connection for this request
        logger.info('Received grievance submission attempt');

        // Data validation is handled by Mongoose schema
        const newGrievance = new Grievance(req.body);
        const savedGrievance = await newGrievance.save();

        logger.info(`Grievance recorded successfully: ${savedGrievance._id}`);
        res.status(201).json({ message: 'Grievance/Support request submitted successfully!' });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            logger.error('Grievance validation failed:', { errors: errors, body: req.body });
            return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
        }
        logger.error('Error saving grievance:', { error: error.message, stack: error.stack, body: req.body });
        res.status(500).json({ error: 'Server error: Failed to submit grievance.' });
    }
});

module.exports = router;