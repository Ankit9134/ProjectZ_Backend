const mongoose = require("mongoose");

const deliveryRangeSchema = new mongoose.Schema({
    minDistance: {
        type: Number,
        required: true
    },
    maxDistance: {
        type: Number,
        required: true
    },
    charge: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("DeliveryCharges", deliveryRangeSchema);