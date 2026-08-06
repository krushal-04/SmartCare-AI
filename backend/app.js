const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Test Route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "🚀 SmartCare AI Backend is Running"
    });
});

module.exports = app;