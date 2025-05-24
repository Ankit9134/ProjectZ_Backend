const express = require("express");
const router = express.Router();
const Booking = require("../../models/RestaurantsDasModel/Booking");
const Notify =require("../../models/logs/notify");
const {sendConfirmationEmail,sendCancelationEmail,sendPendingConfirmationEmail}=require("../../routes/CustomerNotification/DiningEmailNotify")
router.post("/", async (req, res) => {
  try {
    const firmId=req.query.id;
    const { date, timeSlot, guests, meal, offerId,username,email,mobileNumber } = req.body;
    const newBooking = new Booking({
      date,
      timeSlot,
      guests,
      meal,
      offerId: offerId || null,
      firm:firmId,
      username,
      email,
      mobileNumber
    });
    const savedBooking = await newBooking.save();
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"According to Dining",
      type:['admin','restaurant'],
      message:"A new dining booking has been made. Please review the details.",
      metadata:{
        category:["dining",'Customer'],
        status:"pending",
        isViewed:false,
        isAccept:false,
        isReject:false,
      }
    })
    const userEmail=email;
    const bookingDate=date;
    const offerName=offerId;
    sendPendingConfirmationEmail(userEmail, username, bookingDate, timeSlot, offerName)
    await newNotify.save();
    res.status(201).json(savedBooking)
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/",async(req,res)=>{
  try{
    const Bookings=await Booking.find({history:false}).populate({
      path: "offerId",
      model: "RestaurantOffers",
      select: "name code offerType discountValue"
    })
    .populate({
      path:"firm",
      model:"Firm",
      select:"restaurantInfo.name"
    })
    res.status(200).json(Bookings)
  }
  catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({ message: error.message });
  }
})


router.post("/:id", async (req, res) => {
  const { status } = req.body;

  try {
      const { id } = req.params;
      const booking = await Booking.findByIdAndUpdate(
          id,
          { status },
          { new: true, runValidators: true }
      );

      if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
      }

      // Assuming offer details are accessible from the booking or offerId
      const offer = await booking.populate({
        path: "offerId",
        model: "RestaurantOffers",
        select: "name code offerType discountValue"
      });
      console.log(offer) // If offer details are in a related Offer document.
      const offerName = offer?.offerId?.name || "N/A";
      const offerCode = offer?.offerId?.code || "N/A";
      const offerPercentage = offer?.offerId?.discountValue || 0;
      const moreInfo = offer?.offerId?.description || "N/A";
      const timeSlot = booking.timeSlot;
      const bookingDate = booking.date;
      const username = booking.username;
      const userEmail = booking.email;

      if (status === "accepted") {
          await sendConfirmationEmail(userEmail, username, bookingDate, timeSlot, offerName, offerCode, offerPercentage, moreInfo);
          const newNotify=new Notify({
            timestamp:new Date(),
            level:"According to Dining",
            type:['admin','restaurant'],
            message:"A dining booking is accepted by admin. Please review the details.",
            metadata:{
              category:["dining"],
              isViewed:false,
              isAccept:true,
              isReject:false,

            }
          })
          await newNotify.save();

      } else if (status === "canceled") {
          await sendCancelationEmail(userEmail, username, bookingDate, timeSlot, offerName, offerCode, offerPercentage, moreInfo);
          const newNotify=new Notify({
            timestamp:new Date(),
            level:"According to Dining",
            type:['admin','restaurnat'],
            message:"A dining booking is canceled by admin. Please review the details.",
            metadata:{
              category:["dining"],
              isViewed:false,
              isAccept:false,
              isReject:true,

            }
          })
          await newNotify.save();
      }

      res.status(200).json({ message: "Updated successfully", booking });
  } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
