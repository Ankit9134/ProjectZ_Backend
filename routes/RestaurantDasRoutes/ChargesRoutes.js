const express = require("express");
const router = express.Router();
const chargesController = require("../../controller/RestaurantDasController/ChargesControllers");

router.post("/add-Charges", chargesController.addCharge);
router.get("/get-Charges", chargesController.getCharges);
router.put("/update-Charges/:id", chargesController.updateCharge);
router.delete("/delete-Charges/:id", chargesController.deleteCharge);

router.get("/delivery-ranges", chargesController.getDeliveryRanges);
router.post("/delivery-ranges", chargesController.addDeliveryRange);
router.put("/delivery-ranges/:id", chargesController.updateDeliveryRange);
router.delete("/delivery-ranges/:id", chargesController.deleteDeliveryRange);
router.patch("/delivery-ranges/:id", chargesController.toggleDeliveryRangeStatus);
router.post("/delivery-ranges/bulk", chargesController.bulkCreateUpdateDeliveryRanges);
router.get("/delivery-ranges/calculate/:distance", chargesController.calculateDeliveryFee);

module.exports = router;
