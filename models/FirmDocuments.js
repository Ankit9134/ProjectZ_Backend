// const mongoose = require("mongoose");

// const documentsSchema = new mongoose.Schema(
//   {
//     restaurantId: {
//       type: mongoose.Schema.ObjectId,
//       ref: "Firm",
//       required: true,
//     },
//     businessRegistrationCertificate: {
//       type: String,
//       required: false,
//     },
//     hygieneCertificate: {
//       type: String,
//       required: false,
//     },
//     driverLicense: {
//       type: String,
//       required: false,
//     },
//     passport: {
//       type: String,
//       required: false,
//     },
//     militaryId: {
//       type: String,
//       required: false,
//     },
//     governmentId: {
//       type: String,
//       required: false,
//     },
//     productDescription: {
//       type: String,
//       required: false,
//     },
//     //To track upload status
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const RestaurantDocument = mongoose.model(
//   "RestaurantDocument",
//   documentsSchema
// );
// module.exports = RestaurantDocument;

const mongoose = require("mongoose");

const documentsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.ObjectId,
      ref: "Firm",
      required: true,
    },
    businessRegistrationCertificate: {
      type: String,
      required: false,
    },
    hygieneCertificate: {
      type: String,
      required: false,
    },
    driverLicense: {
      type: String,
      required: false,
    },
    passport: {
      type: String,
      required: false,
    },
    militaryId: {
      type: String,
      required: false,
    },
    governmentId: {
      type: String,
      required: false,
    },
    // New document types
    permanentResidentCard: {
      type: String,
      required: false,
    },
    citizenshipCertificate: {
      type: String,
      required: false,
    },
    employmentAuthDocument: {
      type: String,
      required: false,
    },
    trustedTravellerID: {
      type: String,
      required: false,
    },
    tribalID: {
      type: String,
      required: false,
    },
    stateId: {
      type: String,
      required: false,
    },
    productDescription: {
      type: String,
      required: false,
    },
    //To track upload status
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const RestaurantDocument = mongoose.model(
  "RestaurantDocument",
  documentsSchema
);
module.exports = RestaurantDocument;
