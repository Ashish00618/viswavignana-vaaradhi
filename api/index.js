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
const logger = require("./utils/logger"); // Ensure logger logs to console
const Donation = require('./models/donation'); // Import the CORRECT Donation model

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://www.viswavignanavaaradhi.org", // Your production domain
    // Add Vercel URLs like: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    // Or allow all origins temporarily for testing: '*'
    "https://viswavignana-vaaradhi-jyr79h8ep-ashishs-projects-1fd92a2e.vercel.app"
  ].filter(Boolean),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`); // Corrected template literal
  next();
});

// --- MongoDB Connection Management (Vercel Best Practice) ---
let isConnected;

async function connectToDatabase() {
    if (isConnected === 1) { // Check if readyState is 1 (connected)
        logger.info('=> using existing database connection');
        return;
    }

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri || !(dbUri.startsWith('mongodb://') || dbUri.startsWith('mongodb+srv://'))) {
        // Log and throw the specific error you encountered
        logger.error("FATAL: MONGODB_URI environment variable is not set or has an invalid scheme.");
        throw new Error("Invalid scheme, expected connection string to start with 'mongodb://' or 'mongodb+srv://'");
    }

    logger.info('=> using new database connection');
    try {
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // Don't buffer commands if not connected
            serverSelectionTimeoutMS: 5000 // Timeout faster
        });
        isConnected = mongoose.connections[0].readyState; // Update connection state
        if (isConnected !== 1) {
            throw new Error('Mongoose connection readyState is not 1 after connect call');
        }
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        isConnected = 0; // Set state to disconnected on error
        throw error; // Rethrow to signal failure
    }
}

// --- API ROUTES ---

// Simple check route
app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Viswa Vignana Vaaradhi API is running!" });
});

// --- Donation Route Handler (Using Mongoose) ---
app.post('/api/donation', async (req, res) => {
  try {
    await connectToDatabase(); // Ensure DB is connected for this request

    const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;
    logger.info('Received donation submission attempt:', { email, amount });

    // Validate required fields explicitly (optional but good practice)
    if (!name || !email || !phone || !amount || !paymentMethod || !date) {
         logger.warn('Donation submission failed: Missing required fields', { body: req.body });
         return res.status(400).json({ error: 'Missing required fields.' });
     }

    const newDonation = new Donation({
      name,
      email,
      phone,
      amount: parseFloat(amount),
      purpose: purpose || 'General Support',
      paymentMethod,
      date: new Date(date),
    });

    const savedDonation = await newDonation.save(); // This also validates

    logger.info(`Donation recorded successfully: ${savedDonation._id} for ${email}`);
    return res.status(201).json({
      message: 'Donation record submitted successfully! Thank you.',
      donationId: savedDonation._id
    });

  } catch (error) {
    // Specific check for the URI error before validation
    if (error.message.includes("Invalid scheme")) {
        return res.status(500).json({ error: 'Server configuration error: Invalid database connection string format.' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      logger.error('Donation validation failed:', { errors: errors, body: req.body });
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