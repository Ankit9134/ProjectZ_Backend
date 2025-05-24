

// models/OperatingHoursOffer.js
const mongoose = require("mongoose");

const operatingHoursOfferSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  openTime: {
    type: String,
    required: true,
  },
  closeTime: {
    type: String,
    required: true,
  },
  timeSlotOffers: [
    {
      timeSlot: {
        type: String,
        required: true,
      },
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove restaurantId index since we're not using it
operatingHoursOfferSchema.index({ day: 1 }, { unique: true });

operatingHoursOfferSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("OperatingHoursOffer", operatingHoursOfferSchema);