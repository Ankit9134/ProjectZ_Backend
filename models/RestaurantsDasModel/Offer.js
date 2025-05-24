

// models/Offer.js
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  offerType: {
    type: String,
    enum: ["percentage", "fixed", "bundle", "buyXgetY"],
    required: true
  },
  discountValue: Number, // Can be percentage or fixed amount
  buyX: Number,
  getY: Number,
  bundlePrice: Number,
  scope: {
    type: String,
    enum: ["category", "subcategory", "item"],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  image: String,
  applicability: {
    type: String,
    enum: ["dining", "takeaway", "both"],
    default: "both"
  },
  adminAccept:{
    type:Boolean,
    default:false,
  },
  display:{
    type:Boolean,
    default:true,
  },
  suggestion:{
    type:String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

offerSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("RestaurantOffers", offerSchema);