const express = require("express");
const router = express.Router();
const taxController = require("../../controller/RestaurantDasController/TaxesControllers");

// GET all taxes
router.get("/", taxController.getTaxes);

// GET a specific tax by id
router.get("/:id", taxController.getTaxById);

// POST a new tax
router.post("/", taxController.createTax);

// PUT update an existing tax
router.put("/:id", taxController.updateTax);

// DELETE a tax
router.delete("/:id", taxController.deleteTax);

// PATCH to toggle tax applicability (only for non-compulsory taxes)
router.patch("/:id/toggle", taxController.toggleTax);

module.exports = router;