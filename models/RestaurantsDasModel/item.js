const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["Veg", "Non-Veg", "Egg", ""],
    default: "",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  pricing: {
    type: String,
    required: true,
  },
  taxes: {
    type: String,
    default: "5% GST",
  },

  serviceType: {
    type: [String],
    enum: ["Dine-in", "Takeaway"],
    default: [],
  },
  description: {
    type: String,
    default: "",
  },
  dishDetails: {
    servingInfo: {
      type: String,
      default: "",
    },
    calorieCount: {
      type: String,
      default: "",
    },
    portionSize: {
      type: String,
      enum: ["", "Small", "Medium", "Large", "Extra Large"],
      default: "",
    },
    preparationTime: {
      type: String,
      default: "",
    },
  },
  images: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

itemSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
