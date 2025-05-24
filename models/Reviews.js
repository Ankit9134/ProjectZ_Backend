// const mongoose = require("mongoose");

// const reviewSchema = new mongoose.Schema({
//   authorName: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//   },
//   date: {
//     type: String,
//     required: true,
//   },
//   rating: {
//     type: Number,
//     min: 0,
//     max: 5,
//     required: true,
//   },
//   comments: [{ type: String }],
//   aspects: {
//     pricePerPerson: {
//       type: String,
//     },
//     food: {
//       type: Number,
//       min: 0,
//       max: 5,
//     },
//     service: {
//       type: Number,
//       min: 0,
//       max: 5,
//     },
//     atmosphere: {
//       type: Number,
//       min: 0,
//       max: 5,
//     },
//     noiseLevel: {
//       type: String,
//     },
//     groupSize: {
//       type: String,
//     },
//     waitTime: {
//       type: String,
//     },
//   },
//   firm: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Firm",
//     // required: true,
//   },
//   tiffin: { type: mongoose.Schema.Types.ObjectId, ref: "Tiffin" },
// });

// const Review = mongoose.model("Review", reviewSchema);
// module.exports = Review;

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    authorName: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User",
      default: null,
    },
    email: {
      type: String,
    },
    date: {
      type: Date,
      // required: true,
    },
    days: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      // required: true,
    },
    reviewText: {
      type: String,
      // required: true,
      default: "",
    },
    comments: [{ type: String }],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: String,
      },
    ],
    reviewType: {
      type: String,
      enum: ["takeaway", "dining", "tiffin", null],
      // required: true,
      default: null,
    },
    aspects: {
      pricePerPerson: {
        type: String,
      },
      food: {
        type: Number,
        min: 0,
        max: 5,
      },
      service: {
        type: Number,
        min: 0,
        max: 5,
      },
      atmosphere: {
        type: Number,
        min: 0,
        max: 5,
      },
      noiseLevel: {
        type: String,
      },
      groupSize: {
        type: String,
      },
      waitTime: {
        type: String,
      },
    },
    // Single field for firm, whether from scraping or frontend so it work for both scrap data and live site
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
    },
    // Single field for tiffin, whether from scraping or frontend so it work for both scrap data and live site
    tiffin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
