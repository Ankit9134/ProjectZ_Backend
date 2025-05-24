// models/Address.js
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    trim: true,
  },
  service_area: {
    type: String,
    required: true,
    trim: true,
  },
  // Add geoJSON coordinates if needed
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number],
  },
  
});

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
