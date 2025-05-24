
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  cuisine: { type: String, required: true },
  status: {
    type: String,
    enum: ["claimed", "unclaimed"],
    default: "unclaimed",
  },
  address: { type: String, required: true },
  hours: { type: String, required: true },
  phone: { type: String, required: true },
  image: { type: String, default: '' },
  ownerName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);