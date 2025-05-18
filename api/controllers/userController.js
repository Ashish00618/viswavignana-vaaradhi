const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        logger.info(`User registered: ${email}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        logger.error(`Error during registration: ${error.message}`);
        next(error);
    }
};

module.exports = { registerUser };