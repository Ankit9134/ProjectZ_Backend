const mongoose = require("mongoose");

const ChargesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  isApplicable: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  type: { type: String, enum: ["flat", "percentage"], default: "flat" },
});

module.exports = mongoose.model("Charges", ChargesSchema);

