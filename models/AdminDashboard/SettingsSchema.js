    const mongoose = require("mongoose");

    const SettingsSchema = new mongoose.Schema({
    logo: {
        type: String,
        required: false,
    },
    websiteName: {
        type: String,
        default: "Zomato",
        required: true,
    },
    status: {
        type: String,
        enum: ["Online", "Degraded", "Offline"],
        default: "Online",
        required: true,
    },
    maintenanceEnabled: {
        type: Boolean,
        default: false,
    },
    maintenanceMessage: {
        type: String,
        required: function () {
        return this.maintenanceEnabled;
        },
    },
    startTime: {
        type: Date,
        required: function () {
        return this.maintenanceEnabled;
        },
    },
    endTime: {
        type: Date,
        required: function () {
        return this.maintenanceEnabled;
        },
    },
    preferredLanguage: {
        type: String,
        default: "English",
        enum: ["English", "Hindi", "Spanish", "French"],
    },
    timeZone: {
        type: String,
        default: "IST",
        enum: ["IST", "EST", "PST", "GMT"],
    },
    dateFormat: {
        type: String,
        default: "DD/MM/YYYY",
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    },
    timeFormat: {
        type: String,
        default: "24-hour",
        enum: ["24-hour", "12-hour"],
    },
    });

    module.exports = mongoose.model("Settings", SettingsSchema);
