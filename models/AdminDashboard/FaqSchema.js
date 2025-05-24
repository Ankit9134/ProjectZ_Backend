const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    q: {
      type: String,
      required: true,
      trim: true,
    },
    a: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Restaurant Dashboard",
        "Marketing",
        "Tiffin",
        "Live Event",
        "Moderator Dashboard",
        "clam Restaurant",
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Faq", faqSchema);
