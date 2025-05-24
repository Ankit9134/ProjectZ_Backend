const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["gst", "state", "municipal"],
    },
    applicableFor: {
      type: [String],
      required: true,
      enum: ["dineIn", "delivery", "takeaway", "all"],
    },
    isApplicable: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isCompulsory: {
      type: Boolean,
      default: false,
    },
    calculationOrder: {
      type: Number,
      required: true,
      default: 5, 
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    exemptions: {
      type: [String],
      default: [],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Tax", taxSchema);
