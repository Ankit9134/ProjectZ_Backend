


// Fixed routes/offers.js - Make sure all routes are properly defined
const express = require("express");
const router = express.Router();
const Offer = require("../../models/RestaurantsDasModel/Offer");
const Category = require("../../models/RestaurantsDasModel/categorySubCategory");
const Item = require("../../models/RestaurantsDasModel/item");
const Notify=require("../../models/logs/notify")
// Get all offers
router.get("/", async (req, res) => {
  try {
    const offers = await Offer.find({}).populate('items').populate('category').populate('subcategory');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//get the offers to accept by admin
router.get("/admin/offer", async (req, res) => {
  try {
    const offers = await Offer.find({adminAccept:false,display:true}).populate('items').populate('category').populate('subcategory');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//get the offers which are accepted by admin
router.get("/das/add", async (req, res) => {
  try {
    const offers = await Offer.find({adminAccept:true,display:true}).populate('items').populate('category').populate('subcategory');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//accepted by admin
router.put("/admin/accept/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const {status}=req.body;

    // Find the offer and update it
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      { adminAccept: true },
      { new: true }
    );
    console.log(updatedOffer)
    if (!updatedOffer) {
    
      return res.status(404).json({ message: "Offer not found" ,updatedOffer});
    }
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"offer_request",
      type:["restaurant"],
      message:`New offer ${status} approval`,
      metadata:{
        category:["admin"],
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
});

// Get subcategories by parent category
router.get("/categories/:parentId/subcategories", async (req, res) => {
  try {
    const subcategories = await Category.find({
      parentCategory: req.params.parentId
    });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get items by category or subcategory
router.get("/items", async (req, res) => {
  const { categoryId, subcategoryId } = req.query;
  const query = {};
  
  if (subcategoryId) {
    query.subcategoryId = subcategoryId;
  } else if (categoryId) {
    query.categoryId = categoryId;
  }

  try {
    const items = await Item.find(query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new offer
router.post("/", async (req, res) => {
  const offerData = req.body;
  
  // Ensure required fields are present
  if (!offerData.name || !offerData.code) {
    return res.status(400).json({ message: "Name and code are required fields" });
  }
  
  // Parse dates if they're strings
  if (offerData.startDate && typeof offerData.startDate === 'string') {
    offerData.startDate = new Date(offerData.startDate);
  }
  
  if (offerData.endDate && typeof offerData.endDate === 'string') {
    offerData.endDate = new Date(offerData.endDate);
  }
  
  // Make sure items is an array
  if (offerData.items && !Array.isArray(offerData.items)) {
    offerData.items = [offerData.items];
  }
  
  // Set defaults if missing
  if (!offerData.applicability) {
    offerData.applicability = "both";
  }
  
  try {
    const newOffer = new Offer(offerData);
    const savedOffer = await newOffer.save();

    const newNotify=new Notify({
            timestamp:new Date(),
            level:"offer_request",
            message:"New offer created by the restaurant admin please check it and approve it",
            type:["admin"],
            metadata:{
              category:"Restaurant",
              isViewed:false,
              isAccept:false,
              isReject:false,
            }
    })
    await newNotify.save();

    res.status(201).json(savedOffer);
  } catch (error) {
    console.error("Error saving offer:", error);
    res.status(400).json({ message: error.message });
  }
});



// Additional route to get a specific offer by ID
router.get("/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('items')
      .populate('category')
      .populate('subcategory');
      
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    res.json(offer);

  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ message: "Failed to fetch offer" });
  }
});



// Update an existing offer
router.put("/:id", async (req, res) => {
  try {
    const offerData = req.body;
    
    // Parse dates if they're strings
    if (offerData.startDate && typeof offerData.startDate === 'string') {
      offerData.startDate = new Date(offerData.startDate);
    }
    
    if (offerData.endDate && typeof offerData.endDate === 'string') {
      offerData.endDate = new Date(offerData.endDate);
    }
    
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id, 
      offerData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    const newNotify=new Notify({
            timestamp:new Date(),
            level:"offer_request",
            message:"New offer timeline is change by the restaurant admin",
            type:["admin"],
            metadata:{
              category:["Restaurant"],
              isViewed:false,
              isAccept:false,
              isReject:false,
            }
    })
    await newNotify.save();
    res.json(updatedOffer);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an offer
router.put("/delete/:id", async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      { display: false },
      { new: true }
    );
    
    if (!deletedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    console.log(deletedOffer)
    res.json({ message: "Offer deleted successfully" ,deletedOffer});
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ message: "Failed to delete offer" });
  }
});

router.put("/suggestion/:id",async(req,res)=>{
  try{
    const {suggestion}=req.body;
    console.log(req.params,suggestion)
    const {id}=req.params;
    console.log(id)
    if(!id || !suggestion){
    return  res.status(400).json({message:"id is required.."})
    }
    const find=await Offer.findByIdAndUpdate(id,{suggestion:suggestion},{new:true});
    if(!find){
    return  res.status(404).json({message:"offer is not found"});
    }
  return  res.status(200).json({message:"suggestion is posted.."});
  }
  catch(error){ 
 return res.status(404).json({message:error.message,error})
  }
})


module.exports = router;