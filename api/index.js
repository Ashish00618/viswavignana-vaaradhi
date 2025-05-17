require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://viswavignanavaaradhi.org'
}));

// MongoDB Connection
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viswavignana');
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://viswavignanavaaradhi:vision%402047@vaaradi.gwmgxia.mongodb.net/viswavignana?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Volunteer Schema
const volunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

// Donation Schema
const donationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Donation = mongoose.model('Donation', donationSchema);

// Registration Endpoint
app.post('/register', async (req, res) => {
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
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Volunteer Registration Endpoint
app.post('/volunteer', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const volunteer = new Volunteer({ name, email, role });
        await volunteer.save();
        res.status(201).json({ message: 'Volunteer registered successfully' });
    } catch (error) {
        console.error('Error during volunteer registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Donation Endpoint
app.post('/donate', async (req, res) => {
    try {
        const { name, email, amount } = req.body;
        if (!name || !email || !amount) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }
        const donation = new Donation({ name, email, amount });
        await donation.save();
        res.status(201).json({ message: 'Donation recorded successfully' });
    } catch (error) {
        console.error('Error during donation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export the app as a serverless function
module.exports = serverless(app);