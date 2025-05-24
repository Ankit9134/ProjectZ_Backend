const mongoose = require("mongoose");

const PrivacyAndSecuritySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserAc",
    required: true,
  },
  locationSharing: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ["Public", "Private"],
    default: "Public",
  },
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    email: { type: String, default: "" },
    otp: { type: String, default: "" },
    otpVerified: { type: Boolean, default: false },
    otpExpiry: { type: Date },
  },
});


module.exports = mongoose.model("Privacy",PrivacyAndSecuritySchema);
