// api/routes/grievance.js
const express = require('express');
const router = express.Router();
const Grievance = require('../models/grievance'); // Ensure this path is correct
const logger = require('../utils/logger'); // Assuming your logger is here

// Handle POST request to /api/grievance
router.post('/', async (req, res, next) => {
    try {
        const grievanceData = req.body;
        logger.info('Received new grievance submission attempt:', { name: grievanceData.fullName });

        // Create new grievance instance
        const newGrievance = new Grievance(grievanceData);
        
        // Save to database (this will also run validations)
        await newGrievance.save();

        logger.info('Successfully submitted new grievance:', { id: newGrievance._id });
        res.status(201).json({ message: 'Grievance/Support request submitted successfully!' });

    } catch (error) {
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            logger.error('Grievance validation failed:', { errors, body: req.body });
            return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
        }

        // Pass other errors to the global error handler
        logger.error('Error saving grievance:', { error: error.message });
        next(error); // This will send a generic 500 error
    }
});

module.exports = router;