const mongoose = require("mongoose");

const flexiblePlanSchema = new mongoose.Schema({
  type: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  flexiDates: [Date],
  plan: { type: String },
});

const orderSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tiffinName: { type: String, required: true },
  customer: { type: String, required: true },
  tiffinAddress: { type: String, required: true },
  phone: {
    countryCode: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    fullNumber: {
      type: String,
      required: true,
    },
  },
  address: { type: String, required: true },
  email: { type: String, required: true },
  total: { type: String, required: true },
  subTotal: { type: String, require: true },
  status: { type: String, required: true },
  time: { type: Date, required: true },
  startDate: { type: Date },
  specialInstructions: { type: String },
  appliedOffer: { type: Array, default: [] },
  appliedCharges: { type: Array, default: [] },
  appliedTaxes: { type: Array, default: [] },
  appliedDiscount: { type: String },
  distance: { type: String, required: true },
  mealType: { type: String, required: true },
  quantity: { type: Number, required: true },
  avatar: { type: String },
  flexiblePlan: flexiblePlanSchema,
  subStatus: [
    {
      date: { type: Date },
      status: {
        type: String,
        enum: ["Not Delivered", "Delivered"],
        default: "Not Delivered",
      },
    },
  ],
});
orderSchema.index({ yourField: 1 });
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
