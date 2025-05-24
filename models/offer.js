const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    coupon_code: {
      type: String,
      required: true,
      unique: true,
    },
    start_date: { type: Date, default: Date.now() },
    end_date: Date,
    Discount: String,
    type: String,
    item: String,
    subCategory: String,
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
