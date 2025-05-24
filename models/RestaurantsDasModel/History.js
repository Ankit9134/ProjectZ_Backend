const mongoose = require("mongoose");

const OrderHistory = new mongoose.Schema(
  {
    username: {
        type: String,
        required: true,
      },
    mode: {
      type: String,
      enum: ["dining", "takeaway"],
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        restaurantName: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Firm',
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
    },
    orderTime: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: 'Order time cannot be in the future.',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderHistoryDas", OrderHistory)