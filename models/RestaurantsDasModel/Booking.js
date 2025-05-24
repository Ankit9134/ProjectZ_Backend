// const mongoose = require("mongoose");
// //in progress
// const bookingSchema = new mongoose.Schema({
//   date: {
//     type: Date,
//     required: true,
//   },
//   timeSlot: {
//     type: String,
//     required: true,
//   },
//   guests: {
//     type: Number,
//     required: true,
//   },
//   meal: {
//     type: String,
//     required: true,
//   },
//   offerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Offer",
//     default: null,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Booking", bookingSchema);



const mongoose = require("mongoose");
//in progress
const bookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
  },
  meal: {
    type: String,
    required: true,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    default: null,
  },
  firm:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required:true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "canceled"],
    default: "pending",
  },
  history:{
    type:Boolean,
    default:false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  username:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
  },

  mobileNumber:{
    type:String,
    required:true,
  }

});

module.exports = mongoose.model("Booking", bookingSchema);


