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

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://www.viswavignanavaaradhi.org",
    // Add Vercel URLs like: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "https://viswavignana-vaaradhi-47mm2qent-ashishs-projects-1fd92a2e.vercel.app"
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
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// --- MongoDB Connection Management (Vercel Best Practice) ---
let isConnected;

async function connectToDatabase() {
    if (isConnected === 1) { // 1 = connected
        logger.info('=> using existing database connection');
        return;
    }

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        logger.error("FATAL: MONGODB_URI environment variable is not set.");
        throw new Error("MONGODB_URI environment variable is not set.");
    }

    logger.info('=> using new database connection');
    try {
        // Mongoose 6+ no longer needs useNewUrlParser or useUnifiedTopology
        await mongoose.connect(dbUri, {
            bufferCommands: false, // Don't buffer if not connected
            serverSelectionTimeoutMS: 5000 // Timeout faster
        });
        isConnected = mongoose.connections[0].readyState;
        logger.info("MongoDB connected successfully via Mongoose");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        isConnected = 0; // Set state to disconnected
        throw error; // Rethrow to signal critical failure
    }
}

// --- API ROUTES ---
// We will wrap routes that need DB access with the connection logic

// Simple check route
app.get("/api", (req, res) => {
  return res.status(200).json({ message: "Viswa Vignana Vaaradhi API is running!" });
});

// Wrapper function to connect to DB before handling route
const withDbConnection = (handler) => async (req, res, next) => {
    try {
        await connectToDatabase();
        return handler(req, res, next);
    } catch (error) {
        logger.error('Database connection failed for route:', { path: req.originalUrl, error: error.message });
        return res.status(500).json({ error: 'Server error: Could not connect to database.' });
    }
};

// Apply DB connection wrapper to routes that need it
app.use("/api/user", withDbConnection(userRoutes));
app.use("/api/volunteer", withDbConnection(volunteerRoutes));
app.use("/api/contact", withDbConnection(contactRoutes));
app.use('/api/grievance', withDbConnection(grievanceRoutes));

// --- Donation Route (Untouched as requested) ---
// Note: This route still uses MongoClient and has a hardcoded string.
// We are leaving it as-is per your request.
const { MongoClient } = require("mongodb");
app.post("/api/donation", async (req, res) => {
  const { name, email, phone, amount, purpose, paymentMethod, date } = req.body;
  if (!name || !email || !phone || !amount || !paymentMethod) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const client = await MongoClient.connect(
      "mongodb+srv://viswavignanavaaradhi:vinod123@vaaradi.gwmgxia.mongodb.net/viswavignana?retryWrites=true&w=majority"
    );
    const db = client.db("viswavignana");
    const collection = db.collection("donations");
    await collection.insertOne({
      name,
      email,
      phone,
      amount: parseFloat(amount),
      purpose: purpose || "Not specified",
      paymentMethod,
      date: new Date(date),
      createdAt: new Date(),
    });
    await client.close();
    return res.status(201).json({ message: "Donation recorded successfully" });
  } catch (error) {
    console.error("Error saving donation:", error);
    return res.status(500).json({ error: "Failed to save donation" });
  }
});


// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Vercel Export ---
module.exports = app;