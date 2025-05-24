


// // controllers/operatingHoursController.js
// const OperatingHoursOffer = require("../../models/RestaurantsDasModel/OperatingHoursOffer");
// const Offer = require("../../models/RestaurantsDasModel/Offer");

// const generateTimeSlots = (openTime, closeTime) => {
//   const slots = [];
//   const current = new Date(`2000-01-01T${openTime}`);
//   const end = new Date(`2000-01-01T${closeTime}`);

//   while (current < end) {
//     slots.push(
//       current.toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       })
//     );
//     current.setMinutes(current.getMinutes() + 30);
//   }
//   return slots;
// };

// exports.initializeOperatingHours = async () => {
//   const days = [
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//     "Sunday",
//   ];
//   const defaultOpenTime = "09:00";
//   const defaultCloseTime = "22:00";

//   try {
//     const operations = days.map((day) => ({
//       updateOne: {
//         filter: { day: day },
//         update: {
//           $setOnInsert: {
//             openTime: defaultOpenTime,
//             closeTime: defaultCloseTime,
//             timeSlotOffers: [],
//           },
//         },
//         upsert: true,
//       },
//     }));

//     await OperatingHoursOffer.bulkWrite(operations);
//     return {
//       success: true,
//       message: "Operating hours initialized successfully",
//     };
//   } catch (error) {
//     console.error("Error initializing operating hours:", error);
//     return { success: false, error: error.message };
//   }
// };




// exports.updateOperatingHours = async (req, res) => {
//   try {
//     const { day, openTime, closeTime } = req.body;

//     // Find and update the document for the specified day
//     const updatedHours = await OperatingHoursOffer.findOneAndUpdate(
//       { day: day }, // Filter by day
//       { openTime: openTime, closeTime: closeTime, updatedAt: new Date() }, // Update fields
//       { new: true } // Return the updated document
//     );

//     if (!updatedHours) {
//       return res
//         .status(404)
//         .json({ message: `Operating hours for ${day} not found` });
//     }

//     res.status(200).json({
//       success: true,
//       message: `Operating hours for ${day} updated successfully`,
//       data: updatedHours,
//     });
//   } catch (error) {
//     console.error(`Error updating operating hours for ${day}:`, error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



// exports.getFormattedOperatingHoursWithOffers = async () => {
//   try {
//     const availableOffers = await Offer.find({});
    
//     const operatingHours = await OperatingHoursOffer.find({})
//       .populate({
//         path: "timeSlotOffers.offerId",
//         model: "Offer",
//       })
//       .sort({ day: 1 });

//     const formattedHours = operatingHours.map((day) => {
//       const timeSlots = generateTimeSlots(day.openTime, day.closeTime);
//       const slotOffersMap = {};
//       day.timeSlotOffers.forEach((slotOffer) => {
//         if (slotOffer.offerId) {
//           slotOffersMap[slotOffer.timeSlot] = {
//             id: slotOffer.offerId._id,
//             name: slotOffer.offerId.name,
//             code: slotOffer.offerId.code,
//             offerType: slotOffer.offerId.offerType,
//             discountValue: slotOffer.offerId.discountValue,
//           };
//         }
//       });

//       return {
//         day: day.day,
//         openTime: day.openTime,
//         closeTime: day.closeTime,
//         timeSlots: timeSlots.map((slot) => ({
//           slot: slot,
//           offer: slotOffersMap[slot] || null,
//         })),
//       };
//     });

//     return {
//       hours: formattedHours,
//       availableOffers: availableOffers,
//     };
//   } catch (error) {
//     console.error("Error formatting operating hours:", error);
//     throw error;
//   }
// };



// controller/RestaurantDasController/operatingHoursController.js

const OperatingHoursOffer = require("../../models/RestaurantsDasModel/OperatingHoursOffer");
const Offer = require("../../models/RestaurantsDasModel/Offer");

// Helper function to generate 30-minute time slots
const generateTimeSlots = (openTime, closeTime) => {
  const slots = [];
  const current = new Date(`2000-01-01T${openTime}`);
  const end = new Date(`2000-01-01T${closeTime}`);
  while (current < end) {
    slots.push(
      current.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
    current.setMinutes(current.getMinutes() + 30);
  }
  return slots;
};

// Initialize operating hours for all days (if needed)
exports.initializeOperatingHours = async () => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const defaultOpenTime = "09:00";
  const defaultCloseTime = "22:00";

  try {
    const operations = days.map((day) => ({
      updateOne: {
        filter: { day },
        update: {
          $setOnInsert: {
            openTime: defaultOpenTime,
            closeTime: defaultCloseTime,
            timeSlotOffers: [],
          },
        },
        upsert: true,
      },
    }));

    await OperatingHoursOffer.bulkWrite(operations);
    return {
      success: true,
      message: "Operating hours initialized successfully",
    };
  } catch (error) {
    console.error("Error initializing operating hours:", error);
    return { success: false, error: error.message };
  }
};

// Update operating hours for a specific day
exports.updateOperatingHours = async (req, res) => {
  try {
    const { day, openTime, closeTime } = req.body;
    const updatedHours = await OperatingHoursOffer.findOneAndUpdate(
      { day },
      { openTime, closeTime, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedHours) {
      return res
        .status(404)
        .json({ message: `Operating hours for ${day} not found` });
    }

    res.status(200).json({
      success: true,
      message: `Operating hours for ${day} updated successfully`,
      data: updatedHours,
    });
  } catch (error) {
    console.error(
      `Error updating operating hours for ${req.body.day}:`,
      error
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get operating hours with formatted time slots and associated offers
exports.getFormattedOperatingHoursWithOffers = async () => {
  try {
    const availableOffers = await Offer.find({});
    const operatingHours = await OperatingHoursOffer.find({})
      .populate({
        path: "timeSlotOffers.offerId",
        model: "RestaurantOffers",
        select: "name code offerType discountValue startDate endDate",
      })
      .sort({ day: 1 });

    const formattedHours = operatingHours.map((dayData) => {
      const timeSlots = generateTimeSlots(dayData.openTime, dayData.closeTime);
      const slotOffersMap = {};
      dayData.timeSlotOffers.forEach((slotOffer) => {

        if (slotOffer.offerId) {
          slotOffersMap[slotOffer.timeSlot] = {
            id: slotOffer.offerId._id,
            name: slotOffer.offerId.name,
            code: slotOffer.offerId.code,
            offerType: slotOffer.offerId.offerType,
            discountValue: slotOffer.offerId.discountValue,
            startDate:slotOffer.offerId.startDate,
            endDate:slotOffer.offerId.endDate
          };
        }
      });

      return {
        day: dayData.day,
        openTime: dayData.openTime,
        closeTime: dayData.closeTime,
        timeSlots: timeSlots.map((slot) => ({
          slot,
          offer: slotOffersMap[slot] || null,
        })),
      };
    });

    return {
      hours: formattedHours,
      availableOffers,
    };
  } catch (error) {
    console.error("Error formatting operating hours:", error);
    throw error;
  }
};



exports.getFormattedOperatingHoursWithOnlyOffers = async () => {
  try {
    const availableOffers = await Offer.find({});
    const operatingHours = await OperatingHoursOffer.find({})
    .populate({
      path: "timeSlotOffers.offerId",
      model: "RestaurantOffers",
      select: "name code offerType discountValue startDate endDate",
    })
    .sort({ day: 1 });
    const formattedHours = operatingHours.map((dayData) => {
      const timeSlots = generateTimeSlots(dayData.openTime, dayData.closeTime);
      const slotOffersMap = {};
    
      console.log("Raw timeSlotOffers for", dayData.day, dayData.timeSlotOffers);
    
      dayData.timeSlotOffers.forEach((slotOffer) => {
        console.log("Mapping timeSlot:", slotOffer.timeSlot, "Offer ID:", slotOffer.offerId?._id);
        
        if (slotOffer.offerId && slotOffer.offerId._id) {
          slotOffersMap[slotOffer.timeSlot] = {
            id: slotOffer.offerId._id,
            name: slotOffer.offerId.name,
            code: slotOffer.offerId.code,
            offerType: slotOffer.offerId.offerType,
            discountValue: slotOffer.offerId.discountValue,
            startDate:slotOffer.offerId.startDate,
            endDate:slotOffer.offerId.endDate
          };
        }
      });
    
      console.log("slotOffersMap for", dayData.day, slotOffersMap);
    
      return {
        day: dayData.day,
        openTime: dayData.openTime,
        closeTime: dayData.closeTime,
        timeSlots: timeSlots.map((slot) => ({
          slot,
          offer: slotOffersMap[slot.slice(0,5)] || null,
        })),  // No filter, so empty slots appear
      };
    });
    

    return {
      hours: formattedHours,
      availableOffers,
    };
  } catch (error) {
    console.error("Error formatting operating hours with offers only:", error);
    throw error;
  }
};
// exports.getFormattedOperatingHoursWithOnlyOffers = async () => {
//   try {
//     // Fetch all available offers
//     const availableOffers = await Offer.find({});

//     // Fetch operating hours and populate offer details
//     const operatingHours = await OperatingHoursOffer.find({})
//       .populate({
//         path: "timeSlotOffers.offerId",
//         model: "RestaurantOffers",
//         select: "name code offerType discountValue",
//       })
//       .sort({ day: 1 });

//     const formattedHours = operatingHours.map((dayData) => {
//       const timeSlots = generateTimeSlots(dayData.openTime, dayData.closeTime);
//       const slotOffersMap = {};

//       dayData.timeSlotOffers.forEach((slotOffer) => {
//         if (slotOffer.offerId._id) { // Ensure offerId is valid
//           slotOffersMap[slotOffer.timeSlot] = {
//             id: slotOffer.offerId._id,
//             name: slotOffer.offerId.name,
//             code: slotOffer.offerId.code,
//             offerType: slotOffer.offerId.offerType,
//             discountValue: slotOffer.offerId.discountValue,
//           };
//         }
//       });

//       console.log(`Day: ${dayData.day}, TimeSlots:`, timeSlots);
//       console.log(`Slot Offers for ${dayData.day}:`, slotOffersMap);

//       return {
//         day: dayData.day,
//         openTime: dayData.openTime,
//         closeTime: dayData.closeTime,
//         time: timeSlots,
//         slotOffersMap: slotOffersMap,
//         operatingHours: operatingHours,
//         timeSlots: timeSlots
//           .map((slot) => ({
//             slot,
//             offer: slotOffersMap[slot] || null,
//           }))
//           .filter((slotData) => slotData.offer !== null), // Only include slots with offers
//       };
//     });

//     return {
//       hours: formattedHours,
//       availableOffers,
//     };
//   } catch (error) {
//     console.error("Error formatting operating hours with offers only:", error);
//     throw error;
//   }
// };


// Export the helper if needed in other modules
exports.generateTimeSlots = generateTimeSlots;
