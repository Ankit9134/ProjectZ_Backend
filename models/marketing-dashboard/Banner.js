const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["Active", "Upcoming", "Inactive"],
    default: "Inactive",
  },
  photoWeb: { type: String },
  photoApp: { type: String },
  pages: [{ type: String }],
  offer: { type: String },
  cities: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },

  clicks: [
    {
      date: { type: Date, default: Date.now },
    },
  ],
  // firm: { type: mongoose.Schema.Types.ObjectId, ref: 'Firm' },
  // tiffin: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiffin' },
});

bannerSchema.pre("save", function (next) {
  // Only recalc status if both startDate and endDate are provided.
  if (this.startDate && this.endDate) {
    const now = new Date();
    if (now < this.startDate) {
      this.status = "Upcoming";
    } else if (now > this.endDate) {
      this.status = "Inactive";
    } else {
      this.status = "Active";
    }
  } else if (this.status) {
    // If dates are not provided, ensure the status is Inactive.
    this.status;
  } else {
    this.status = "Inactive";
  }
  next();
});

// Pre-findOneAndUpdate hook: recalc status if both dates are updated
bannerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  // Only recalc status if both startDate and endDate are present in the update.
  if (update.startDate && update.endDate) {
    const now = new Date();
    const start = new Date(update.startDate);
    const end = new Date(update.endDate);
    if (now < start) {
      update.status = "Upcoming";
    } else if (now > end) {
      update.status = "Inactive";
    } else {
      update.status = "Active";
    }
  }
  next();
});

module.exports = mongoose.model("Banner", bannerSchema);
