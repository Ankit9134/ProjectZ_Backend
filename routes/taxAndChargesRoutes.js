const express = require("express");
const router = express.Router();
const taxAndChargesController = require("../controller/taxAndChargesController");

// Route to add taxes
router.post("/taxes", taxAndChargesController.addTax);

// Route to update taxes
router.put("/taxes/:id", taxAndChargesController.updateTax);

// Route to get taxes
router.get("/taxes", taxAndChargesController.getTaxes);

// Route to delete a tax by id
router.delete("/taxes/:id", taxAndChargesController.deleteTax);

module.exports = router;
