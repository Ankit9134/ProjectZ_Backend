const mongoose = require("mongoose");

const AcknowledgmentSchema = new mongoose.Schema({
  agreement: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "UserAc", required: true },
  acknowledgedAt: { type: Date, default: null },
  adminAccepted: { type: Boolean, default: false },
  adminAcceptedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Acknowledgment", AcknowledgmentSchema);
