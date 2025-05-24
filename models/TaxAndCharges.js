const mongoose = require("mongoose");

const taxesAndChargesSchema = mongoose.Schema(
  {
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    taxType: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaxesAndChargesModel = mongoose.model(
  "TaxesAndChargesModel",
  taxesAndChargesSchema
);
module.exports = TaxesAndChargesModel;
