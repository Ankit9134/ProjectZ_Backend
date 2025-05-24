const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  acknowledgedAgreements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Acknowledgment",
    },
  ],
  sentAgreement: { type: Boolean, default: false },
});

module.exports = mongoose.model("UserAc", UserSchema);
