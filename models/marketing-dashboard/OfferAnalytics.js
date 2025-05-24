// models/OfferAnalytics.js
const mongoose = require('mongoose');

const OfferAnalyticsSchema = new mongoose.Schema({
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ["Starters", "Main Course", "Combos", "Desserts"]
  },
  date: {
    type: Date,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
});

OfferAnalyticsSchema.index({ offerId: 1, category: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('OfferAnalytics', OfferAnalyticsSchema);