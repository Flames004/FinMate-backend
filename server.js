const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars MUST BE FIRST
dotenv.config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Connect to Database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Root response for health checks
app.get("/", (req, res) => {
  res.json({ status: "FinMate API is running perfectly." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
