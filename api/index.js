require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
const userRoutes = require('./routes/user');
const volunteerRoutes = require('./routes/volunteer');
const contactRoutes = require('./routes/contact');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors({ origin: ['https://viswavignanavaaradhi.org', ] }));
app.use(cors({origin: "localhost:5500"}))
app.use(express.json());
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://viswavignanavaaradhi:vision%402047@vaaradi.gwmgxia.mongodb.net/viswavignana?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
})
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/contact', contactRoutes);

// Error Handling
app.use(errorHandler);

// Export as serverless function
module.exports = serverless(app);