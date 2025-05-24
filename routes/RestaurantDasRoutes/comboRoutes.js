const express = require("express");
const router = express.Router();
const Combo = require("../../models/RestaurantsDasModel/combo");
const Item = require("../../models/RestaurantsDasModel/item");

// Create a new combo
router.post("/", async (req, res) => {
  try {
    const { name, price, items } = req.body;

    // Validate required fields
    if (!name || !price || !items || items.length === 0) {
      return res.status(400).json({
        message: "Combo name, price, and at least one item are required",
      });
    }

    // Validate all item IDs exist
    const itemIds = items.map((item) => item.itemId);
    const validItems = await Item.find({ _id: { $in: itemIds } });
    if (validItems.length !== items.length) {
      return res.status(400).json({ message: "Invalid items in combo" });
    }

    // Create new combo
    const newCombo = await Combo.create({
      name,
      price,
      items: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    });

    res.status(201).json({
      message: "Combo created successfully",
      combo: newCombo,
    });
  } catch (error) {
    console.error("Error creating combo:", error);
    res.status(500).json({ message: "Failed to create combo" });
  }
});

// Get all combos with item details populated
router.get("/", async (req, res) => {
  try {
    const combos = await Combo.find().populate({
      path: "items.itemId",
      select: "name type categoryId subcategoryId pricing",
    });
    res.json(combos);
  } catch (error) {
    console.error("Error fetching combos:", error);
    res.status(500).json({ message: "Failed to fetch combos" });
  }
});

module.exports = router;
