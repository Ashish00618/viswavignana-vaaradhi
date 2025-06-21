const express = require('express');
const router = express.Router();
const Grievance = require('../models/grievance');
const logger = require('../utils/logger');

// Validation function
const validateGrievanceData = (data) => {
  if (!data || !data.fullName || !/^\d{10}$/.test(data.mobileNumber) || !data.description) {
    return false;
  }
  return true;
};

// POST /api/grievance - Save grievance data
router.post('/', async (req, res) => {
  try {
    const grievanceData = req.body;

    // Validate data
    if (!validateGrievanceData(grievanceData)) {
      logger.warn('Invalid grievance data received:', grievanceData);
      return res.status(400).json({ message: 'Invalid data. Mobile Number must be 10 digits, and all required fields must be filled.' });
    }

    // Create new grievance instance
    const newGrievance = new Grievance(grievanceData);
    await newGrievance.save();

    logger.info(`Grievance submitted: ${grievanceData.fullName}`);
    res.status(201).json({ message: 'Grievance/Support request submitted successfully!' });
  } catch (error) {
    logger.error('Error saving grievance:', error);
    res.status(500).json({ message: 'Error submitting grievance. Please try again or contact support.' });
  }
});

module.exports = router;