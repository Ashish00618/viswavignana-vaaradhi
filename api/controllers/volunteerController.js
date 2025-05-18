const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Volunteer Schema
const volunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

const registerVolunteer = async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const volunteer = new Volunteer({ name, email, role });
        await volunteer.save();
        logger.info(`Volunteer registered: ${email}`);
        res.status(201).json({ message: 'Volunteer registered successfully' });
    } catch (error) {
        logger.error(`Error during volunteer registration: ${error.message}`);
        next(error);
    }
};

module.exports = { registerVolunteer };