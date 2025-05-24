const mongoose = require("mongoose");

const historyLogSchema = new mongoose.Schema({
  entity: {
    type: String, // Name of the entity (e.g., 'User', 'Order', 'Product')
    required: true,
    // enum: [
    //   "User",
    //   "Order",
    //   // "Product",
    //   "Review",
    //   "Tiffin",
    //   "Firm",
    //   "MenuItem",
    //   "Offer",
    //   "Campaign",
    //   "Banner",
    //   "Taxes&Charges",
    //   // "Event",
    // ],
  },
  action: {
    type: String, // Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
    required: true,
    enum: ["CREATE", "UPDATE", "DELETE", "READ"],
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId, // ID of the user/admin
    ref: "User",
    required: true,
  },
  entityId: {
    type: [mongoose.Schema.Types.ObjectId], // ID of the affected entity
    // required: true,
    refPath: "entity",
    default: [],
  },
  userRole: {
    type: [String],
    default: ["user"],
    enum: [
      "user",
      "admin",
      "moderator",
      "kitchenOwner",
      "restaurantOwner",
      "eventCreator",
      "marketingPerson",
    ],
  },
  description: {
    type: String, // Brief description of the action performed
    required: true,
  },
  responseTime: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String, // IP address of the request
  },
  originalUrl: {
    type: String, // IP address of the request
  },
  method: {
    type: String, // IP address of the request
    enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
  archived: {
    type: Boolean,
    default: false, // Mark logs as archived after a certain period
  },
});

module.exports = mongoose.model("HistoryLog", historyLogSchema);
