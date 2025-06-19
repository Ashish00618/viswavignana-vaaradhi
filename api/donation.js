const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();
app.use(cors({
    origin: ['http://localhost:5500'], 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.post('/api/donation', async (req, res) => {
    const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;

    if (!name || !email || !phone || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('viswavignana');
        const collection = db.collection('donations');

        await collection.insertOne({
            name,
            email,
            phone,
            amount: parseFloat(amount),
            purpose: purpose || 'Not specified',
            paymentMethod,
            date: new Date(date),
            createdAt: new Date()
        });

        await client.close();
        return res.status(201).json({ message: 'Donation recorded successfully' });
    } catch (error) {
        console.error('Error saving donation:', error);
        return res.status(500).json({ error: 'Failed to save donation' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));