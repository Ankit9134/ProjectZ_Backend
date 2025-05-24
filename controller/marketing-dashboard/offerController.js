const OfferMarketing = require('../../models/marketing-dashboard/Offers')
const Notify=require("../../models/logs/notify")
exports.getAllOffers = async (req, res) => {
    try{
        const offers = await OfferMarketing.find({adminAccept:true,display:true})
        return res.status(200).json(offers)
    } catch(err) {
        res.status(500).json({
            Message: 'Error while fetching offer:',
            Error: err.message
        })
    }
}
exports.getAdminOffers=async(req,res)=>{
  try{
    const offers = await OfferMarketing.find({adminAccept:false,display:true})
    return res.status(200).json(offers)
} catch(err) {
    res.status(500).json({
        Message: 'Error while fetching offer:',
        Error: err.message
    })
}
}
// exports.suggestion=async(req,res)=>{

//     try{
//       console.log("body",req.body)
//       const {suggestion}=req.body;
//       console.log("suggestion",suggestion);

//       const {id}=req.params;
//       if(!id || suggestion){
//         res.status(400).json({message:"id is required.."})
//       }
//       const find=await Offer.findByIdAndUpdate(id,{suggestion:suggestion},{new:true});
//       if(!find){
//         res.status(404).json({message:"offer is not found"});
//       }

//         const newNotify=new Notify({
//                   timestamp:new Date(),
//                   level:"A suggestion is created by admin",
//                   message:"a suggestion is post by admin",
//                   type:['marketing','restaurant'],
//                   metadata:{
//                     category:["admin",],
//                     isViewed:false,
//                     isAccept:false,
//                     isReject:false,
//                   }
//           })
//           await newNotify.save();
//       res.status(200).json({message:"suggestion is posted.."});
//     }
//     catch(error){
//   res.status(404).json({message:error.message,error})
//     }
// }
exports.suggestion = async (req, res) => {
  try {
    console.log("body", req.body);
    const { suggestion } = req.body;
    console.log("suggestion", suggestion);

    const { id } = req.params;

    // Validate ID and suggestion
    if (!id) {
      return res.status(400).json({ message: "ID is required." });
    }

    if (!suggestion) {
      return res.status(400).json({ message: "Suggestion is required." });
    }

    // Update the offer with the suggestion
    const find = await OfferMarketing.findByIdAndUpdate(id, { suggestion: suggestion }, { new: true });
    if (!find) {
      return res.status(404).json({ message: "Offer not found." });
    }

    // Create a new notification
    const newNotify = new Notify({
      timestamp: new Date(),
      level: "A suggestion is created by admin",
      message: "A suggestion is posted by admin",
      type: ['marketing', 'restaurant'],
      metadata: {
        category: ["admin"],
        isViewed: false,
        isAccept: false,
        isReject: false,
      },
    });

    await newNotify.save();

    // Send success response
    return res.status(200).json({ message: "Suggestion is posted successfully." });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: error.message, error });
  }
};

exports.AdminAccept= async (req, res) => {
  try {
    const { id } = req.params;
    const {status}=req.body;

    // Find the offer and update it
    const updatedOffer = await OfferMarketing.findByIdAndUpdate(
      id,
      { adminAccept: true },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"offer_request",
      type:['marketing','restaurant'],
      message:"New offer confirm approval",
      metadata:{
        category:["Admin",'marketing'],
        isViewed:false,
        isAccept: status === true,
        isReject: status !== true,
      }
    })  
    await newNotify.save();
    res.json({ message: "Offer accepted successfully", offer: updatedOffer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

exports.createOffer = async (req, res) => {
    try{
    const {name, discount, type, status, startDate, endDate} = req.body;
    const offer = new OfferMarketing({
        name,
        discount,
        type,
        status,
        startDate,
        endDate
    })
    await offer.save()
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"offer_request",
      type:['admin','restaurant'],
      message:"New offer Created waiting for approval",
      metadata:{
        category:["Marketing"],
        isViewed:false,
        isAccept:false,
        isReject:false,
      }
    })  
    await newNotify.save();
    res.status(201).json({
        message: "Offer created succesfully",
        offer
    })
    }
    catch(error) {
        res.status(400).send({
            message: "error while creating offer",
            error: error.message
        })
    }
}

exports.updateOffer = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, ...rest } = req.body;
  
    try {
      let updateData = { ...rest };
  
      // If both dates are provided, use them directly.
      if (startDate && endDate) {
        updateData.startDate = startDate;
        updateData.endDate = endDate;
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (now < start) {
          updateData.status = "Upcoming";
        } else if (now > end) {
          updateData.status = "Expired";
        } else {
          updateData.status = "Active";
        }
      }
      // If only one date is provided, merge with existing offer values.
      else if (startDate || endDate) {
        // Fetch the existing offer to get missing date(s)
        const existingOffer = await OfferMarketing.findById(id);
        if (!existingOffer) {
          return res.status(404).json({ message: "Offer not found" });
        }
        // Determine new start and end dates
        const newStart = startDate ? new Date(startDate) : new Date(existingOffer.startDate);
        const newEnd = endDate ? new Date(endDate) : new Date(existingOffer.endDate);
        updateData.startDate = startDate ? startDate : existingOffer.startDate;
        updateData.endDate = endDate ? endDate : existingOffer.endDate;
  
        const now = new Date();
        if (now < newStart) {
          updateData.status = "Upcoming";
        } else if (now > newEnd) {
          updateData.status = "Expired";
        } else {
          updateData.status = "Active";
        }
      }
      // If no date fields are being updated, no need to change the status.
      // The updateData will be processed by the pre-update hook if both dates are present.
  
      const updatedOffer = await OfferMarketing.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedOffer) return res.status(404).json({ message: "Offer not found" });
      const newNotify=new Notify({
        timestamp:new Date(),
        level:"A Offer request",
        type:['admin','restaurant'],
        message:"A offer is modify by the marketing dashboard",
        metadata:{
          category:["Marketing"],
          isViewed:false,
          isAccept:false,
          isReject:false,
        }
})
await newNotify.save();
      res.json({ message: "Offer updated", updatedOffer });
    } catch (err) {
      res.status(500).json({ message: "Failed to update offer", error: err.message });
    }
  };



exports.deleteOffer = async (req, res) => {
    const {id} = req.params
    try {
        const offer = await OfferMarketing.findByIdAndUpdate(id,{display:false},{new:true})
        if(!offer) return res.status(404).json({message: "offer not found"})
    
        res.status(204).json({message: "offer deleted", offerId: offer})
    } catch(err) {
        res.status(500).json({message: "failed to delete offer", error: err.message})
    }
}