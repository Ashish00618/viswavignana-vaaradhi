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
    "https://www.viswavignanavaaradhi.org",
    // Add Vercel URLs here, e.g., process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
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
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// --- MongoDB Connection Management ---
let isConnected;

async function connectToDatabase() {
    if (isConnected) {
        logger.info('=> using existing database connection');
        return;
    }

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        // This is the error you are seeing!
        logger.error("FATAL: MONGODB_URI environment variable is not set.");
        throw new Error("MONGODB_URI environment variable is not set."); // Throw error to crash function clearly
    }

    logger.info('=> using new database connection');
    try {
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // Optional: fail fast if not connected
            serverSelectionTimeoutMS: 5000 // Timeout faster
        });
        isConnected = mongoose.connections[0].readyState;
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        isConnected = false; // Ensure isConnected is false on failure
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
    if (error.message.includes("MONGODB_URI")) {
        // Specific handling for the critical missing ENV VAR error
        return res.status(500).json({ error: 'Server configuration error: Database connection failed. Please contact support.' });
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
// Ensure these route files use connectToDatabase() where needed
app.use("/api/user", userRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/grievance', grievanceRoutes);

// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Vercel Export ---
module.exports = app;