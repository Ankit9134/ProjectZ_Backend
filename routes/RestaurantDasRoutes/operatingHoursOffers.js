


// const express = require("express");
// const router = express.Router();
// const OperatingHoursOffer = require("../../models/RestaurantsDasModel/OperatingHoursOffer");
// const Offer = require("../../models/RestaurantsDasModel/Offer");
// const operatingHoursController = require("../../controller/RestaurantDasController/operatingHoursController");



// router.post("/", operatingHoursController.updateOperatingHours);
// // router.get("/", operatingHoursController.getOperatingHours);

// // Update operating hours
// router.put("/", operatingHoursController.updateOperatingHours);




// router.get("/", async (req, res) => {
//   try {
//     const operatingHours = await OperatingHoursOffer.find({})
//       .populate({
//         path: "timeSlotOffers.offerId",
//         model: "Offer",
//       })
//       .sort({ day: 1 });

//     res.json(operatingHours);
//   } catch (error) {
//     console.error("Error fetching operating hours:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// router.post("/", async (req, res) => {
//   try {
//     const { day, openTime, closeTime } = req.body;
//     if (!day || !openTime || !closeTime) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     let operatingHours = await OperatingHoursOffer.findOneAndUpdate(
//       { day },
//       { openTime, closeTime },
//       { new: true, upsert: true, runValidators: true }
//     );

//     // Remove outdated slots
//     const validSlots = generateTimeSlots(openTime, closeTime);
//     operatingHours.timeSlotOffers = operatingHours.timeSlotOffers.filter(
//       (item) => validSlots.includes(item.timeSlot)
//     );

//     await operatingHours.save();
//     res.json(operatingHours);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });



// router.post("/day/:day/offers", async (req, res) => {
//   try {
//     let { timeSlots, offerId } = req.body;
//     timeSlots = [...new Set(timeSlots)]; // Deduplicate

//     // Validation checks
//     if (!timeSlots?.length || !offerId) {
//       return res.status(400).json({ message: "Invalid request data" });
//     }

//     const offer = await Offer.findById(offerId);
//     if (!offer) return res.status(404).json({ message: "Offer not found" });

//     const operatingHours = await OperatingHoursOffer.findOne({
//       day: req.params.day,
//     });
//     if (!operatingHours)
//       return res.status(404).json({ message: "Day not found" });

//     // Validate slots against operating hours
//     const open = new Date(`2000-01-01T${operatingHours.openTime}`);
//     const close = new Date(`2000-01-01T${operatingHours.closeTime}`);
//     const invalidSlots = timeSlots.filter((slot) => {
//       const slotTime = new Date(`2000-01-01T${slot}`);
//       return slotTime < open || slotTime >= close;
//     });

//     if (invalidSlots.length > 0) {
//       return res.status(400).json({
//         message: `Invalid slots: ${invalidSlots.join(", ")}`,
//       });
//     }

//     // Update timeSlotOffers
//     operatingHours.timeSlotOffers = operatingHours.timeSlotOffers
//       .filter((item) => !timeSlots.includes(item.timeSlot))
//       .concat(timeSlots.map((slot) => ({ timeSlot: slot, offerId })));

//     const updatedHours = await operatingHours.save();
//     await updatedHours.populate("timeSlotOffers.offerId");

//     res.json(updatedHours);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });



// router.delete("/day/:day/offers", async (req, res) => {
//   try {
//     const { timeSlots } = req.body;

//     if (!timeSlots || !Array.isArray(timeSlots)) {
//       return res.status(400).json({
//         message: "Time slots array is required",
//       });
//     }

//     const operatingHours = await OperatingHoursOffer.findOne({
//       day: req.params.day,
//     });

//     if (!operatingHours) {
//       return res.status(404).json({
//         message: "Operating hours not found for this day",
//       });
//     }

//     operatingHours.timeSlotOffers = operatingHours.timeSlotOffers.filter(
//       (item) => !timeSlots.includes(item.timeSlot)
//     );

//     const updatedHours = await operatingHours.save();
//     res.json(updatedHours);
//   } catch (error) {
//     console.error("Error removing offers:", error);
//     res.status(400).json({ message: error.message });
//   }
// });

// module.exports = router;



// routes/RestaurantDasRoutes/operatingHoursOffers.js
const express = require("express");
const router = express.Router();

const OperatingHoursOffer = require("../../models/RestaurantsDasModel/OperatingHoursOffer");
const Offer = require("../../models/RestaurantsDasModel/Offer");
// const {
//   updateOperatingHours,
//   generateTimeSlots,
//   operatingHoursController,
// } = require("../../controller/RestaurantDasController/operatingHoursController");



const {
  updateOperatingHours,
  generateTimeSlots,
  initializeOperatingHours,
  getFormattedOperatingHoursWithOffers,
  getFormattedOperatingHoursWithOnlyOffers,
  
} = require("../../controller/RestaurantDasController/operatingHoursController");






// GET all operating hours with populated offers
router.get("/", async (req, res) => {
  try {
    const operatingHours = await OperatingHoursOffer.find({})
      .populate({
        path: "timeSlotOffers.offerId",
        model: "Offer",
      })
      .sort({ day: 1 });
    res.json(operatingHours);
  } catch (error) {
    console.error("Error fetching operating hours:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update operating hours (both POST and PUT routes)
router.post("/", initializeOperatingHours);
router.put("/", updateOperatingHours);

// Add offers to a specific day's time slots
router.post("/day/:day/offers", async (req, res) => {
  try {
    let { timeSlots, offerId } = req.body;
    console.log(timeSlots, offerId )
    timeSlots = [...new Set(timeSlots)]; // Remove duplicate slots

    if (!timeSlots.length || !offerId) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    console.log(req.params.day)
    const operatingHours = await OperatingHoursOffer.findOne({
      day: req.params.day,
    });
    if (!operatingHours) {
      return res.status(404).json({ message: "Day not found" });
    }

    // Validate that each slot is within operating hours
    const open = new Date(`2000-01-01T${operatingHours.openTime}`);
    const close = new Date(`2000-01-01T${operatingHours.closeTime}`);
    const invalidSlots = timeSlots.filter((slot) => {
      const slotTime = new Date(`2000-01-01T${slot}`);
      return slotTime < open || slotTime >= close;
    });
    if (invalidSlots.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid slots: ${invalidSlots.join(", ")}` });
    }

    // Remove existing offers for the given slots and add the new offer
    operatingHours.timeSlotOffers = operatingHours.timeSlotOffers
      .filter((item) => !timeSlots.includes(item.timeSlot))
      .concat(timeSlots.map((slot) => ({ timeSlot: slot, offerId })));

    const updatedHours = await operatingHours.save();
    await updatedHours.populate("timeSlotOffers.offerId");
    res.json(updatedHours);
  } catch (error) {
    console.error("Error adding offers:", error);
    res.status(500).json({ message: error.message });
  }
});

// Remove offers from specific time slots of a day
router.delete("/day/:day/offers", async (req, res) => {
  try {
    const { timeSlots } = req.body;
    if (!timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Time slots array is required" });
    }

    const operatingHours = await OperatingHoursOffer.findOne({
      day: req.params.day,
    });
    if (!operatingHours) {
      return res
        .status(404)
        .json({ message: "Operating hours not found for this day" });
    }

    operatingHours.timeSlotOffers = operatingHours.timeSlotOffers.filter(
      (item) => !timeSlots.includes(item.timeSlot)
    );
    const updatedHours = await operatingHours.save();
    res.json(updatedHours);
  } catch (error) {
    console.error("Error removing offers:", error);
    res.status(400).json({ message: error.message });
  }
});





router.get("/formatted-with-offers-only", async (req, res) => {
  try {
    const formattedData = await getFormattedOperatingHoursWithOnlyOffers();
    res.json(formattedData);
  } catch (error) {
    console.error(
      "Error fetching formatted operating hours with offers only:",
      error
    );
    res.status(500).json({ message: error.message });
  }
});




router.get("/formatted", async (req, res) => {
  try {
    const formattedData = await getFormattedOperatingHoursWithOffers();
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching formatted operating hours:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
