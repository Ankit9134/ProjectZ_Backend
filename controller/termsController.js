const Firm = require("../models/Firm");
const historyLogRecorder = require("../models/historyLog");

// Controller to handle terms and conditions acceptance
const acceptTerms = async (req, res) => {
  try {
    const { restaurantId, termsAccepted } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required",
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message: "Terms must be accepted to complete registration",
      });
    }

    // Find the restaurant
    const restaurant = await Firm.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Update restaurant with terms acceptance
    restaurant.termsAccepted = true;
    restaurant.termsAcceptedDate = new Date();
    restaurant.registrationStatus = "complete";

    await restaurant.save();

    // Log the terms acceptance
    historyLogRecorder(
      req,
      "Firm",
      "UPDATE",
      restaurant._id,
      `Terms and conditions accepted for restaurant ${
        restaurant.restaurantInfo?.name || restaurant._id
      }`
    );

    res.status(200).json({
      success: true,
      message: "Terms and conditions accepted. Registration complete!",
      restaurant: {
        id: restaurant._id,
        name: restaurant.restaurantInfo?.name,
        status: "complete",
      },
    });
  } catch (error) {
    console.error("Error accepting terms:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing terms acceptance",
      error: error.message,
    });
  }
};

module.exports = {
  acceptTerms,
};
