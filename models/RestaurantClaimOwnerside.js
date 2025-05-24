const mongoose = require("mongoose");

const restaurantClaimSchema = new mongoose.Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
    },
    address: {
      type: String,
      required: [true, "Restaurant address is required"],
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
    },
    registrationNumber: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    proofOfOwnership: {
      type: String,
      required: [true, "Proof of ownership document is required"],
    },
    foodServicesPermit: {
      type: String,
      required: [true, "Food services permit is required"],
    },
    additionalDocuments: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "RestaurantClaimOwnerside",
  restaurantClaimSchema
);
