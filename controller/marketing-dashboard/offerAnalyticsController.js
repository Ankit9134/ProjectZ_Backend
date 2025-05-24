// // controllers/analyticsController.js
// const OfferAnalytics = require('../../models/marketing-dashboard/OfferAnalytics');
// const OfferMarketing = require('../../models/marketing-dashboard/Offers');
// const mongoose = require('mongoose');

// // Record order with offer
// exports.recordOfferOrder = async (req, res) => {
//   try {
//     const { offerId } = req.params;
//     const { categories } = req.body;

//     // Validate input
//     if (!mongoose.Types.ObjectId.isValid(offerId)) {
//       return res.status(400).json({ msg: "Invalid offer ID" });
//     }

//     const offer = await OfferMarketing.findById(offerId);
//     if (!offer) return res.status(404).json({ msg: "Offer not found" });

//     const validCategories = ["Starters", "Main Course", "Combos", "Desserts"];
//     const invalidCategory = categories.find(c => !validCategories.includes(c));
//     if (invalidCategory) {
//       return res.status(400).json({ msg: `Invalid category: ${invalidCategory}` });
//     }

//     // Get UTC date
//     const now = new Date();
//     const currentUTCDate = new Date(Date.UTC(
//       now.getUTCFullYear(),
//       now.getUTCMonth(),
//       now.getUTCDate()
//     ));

//     // Update analytics
//     const bulkOps = categories.map(category => ({
//       updateOne: {
//         filter: {
//           offerId: new mongoose.Types.ObjectId(offerId),
//           category,
//           date: currentUTCDate
//         },
//         update: { $inc: { count: 1 } },
//         upsert: true
//       }
//     }));

//     await OfferAnalytics.bulkWrite(bulkOps);
//     res.status(200).json({ msg: "Order recorded successfully" });
//   } catch (err) {
//     res.status(500).json({ msg: "Error recording order", error: err.message });
//   }
// };

// // Get analytics data
// exports.getOfferAnalytics = async (req, res) => {
//   try {
//     const { offerId, timeframe = "Today" } = req.query;
//     const validTimeframes = ["Today", "This Week", "This Month"];

//     if (!validTimeframes.includes(timeframe)) {
//       return res.status(400).json({ msg: "Invalid timeframe" });
//     }

//     // Calculate start date
//     const now = new Date();
//     const currentUTC = new Date(now.toISOString().slice(0, -1));
//     let startDate;

//     switch (timeframe) {
//       case "Today":
//         startDate = new Date(Date.UTC(
//           currentUTC.getUTCFullYear(),
//           currentUTC.getUTCMonth(),
//           currentUTC.getUTCDate()
//         ));
//         break;
//       case "This Week":
//         const day = currentUTC.getUTCDay();
//         const diff = day === 0 ? 6 : day - 1;
//         startDate = new Date(currentUTC);
//         startDate.setUTCDate(currentUTC.getUTCDate() - diff);
//         startDate.setUTCHours(0, 0, 0, 0);
//         break;
//       case "This Month":
//         startDate = new Date(Date.UTC(
//           currentUTC.getUTCFullYear(),
//           currentUTC.getUTCMonth(),
//           1
//         ));
//         break;
//     }

//     // Build query
//     const matchQuery = { date: { $gte: startDate } };
//     if (offerId && offerId !== "All") {
//       if (!mongoose.Types.ObjectId.isValid(offerId)) {
//         return res.status(400).json({ msg: "Invalid offer ID" });
//       }
//       matchQuery.offerId = new mongoose.Types.ObjectId(offerId);
//     }

//     // Get analytics
//     const analytics = await OfferAnalytics.aggregate([
//       { $match: matchQuery },
//       { $group: { _id: "$category", total: { $sum: "$count" } } },
//       { $project: { category: "$_id", count: "$total", _id: 0 } }
//     ]);

//     // Fill missing categories
//     const categories = ["Starters", "Main Course", "Combos", "Desserts"];
//     const result = categories.map(category => ({
//       category,
//       count: analytics.find(a => a.category === category)?.count || 0
//     }));

//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json({ msg: "Error fetching analytics", error: err.message });
//   }
// };

// controllers/analyticsController.js
const OfferAnalytics = require("../../models/marketing-dashboard/OfferAnalytics"); // Adjust path
const OfferMarketing = require("../../models/marketing-dashboard/Offers"); // Adjust path
const mongoose = require("mongoose");
const historyLogRecorder = require("../../utils/historyLogRecorder"); // Adjust path

// Record order with offer
exports.recordOfferOrder = async (req, res) => {
  const { offerId } = req.params;
  const { categories } = req.body;
  try {
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      historyLogRecorder(
        req,
        "OfferAnalytics",
        "UPDATE",
        [], // No valid ID
        `Attempted to record order analytics with invalid offer ID format: ${offerId}`
      );
      return res.status(400).json({ msg: "Invalid offer ID" });
    }

    const offer = await OfferMarketing.findById(offerId);
    if (!offer) {
      historyLogRecorder(
        req,
        "OfferAnalytics",
        "UPDATE",
        [offerId],
        `Attempted to record order analytics for non-existent offer ID ${offerId}`
      );
      return res.status(404).json({ msg: "Offer not found" });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      historyLogRecorder(
        req,
        "OfferAnalytics",
        "UPDATE",
        [offerId],
        `Attempted to record order analytics for offer ID ${offerId} with missing or empty categories`
      );
      return res
        .status(400)
        .json({ msg: "Categories array is required and cannot be empty." });
    }

    const validCategories = ["Starters", "Main Course", "Combos", "Desserts"]; // Define allowed categories
    const invalidCategory = categories.find(
      (c) => !validCategories.includes(c)
    );
    if (invalidCategory) {
      historyLogRecorder(
        req,
        "OfferAnalytics",
        "UPDATE",
        [offerId],
        `Attempted to record order analytics for offer ID ${offerId} with invalid category: ${invalidCategory}`
      );
      return res
        .status(400)
        .json({ msg: `Invalid category provided: ${invalidCategory}` });
    }

    // Get UTC date
    const now = new Date();
    const currentUTCDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Update analytics using bulkWrite for efficiency
    const bulkOps = categories.map((category) => ({
      updateOne: {
        filter: {
          offerId: new mongoose.Types.ObjectId(offerId),
          category,
          date: currentUTCDate, // Ensure date comparison works as expected (UTC)
        },
        update: { $inc: { count: 1 } },
        upsert: true,
      },
    }));

    const bulkResult = await OfferAnalytics.bulkWrite(bulkOps);

    // Log success
    historyLogRecorder(
      req,
      "OfferAnalytics",
      "UPDATE",
      [offerId], // Log based on the related marketing offer ID
      `Recorded order analytics for offer '${
        offer.name
      }' (ID: ${offerId}). Categories: ${categories.join(", ")}. Matched: ${
        bulkResult.matchedCount
      }, Modified: ${bulkResult.modifiedCount}, Upserted: ${
        bulkResult.upsertedCount
      }`
    );

    res.status(200).json({ msg: "Order recorded successfully" });
  } catch (err) {
    historyLogRecorder(
      req,
      "OfferAnalytics",
      "UPDATE",
      offerId && mongoose.Types.ObjectId.isValid(offerId) ? [offerId] : [],
      `Error recording order analytics for offer ID ${offerId}: ${err.message}`
    );
    res.status(500).json({ msg: "Error recording order", error: err.message });
  }
};

// Get analytics data
exports.getOfferAnalytics = async (req, res) => {
  const { offerId, timeframe = "Today" } = req.query; // Default timeframe if not provided
  const validTimeframes = ["Today", "This Week", "This Month"];
  let logOfferId = offerId || "All"; // For logging

  try {
    if (!validTimeframes.includes(timeframe)) {
      historyLogRecorder(
        req,
        "OfferAnalytics",
        "READ",
        [],
        `Attempted to get offer analytics with invalid timeframe: ${timeframe}`
      );
      return res
        .status(400)
        .json({
          msg: "Invalid timeframe (use 'Today', 'This Week', or 'This Month')",
        });
    }

    // Calculate start date based on timeframe (UTC)
    const now = new Date();
    // Correct way to get current UTC date components
    const currentUTCYear = now.getUTCFullYear();
    const currentUTCMonth = now.getUTCMonth();
    const currentUTCDate = now.getUTCDate();
    let startDate;

    switch (timeframe) {
      case "Today":
        startDate = new Date(
          Date.UTC(currentUTCYear, currentUTCMonth, currentUTCDate)
        );
        break;
      case "This Week":
        const currentUTCDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday...
        const diffToMonday = currentUTCDay === 0 ? -6 : 1 - currentUTCDay; // Calculate difference to get to Monday
        startDate = new Date(
          Date.UTC(
            currentUTCYear,
            currentUTCMonth,
            currentUTCDate + diffToMonday
          )
        );
        break;
      case "This Month":
        startDate = new Date(Date.UTC(currentUTCYear, currentUTCMonth, 1));
        break;
      // Should not happen due to validation, but included for safety
      default:
        startDate = new Date(
          Date.UTC(currentUTCYear, currentUTCMonth, currentUTCDate)
        );
        break;
    }
    startDate.setUTCHours(0, 0, 0, 0); // Ensure start of day/week/month

    // Build query
    const matchQuery = { date: { $gte: startDate } };
    let targetOfferIdArray = []; // For logging entityId

    if (offerId && offerId !== "All") {
      if (!mongoose.Types.ObjectId.isValid(offerId)) {
        historyLogRecorder(
          req,
          "OfferAnalytics",
          "READ",
          [],
          `Attempted to get offer analytics with invalid offer ID format: ${offerId}`
        );
        return res.status(400).json({ msg: "Invalid offer ID provided" });
      }
      matchQuery.offerId = new mongoose.Types.ObjectId(offerId);
      targetOfferIdArray = [offerId]; // Set ID for logging
    } else {
      logOfferId = "All"; // Update log variable if no specific ID
    }

    // Get analytics using aggregation
    const analytics = await OfferAnalytics.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$category", total: { $sum: "$count" } } },
      { $project: { category: "$_id", count: "$total", _id: 0 } },
    ]);

    // Fill missing categories for a complete result set
    const categories = ["Starters", "Main Course", "Combos", "Desserts"];
    const result = categories.map((category) => ({
      category,
      count: analytics.find((a) => a.category === category)?.count || 0,
    }));

    // Log success
    const totalCount = result.reduce((sum, item) => sum + item.count, 0);
    historyLogRecorder(
      req,
      "OfferAnalytics",
      "READ",
      targetOfferIdArray, // Log the specific offer ID if provided, else empty array
      `Retrieved offer analytics. Offer ID: ${logOfferId}. Timeframe: ${timeframe}. Total count: ${totalCount}.`
    );

    res.status(200).json(result);
  } catch (err) {
    historyLogRecorder(
      req,
      "OfferAnalytics",
      "READ",
      offerId && mongoose.Types.ObjectId.isValid(offerId) ? [offerId] : [],
      `Error retrieving offer analytics. Offer ID: ${logOfferId}, Timeframe: ${timeframe}. Error: ${err.message}`
    );
    res
      .status(500)
      .json({ msg: "Error fetching analytics", error: err.message });
  }
};
