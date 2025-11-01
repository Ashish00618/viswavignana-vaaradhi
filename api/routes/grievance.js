// api/routes/grievance.js
const express = require('express');
const router = express.Router();
const Grievance = require('../models/grievance'); // Ensure this path is correct
const logger = require('../utils/logger'); // Assuming your logger is here

router.post('/', async (req, res) => {
    try {
        const grievanceData = req.body;
        logger.info('Received new grievance submission attempt:', { name: grievanceData.fullName });

        // Create new grievance instance
        const newGrievance = new Grievance(grievanceData);
        
        // Save to database (this will also run the validations from the model)
        await newGrievance.save();

        logger.info('Successfully submitted new grievance:', { id: newGrievance._id });
        res.status(201).json({ message: 'Grievance/Support request submitted successfully!' });

    } catch (error) {
        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            logger.error('Grievance validation failed:', { errors, body: req.body });
            return res.status(400).json({ message: `Validation failed: ${errors.join(', ')}` });
        }

        // Handle other errors
        logger.error('Error saving grievance:', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

module.exports = router;