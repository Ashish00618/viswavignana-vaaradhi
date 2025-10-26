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
const Donation = require('./models/donation'); 

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://www.viswavignanavaaradhi.org", 
    "https://viswavignana-vaaradhi-8balp15fi-ashishs-projects-1fd92a2e.vercel.app"
  ].filter(Boolean),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  // Corrected template literal for logging
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// --- MongoDB Connection Management (Vercel Best Practice) ---
let isConnected;

async function connectToDatabase() {
    // Check mongoose's readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    if (isConnected === 1) {
        logger.info('=> using existing database connection');
        return;
    }

    const dbUri = process.env.MONGODB_URI;
    // Check if URI is defined AND starts correctly
    if (!dbUri || !(dbUri.startsWith('mongodb://') || dbUri.startsWith('mongodb+srv://'))) {
        const errorMsg = "FATAL: MONGODB_URI environment variable is not set or has an invalid scheme.";
        logger.error(errorMsg);
        // Throw an error that clearly indicates the problem
        throw new Error("Invalid scheme, expected connection string to start with 'mongodb://' or 'mongodb+srv://'");
    }

    logger.info('=> using new database connection');
    try {
        // REMOVED deprecated options: useNewUrlParser, useUnifiedTopology
        await mongoose.connect(dbUri, {
            bufferCommands: false, // Don't buffer if not connected
            serverSelectionTimeoutMS: 5000 // Timeout faster
        });
        isConnected = mongoose.connections[0].readyState; // Update connection state (should be 1)
        if (isConnected !== 1) {
             // Log the actual state if connection didn't reach 'connected'
             throw new Error(`Mongoose connection readyState is ${isConnected} after connect call`);
        }
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        isConnected = 0; // Set state to disconnected
        throw error; // Rethrow to signal critical failure
    }
}

// --- API ROUTES ---
app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Viswa Vignana Vaaradhi API is running!" });
});

// --- Donation Route Handler (Corrected) ---
app.post('/api/donation', async (req, res) => {
  try {
    await connectToDatabase(); // Ensure DB connection

    // Destructure using 'name' (matching frontend and model)
    const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;
    logger.info('Received donation submission attempt:', { email, amount: amount });

    // Create donation data object using 'name'
    const donationData = {
      name, // Use 'name' here consistently
      email,
      phone,
      amount: parseFloat(amount), // Ensure number type
      purpose: purpose || 'General Support',
      paymentMethod,
      date: new Date(date), // Ensure date type
    };

    // Create and save using the model (validation happens here)
    const newDonation = new Donation(donationData);
    const savedDonation = await newDonation.save(); // This also validates based on the schema

    logger.info(`Donation recorded successfully: ${savedDonation._id} for ${email}`);
    return res.status(201).json({
      message: 'Donation record submitted successfully! Thank you.',
      donationId: savedDonation._id
    });

  } catch (error) {
    // Handle Mongoose validation errors (like the 'name'/'donorName' mismatch)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      logger.error('Donation validation failed:', { errors: errors, body: req.body });
      // Send validation errors back to the frontend
      // The frontend error "Path `donorName` is required" came from this block previously
      return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
    }
    // Handle other errors (DB connection, unexpected issues)
    if (error.message.includes("Invalid scheme")) { // Catch connection string format error
        logger.error("Database connection string format error.");
        return res.status(500).json({ error: 'Server configuration error: Invalid database connection string format.' });
    }
    logger.error('Error processing donation:', { error: error.message, stack: error.stack, body: req.body });
    return res.status(500).json({ error: 'Server error: Failed to save donation record. Please try again later.' });
  }
});

// --- Other API Routes ---
// Ensure these route files also use `await connectToDatabase()` if they need the DB
app.use("/api/user", userRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/grievance', grievanceRoutes);

// --- Error Handling Middleware ---
// This MUST be the LAST app.use() call
app.use(errorHandler);

// --- Vercel Export ---
// Export the configured Express app for Vercel's serverless environment
module.exports = app;