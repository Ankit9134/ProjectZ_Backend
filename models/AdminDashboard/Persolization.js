const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  device: { type: String, required: true },
  location: { type: String, required: true },
});

const profileSettingsSchema = new mongoose.Schema({
  firstName: { type: String, required: true, default: "John" },
  lastName: { type: String, required: true, default: "Doe" },
  bio: { type: String, default: "This is your bio" },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  dob: { type: Date, required: true },
  profilePicture: { type: String },
  sessions: [sessionSchema],
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("ProfileSettings1", profileSettingsSchema);
