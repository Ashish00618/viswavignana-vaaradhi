// api/routes/volunteer.js
const express = require('express');
const router = express.Router();
const Volunteer = require('../models/volunteer'); // Ensure this path is correct
const logger = require('../utils/logger'); // Assuming your logger is here

router.post('/', async (req, res) => {
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
            return res.status(400).json({ message: `Validation failed: ${errors.join(', ')}` });
        }

        // Handle other errors
        logger.error('Error saving volunteer registration:', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

module.exports = router;