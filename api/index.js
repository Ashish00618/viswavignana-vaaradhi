require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");
const userRoutes = require("./routes/user");
const volunteerRoutes = require("./routes/volunteer");
const contactRoutes = require("./routes/contact");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { MongoClient } = require("mongodb");

const app = express();

// Middleware
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://viswavignanavaaradhi.org",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

// ✅ Use CORS middleware globally
app.use(cors(corsOptions));

app.options("*", cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  logger.info('${req.method} ${req.url}');
  next();
});

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://viswavignanavaaradhi:vinod123@vaaradi.gwmgxia.mongodb.net/viswavignana?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    }
  )
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("MongoDB connection error:", err));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/contact", contactRoutes);

// Error Handling
app.use(errorHandler);

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hi" });
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ${PORT}'));

// Export as serverless function
module.exports = serverless(app);