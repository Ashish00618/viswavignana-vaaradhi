// api/routes/volunteer.js
const express = require('express');
const router = express.Router();
const Volunteer = require('../models/volunteer'); // Ensure this path is correct
const logger = require('../utils/logger'); // Assuming your logger is here

// Handle POST request to /api/volunteer
router.post('/', async (req, res, next) => {
    try {
        const volunteerData = req.body;
        logger.info('Received new volunteer registration attempt:', { name: volunteerData.fullName });

        // Create new volunteer instance
        const newVolunteer = new Volunteer(volunteerData);
        
        // Save to database (this will also run the validations from the model)
        await newVolunteer.save();

        logger.info('Successfully registered new volunteer:', { email: newVolunteer.email });
        res.status(201).json({ message: 'Volunteer registration submitted successfully! Thank you.' });

    } catch (error) {
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            logger.error('Volunteer validation failed:', { errors, body: req.body });
            return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
        }
        
        // Pass other errors to the global error handler
        logger.error('Error saving volunteer registration:', { error: error.message });
        next(error); // This will send a generic 500 error
    }
});

module.exports = router;