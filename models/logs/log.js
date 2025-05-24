const mongoose = require("mongoose");

// Log schema
const logSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  level: { type: String, required: true },
  message: { type: String, required: true },
});

// Create Log model
const Log = mongoose.model("Log", logSchema);

module.exports = Log;
