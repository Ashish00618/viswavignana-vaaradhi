// api/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user");
const volunteerRoutes = require("./routes/volunteer");
const contactRoutes = require("./routes/contact");
const grievanceRoutes = require('./routes/grievance');
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const Donation = require('./models/donation'); // Import the Donation model

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://www.viswavignanavaaradhi.org",
    "https://viswavignana-vaaradhi-97p1qqhet-ashishs-projects-1fd92a2e.vercel.app"

  ].filter(Boolean),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// --- MongoDB Connection Management ---
let isConnected;

async function connectToDatabase() {
    if (isConnected === 1) {
        logger.info('=> using existing database connection');
        return;
    }
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri || !(dbUri.startsWith('mongodb://') || dbUri.startsWith('mongodb+srv://'))) {
        const errorMsg = "FATAL: MONGODB_URI environment variable is not set or has an invalid scheme.";
        logger.error(errorMsg);
        throw new Error("Invalid scheme, expected connection string to start with 'mongodb://' or 'mongodb+srv://'");
    }
    logger.info('=> using new database connection');
    try {
        // REMOVED deprecated options: useNewUrlParser, useUnifiedTopology
        await mongoose.connect(dbUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000
        });
        isConnected = mongoose.connections[0].readyState;
        if (isConnected !== 1) {
             throw new Error(`Mongoose connection readyState is ${isConnected} after connect call`);
        }
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        isConnected = 0;
        throw error;
    }
}

// --- API ROUTES ---
app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Viswa Vignana Vaaradhi API is running!" });
});

// --- Donation Route Handler ---
app.post('/api/donation', async (req, res) => {
  try {
    await connectToDatabase();

    // Destructure using 'name' (matching frontend and model)
    const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;
    logger.info('Received donation submission attempt:', { email, amount: amount });

    // Create donation data object using 'name'
    const donationData = {
      name, // Use 'name' here
      email,
      phone,
      amount: parseFloat(amount),
      purpose: purpose || 'General Support',
      paymentMethod,
      date: new Date(date),
    };

    // Create and save using the model (validation happens here)
    const newDonation = new Donation(donationData);
    const savedDonation = await newDonation.save();

    logger.info(`Donation recorded successfully: ${savedDonation._id} for ${email}`);
    return res.status(201).json({
      message: 'Donation record submitted successfully! Thank you.',
      donationId: savedDonation._id
    });

  } catch (error) {
    if (error.message.includes("Invalid scheme")) {
        logger.error("Database connection string format error.");
        return res.status(500).json({ error: 'Server configuration error: Invalid database connection string format.' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      logger.error('Donation validation failed:', { errors: errors, body: req.body });
      // Send validation errors back (e.g., "Name is required")
      return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
    }
    logger.error('Error processing donation:', { error: error.message, stack: error.stack, body: req.body });
    return res.status(500).json({ error: 'Server error: Failed to save donation record.' });
  }
});

// --- Other API Routes ---
app.use("/api/user", userRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/grievance', grievanceRoutes);

// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Vercel Export ---
module.exports = app;