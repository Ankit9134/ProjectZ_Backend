const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  emailSubject: { type: String },
  status: { type: String, default: "Inactive" },
  emailBody: { type: String },
  type: { type: String },
  event: { type: String },
  description: { type: String },
});

module.exports = mongoose.model("Template", TemplateSchema);
