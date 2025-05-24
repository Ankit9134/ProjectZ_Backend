const mongoose = require("mongoose");

const menuIntemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: String,
    description: String,
    variations: [
      {
        name: String,
        price: String,
      },
    ],
    // dietary: [
    //   {
    //     type: String,
    //     enum: [
    //       "vegetarian",
    //       "vegan",
    //       "halal",
    //       "gluten-free",
    //       "dairy-free",
    //       "nut-free",
    //     ],
    //     _id: false,
    //   },
    // ],
    isTrashed: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      enum: ["veg", "non-veg", "both"],
    },
    group: String,
    // images: [
    //   {
    //     filename: String,
    //     url: String,
    //     _id: false,
    //   },
    // ],
    bestSeller: {
      type: Boolean,
      default: false,
    },
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
    },
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model("MenuItem", menuIntemSchema);
module.exports = MenuItem;
