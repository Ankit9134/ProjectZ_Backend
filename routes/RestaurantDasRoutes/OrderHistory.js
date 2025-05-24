const express = require("express");
const History=require("../../models/RestaurantsDasModel/History")

const router = express.Router();

router.get("/history", async (req, res) => {
  try {
    const history = await History.find();
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching order history.",
    });
  }
});

module.exports = router;
