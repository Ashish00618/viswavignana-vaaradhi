require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Debug: Log the MongoDB URI being used
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viswavignana');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://viswavignanavaaradhi:vision%402047@vaaradi.gwmgxia.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4 // Force IPv4
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
    role: { type: String, required: true }, // e.g., "Teacher", "Mentor", "Event Organizer"
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

// Registration Endpoint (Existing)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        // Save user to database
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Volunteer Registration Endpoint
app.post('/api/volunteer', async (req, res) => {
    try {
        const { name, email, role } = req.body;

        // Validate input
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create new volunteer
        const volunteer = new Volunteer({
            name,
            email,
            role
        });

        // Save volunteer to database
        await volunteer.save();

        res.status(201).json({ message: 'Volunteer registered successfully' });
    } catch (error) {
        console.error('Error during volunteer registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Donation Endpoint
app.post('/api/donate', async (req, res) => {
    try {
        const { name, email, amount } = req.body;

        // Validate input
        if (!name || !email || !amount) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        // Create new donation
        const donation = new Donation({
            name,
            email,
            amount
        });

        // Save donation to database
        await donation.save();

        res.status(201).json({ message: 'Donation recorded successfully' });
    } catch (error) {
        console.error('Error during donation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});