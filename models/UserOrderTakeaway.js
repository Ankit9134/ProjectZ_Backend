const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1.'],
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0,
  },
  platformFee: {
    type: Number,
    required: true,
    default: 0,
  },
  gstCharges: {
    type: Number,
    required: true,
    default: 0,
  },
  history:{
    type:Boolean,
    default:false
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  discount:{
    type: Number,
    default: 0,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', "rejected",'accept','notaccept'],
    default: 'notaccept',
  },
  orderTime: {
    type: Date,
    required: true,
    default: Date.now, // Default to current time but can be overridden by the user
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fav:{
    type:Boolean,
    default:false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


orderSchema.pre('save', function (next) {
  // If the user has set an orderTime in the past, throw an error
  if (this.orderTime < Date.now()) {
    return next(new Error('Order time cannot be in the past.'));
  }

  this.totalPrice =
    this.subtotal + this.deliveryFee + this.platformFee + this.gstCharges;
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('OrderTakeAway', orderSchema);

module.exports = Order;
