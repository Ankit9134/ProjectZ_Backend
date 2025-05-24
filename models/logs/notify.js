const mongoose = require("mongoose");

const notifySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  level: { type: String, required: true },
  type: {
    type: [String],
    enum: ['admin', 'restaurant', 'marketing', 'tiffin', 'moderator']
  },
  message: { type: String, required: true },
  metadata: { type: Object },
});

// Create Log model
const Notify = mongoose.model("notifylogs", notifySchema);

module.exports = Notify;
