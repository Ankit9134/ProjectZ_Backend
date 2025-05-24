// Controller: claimRestaurantController.js
const Restaurant = require("../models/claimRestaurant");

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Get a single restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id); // Make sure you have the correct model
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving restaurant" });
  }
};

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const newRestaurant = new Restaurant(req.body);
    await newRestaurant.save();
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Update an existing restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedRestaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Change restaurant status (Admin only)
exports.changeRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedRestaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Delete a restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id);
    if (!deletedRestaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

exports.getRestaurantByOwnerName = async (req, res) => {
  try {
    const { ownerName } = req.params;

    if (!ownerName) {
      return res
        .status(400)
        .json({ success: false, message: "Owner Name is required" });
    }

    const restaurant = await RestaurantClaimOwnerside.findOne({
      ownerName: String(ownerName),
    });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({ success: true, restaurant });
  } catch (error) {
    console.error("Error fetching restaurant by ownerName:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
