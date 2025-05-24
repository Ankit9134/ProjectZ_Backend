const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
    method: { 
    type: String, 
    enum: ["OTP", "Document"], 
    required: true 
    },
    email: { 
        type: String 
    },
    phoneNumber: { 
        type: String 
    },
    otp: { 
        type: String 
    },
    otpGeneratedAt: { 
        type: Date 
    },
    documents: [{ 
        type: String 
    }],
    registeredBusinessName: { 
        type: String 
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
    },
    submittedAt: { 
        type: Date, 
        default: Date.now 
    },
});

module.exports = mongoose.model("Claim", ClaimSchema);
