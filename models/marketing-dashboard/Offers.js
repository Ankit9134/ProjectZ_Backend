const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    name: { type: String},
    discount: {  type: String },
    type: {type: String},
    adminAccept:{type:Boolean,default:false},
    suggestion:{type:String},
    display:{type:Boolean,default:true},
    status: {type: String, enum: ["Active", "Upcoming", "Expired"]},
    startDate: { type: Date },
    endDate: { type: Date },
})

// Automatically calculate status before saving
// Pre-save hook: set the status based on startDate and endDate
OfferSchema.pre("save", function (next) {
  const now = new Date(); // Current time in UTC
  if (now < this.startDate) {
    this.status = "Upcoming";
  } else if (now > this.endDate) {
    this.status = "Expired";
  } else {
    this.status = "Active";
  }
  next();
});

// Pre-findOneAndUpdate hook: recalc status if both dates are updated
OfferSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  // Only recalc status if both startDate and endDate are present in the update.
  if (update.startDate && update.endDate) {
    const now = new Date();
    const start = new Date(update.startDate);
    const end = new Date(update.endDate);
    if (now < start) {
      update.status = "Upcoming";
    } else if (now > end) {
      update.status = "Expired";
    } else {
      update.status = "Active";
    }
  }
  next();
});
  

module.exports = mongoose.model('OfferMarketing', OfferSchema)