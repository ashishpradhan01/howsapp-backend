require("dotenv").config();
const express = require("express");
const cors = require("cors");

const messageRoutes = require("./routes/messageRoutes");
const authRoutes = require("./routes/authRoutes");
const qrRoutes = require("./routes/qrRoutes");
require("./workers/messageWorker");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/system", authRoutes);
app.use("/api/v1/qr", qrRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
