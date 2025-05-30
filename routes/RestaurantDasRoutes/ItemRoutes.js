

const express = require("express");
const router = express.Router();
const multer = require("multer");
const Category = require("../../models/RestaurantsDasModel/categorySubCategory");
const Item = require("../../models/RestaurantsDasModel/item");

// Configure multer to store files in an "uploads" directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});
const upload = multer({ storage: storage });

// Create a new item with file upload handling
router.post("/", upload.array("images"), async (req, res) => {
  try {
    const {
      name,
      type,
      categoryId,
      subcategoryId,
      pricing,
      taxes,
      serviceType,
      description,
      dishDetails,
    } = req.body;

    // Parse JSON strings sent from the client
    const parsedServiceType = serviceType ? JSON.parse(serviceType) : [];
    const parsedDishDetails = dishDetails ? JSON.parse(dishDetails) : {};

    // Get file paths from uploaded images
    const imagePaths = req.files ? req.files.map((file) => file.path) : [];

    // Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Item name is required" });
    }
    if (!categoryId || !subcategoryId) {
      return res
        .status(400)
        .json({ message: "Category and subcategory are required" });
    }
    if (!pricing) {
      return res.status(400).json({ message: "Price is required" });
    }

    // Create the new item
    const newItem = await Item.create({
      name: name.trim(),
      type,
      categoryId,
      subcategoryId,
      pricing,
      taxes,
      serviceType: parsedServiceType,
      description,
      dishDetails: parsedDishDetails,
      images: imagePaths,
    });

    // Update item count in category and subcategory
    await Category.findByIdAndUpdate(categoryId, { $inc: { itemCount: 1 } });
    await Category.findByIdAndUpdate(subcategoryId, { $inc: { itemCount: 1 } });

    res.status(201).json({
      message: "Item created successfully",
      item: newItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Failed to create item" });
  }
  
});


// Move this outside the post handler
router.get("/all-items", async (req, res) => {
  try {
    const items = await Item.find()
      .populate("categoryId", "name")
      .populate("subcategoryId", "name");
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Failed to fetch items" });
  }
});



// Get items by service type
router.get("/", async (req, res) => {
  try {
    const { serviceType } = req.query;
    let query = {};

    if (serviceType) {
      query.serviceType = serviceType;
    }

    const items = await Item.find(query).populate("categoryId", "name");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceType } = req.body;

    if (!serviceType) {
      return res.status(400).json({ message: "Service type is required" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Set serviceType directly (replaces existing array)
    item.serviceType = Array.isArray(serviceType) ? serviceType : [serviceType];

    // Validate against enum
    const validServiceTypes = ["Dine-in", "Takeaway"];
    const isValid = item.serviceType.every((type) =>
      validServiceTypes.includes(type)
    );
    if (!isValid) {
      return res.status(400).json({
        message: 'Service type must be "Dine-in" or "Takeaway"',
      });
    }

    await item.save();

    res.json({
      message: "Service type updated successfully",
      item,
    });
  } catch (error) {
    console.error("Error updating item service type:", error);
    res.status(500).json({ message: "Failed to update item" });
  }
});

// Update multiple items with service types
router.post("/update-service-types", async (req, res) => {
  try {
     const { items, addServiceTypes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Valid items array is required" });
    }

    for (const itemId of items) {
      const item = await Item.findById(itemId);
      if (!item) continue;

      if (addServiceTypes && Array.isArray(addServiceTypes)) {
        for (const serviceType of addServiceTypes) {
          if (!item.serviceType.includes(serviceType)) {
            item.serviceType.push(serviceType);
          }
        }
      }

      await item.save();
    }
    res.json({
      message: "Items updated successfully",
      updatedCount: updates.length,
      items: updates,
    });
  } catch (error) {
    console.error("Error updating items service types:", error);
    res.status(500).json({ message: "Failed to update items" });
  }
});
module.exports = router;