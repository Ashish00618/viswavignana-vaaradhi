// api/controllers/volunteerController.js
const Volunteer = require('../models/volunteer'); // Correct model import
const logger = require('../utils/logger'); // Assuming logger path

// Import or redefine connectToDatabase (same logic as in grievance route)
// **It's better practice to define connectToDatabase in a separate utility file.**
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


exports.registerVolunteer = async (req, res, next) => { // Use next for error handling middleware if needed
    try {
        await connectToDatabase(); // Ensure connection
        logger.info('Received volunteer registration attempt');

        const newVolunteer = new Volunteer(req.body);
        const savedVolunteer = await newVolunteer.save(); // Validation happens here

        logger.info(`Volunteer registered successfully: ${savedVolunteer._id}`);
        res.status(201).json({ message: 'Volunteer registration submitted successfully! Thank you.', volunteerId: savedVolunteer._id });

    } catch (error) {
         if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            logger.error('Volunteer validation failed:', { errors: errors, body: req.body });
            // Send specific validation errors
            return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
        }
        logger.error('Error registering volunteer:', { error: error.message, stack: error.stack, body: req.body });
        // Pass error to central handler or send generic response
        // next(error); // Option 1: Use central error handler
        res.status(500).json({ error: 'Server error: Failed to register volunteer.' }); // Option 2: Send generic error
    }
};

// Add other controller functions if you have them (e.g., getVolunteers)