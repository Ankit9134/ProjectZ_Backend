const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
        "adminDashboard",
        "liveEvents",
        "customer",
        "tiffen",
        "marketing",
        "modulatorDashboard",
    ],
  },
  privacyPolicies: {
    type: [String],
    required: true,
  },
  termsOfService: {
    type: [String],
    required: true,
  },
});


const Policy = mongoose.model("Policy", PolicySchema);

module.exports = Policy;
