const express = require("express");
const multer = require("multer");
const {
  createClaim,
  getAllClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  approve,
  getRestaurantByOwnerName,
} = require("../controller/restaurantClaimController");
const { isAuthenticated } = require("../config/authHandlers");
const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  upload.fields([
    { name: "proofOfOwnership", maxCount: 1 },
    { name: "foodServicesPermit", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 },
  ]),
  createClaim
);

router.get("/", getAllClaims);
router.get("/owner/:registrationNumber", getRestaurantByOwnerName);
router.get("/:id", getClaimById);
router.put(
  "/:id",
  upload.fields([
    { name: "proofOfOwnership", maxCount: 1 },
    { name: "foodServicesPermit", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 },
  ]),
  updateClaim
);

router.patch("/approve/:name", approve);

router.delete("/:id", deleteClaim);

module.exports = router;
