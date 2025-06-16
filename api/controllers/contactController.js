const Contact = require('../models/Contact');
const logger = require('../utils/logger');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            logger.error('Missing required fields in contact submission');
            return res.status(400).json({ error: 'All fields are required' });
        }

        const contact = new Contact({ name, email, subject, message });
        await contact.save();

        logger.info(`Contact message submitted: ${email}`);
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        logger.error('Error submitting contact message:', error);
        res.status(500).json({ error: 'Error submitting message' });
    }
};