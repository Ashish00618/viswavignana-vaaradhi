// api/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const serverless = require("serverless-http"); // Not needed for Vercel functions typically
const userRoutes = require("./routes/user");
const volunteerRoutes = require("./routes/volunteer");
const contactRoutes = require("./routes/contact");
const grievanceRoutes = require('./routes/grievance');
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger"); // Assuming logger setup correctly logs to console
const Donation = require('./models/donation'); // Import the Donation model

const app = express();

// Middleware
const corsOptions = {
  // Ensure your Vercel deployment URL is included here, or use a more permissive setting during testing
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://www.viswavignanavaaradhi.org", // Your production domain
    // Add your Vercel preview/production URLs like:
    // process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean), // Filter out undefined in case VERCEL_URL isn't set
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Use CORS middleware globally
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests (preflight)
app.options('*', cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON bodies

// Logging middleware
app.use((req, res, next) => {
  // Use template literal correctly
  logger.info(`${req.method} ${req.originalUrl}`); // Use req.originalUrl for full path
  next();
});

// --- MONGODB CONNECTION ---
// Vercel best practice: Connect inside the handler or use cached connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    logger.info('Using cached database connection');
    return cachedDb;
  }
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is not set.");
    }
    logger.info('Connecting to MongoDB...');
    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout faster if connection fails
    });
    cachedDb = connection;
    logger.info("MongoDB connected successfully");
    return cachedDb;
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    // Rethrow or handle appropriately - maybe return null or throw?
    // Depending on your error handler, you might want Vercel to see the crash
    throw err; // Let Vercel handle the crash if DB connection fails critically
  }
}
// Note: We call connectToDatabase() inside the route handlers now.

// --- API ROUTES ---

// Simple check route
app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Viswa Vignana Vaaradhi API is running!" });
});

// --- Donation Route Handler (Using Mongoose) ---
app.post('/api/donation', async (req, res) => {
  try {
    await connectToDatabase(); // Ensure DB connection for this request

    const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;
    
    logger.info('Received donation submission attempt:', { email, amount });

    // Create a new donation document using the Mongoose model
    const newDonation = new Donation({
      name,
      email,
      phone,
      amount: parseFloat(amount),
      purpose: purpose || 'General Support',
      paymentMethod,
      date: new Date(date),
    });

    // Attempt to save (triggers Mongoose validation)
    const savedDonation = await newDonation.save();

    logger.info(`Donation recorded successfully: ${savedDonation._id} for ${email}`);
    return res.status(201).json({
      message: 'Donation record submitted successfully! Thank you.',
      donationId: savedDonation._id
    });

  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      logger.error('Donation validation failed:', { errors: errors, body: req.body });
      return res.status(400).json({ error: `Please correct the following: ${errors.join(', ')}` });
    }
    
    // Handle other errors (DB connection, etc.)
    logger.error('Error processing donation:', { error: error.message, stack: error.stack, body: req.body });
    return res.status(500).json({ error: 'Server error: Failed to save donation record.' });
  }
});

// --- Other API Routes ---
// Ensure these route files exist and correctly use connectToDatabase() if needed
app.use("/api/user", userRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/grievance', grievanceRoutes);

// --- Error Handling Middleware ---
// This should be the LAST app.use() call
app.use(errorHandler);

// --- Vercel Export ---
// Export the app for Vercel's serverless environment
module.exports = app;