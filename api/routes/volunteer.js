// routes/volunteer.js
const express = require('express');
const router = express.Router();
const Volunteer = require('api/models/volunteer'); // Adjust path if necessary
const logger = require('../utils/logger');

// Validation function
const validateVolunteerData = (data) => {
  if (!data || !data.fullName || data.age < 18 ||
      !/^\d{6}$/.test(data.pinCode) || !/^\d{10}$/.test(data.mobileNumber)) {
    return false;
  }
  return true;
};

// POST /api/volunteer - Save volunteer data
router.post('/', async (req, res) => {
  try {
    const volunteerData = req.body;

    // Validate data
    if (!validateVolunteerData(volunteerData)) {
      logger.warn('Invalid volunteer data received:', volunteerData);
      return res.status(400).json({ message: 'Invalid data. Age must be 18+, Pin Code must be 6 digits, and Mobile Number must be 10 digits.' });
    }

    // Create new volunteer instance
    const newVolunteer = new Volunteer(volunteerData);
    await newVolunteer.save();

    logger.info(`Volunteer registered: ${volunteerData.fullName}`);
    res.status(201).json({ message: 'Volunteer registration submitted successfully!' });
  } catch (error) {
    logger.error('Error saving volunteer:', error);
    res.status(500).json({ message: 'Error submitting volunteer registration. Please try again or contact support.' });
  }
});

module.exports = router;