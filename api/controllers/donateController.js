const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Donation Schema
const donationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    orderId: { type: String },
    paymentId: { type: String },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Donation = mongoose.model('Donation', donationSchema);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createDonationOrder = async (req, res, next) => {
    try {
        const { amount, paymentMethod, name, email } = req.body;

        // Validate request
        if (!amount || !paymentMethod || !name || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        });

        // Save donation record (pending status)
        const donation = new Donation({
            name,
            email,
            amount,
            paymentMethod,
            orderId: order.id,
            status: 'pending'
        });
        await donation.save();

        logger.info(`Created Razorpay order: ${order.id} for amount: ${amount}, donation ID: ${donation._id}`);

        res.status(200).json({
            orderId: order.id,
            amount: amount,
            key: process.env.RAZORPAY_KEY_ID,
            message: 'Order created successfully',
            donationId: donation._id
        });
    } catch (error) {
        logger.error(`Error creating Razorpay order: ${error.message}`);
        next(error);
    }
};

module.exports = { createDonationOrder };