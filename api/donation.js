// api/models/donation.js
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // CORRECT FIELD NAME: 'name' (lowercase)
  name: { // Changed from donorName to name
    type: String,
    required: [true, 'Name is required'], // User-facing message
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Donation amount must be at least ₹1']
  },
  purpose: {
    type: String,
    default: 'General Support',
    trim: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
        values: ['upi', 'bank'],
        message: 'Invalid payment method selected'
    }
  },
  date: { // Date provided by the user from the frontend
    type: Date,
    required: [true, 'Donation date is required']
  },
  createdAt: { // Date the record was created on the server
    type: Date,
    default: Date.now
  },
});

// Avoid recompiling the model if it already exists
module.exports = mongoose.models.Donation || mongoose.model('Donation', donationSchema);