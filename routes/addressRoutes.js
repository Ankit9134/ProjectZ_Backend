const express = require("express");
const router = express.Router();
const {
  createAddresses,
  getAddressesByCity,
  getAddressesByLocality,
  getLocationData,
} = require("../controller/addressController");

router.post("/api/addresses", createAddresses);
router.get("/api/addresses/:city", getAddressesByCity);
router.get("/api/addresses/locality/:locality", getAddressesByLocality);
router.get("/api/location", getLocationData);

module.exports = router;
