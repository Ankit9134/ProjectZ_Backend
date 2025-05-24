const express = require("express");
const mongoose = require("mongoose");
const Order = require("../../models/UserOrderTakeaway");
const Offer = require("../../models/RestaurantsDasModel/Offer");
const User = require("../../models/user");
const router = express.Router();
const Cart = require("../../models/TakeAwayOrder");
const Notify=require("../../models/logs/notify")
const historyLogRecorder = require("../../utils/historyLogRecorder");
// Create an Order
router.post("/create", async (req, res) => {
  try {
    const {
      userId,
      items,
      totalPrice,
      deliveryFee,
      platformFee,
      gstCharges,
      offerId,
      orderTime,
      restaurantId,
      subtotal,
      discount

    } = req.body;

  

    // Retrieve user ID from session or request body
    const userId1 = req.session?.user?.id || userId;
    console.log(req.session);

    // Fetch the user from the database
    const user = await User.findById(userId1);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate total price
    console.log(orderTime)
    const parsedOrderTime = new Date(orderTime);
    if (isNaN(parsedOrderTime.getTime())) {
      return res.status(400).json({ error: "Invalid orderTime format." });
    }
    // Create a new order
    const order = new Order({
      userId: userId1,
      items,
      subtotal,
      deliveryFee,
      platformFee,
      gstCharges,
      totalPrice: totalPrice,
      discount,
      offerId,
      orderTime:parsedOrderTime,
      restaurantId,
      
    });

    // Save the order to the database
    const savedOrder = await order.save();
    await Cart.deleteMany({ userId: userId1 });
    historyLogRecorder(
      req,
      Order.modelName, // Log for Cart entity
      "CREATE", // Action
      order._id, // Updated Cart ID
      `order is placed by user ${user.username} from the restaurant ${restaurantId}.`
    );
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"New TakeAway order",
      type:['admin','restaurant'],
      message:"A notification from customer side a TakeAway order is placed please check it ",
      metadata:{
        category:["Restaurant","Customer"],
        isViewed:false,
        isAccept:false,
        isReject:false,
      }
    })
    await newNotify.save();
    return res.status(201).json({
      success: true,
      data: {
        message: "Order created successfully",
        order: savedOrder
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "An error occurred while creating the order" });
  }
});


// Get Offers for a User
router.get("/offers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch offers for the user
    const offers = await Offer.find({ applicableToUsers: userId }); // Replace with your offer logic
    return res.status(200).json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return res.status(500).json({ error: "An error occurred while fetching offers" });
  }
});

router.put("/order/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { status } },
      { returnDocument: "after", new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    historyLogRecorder(
      req,
      Order.modelName, // Log for Cart entity
      "UPDATE", // Action
      orderId, // Updated Cart ID
      `Order updated By the Admin: Action is ${status}.`
    );
    const newNotify=new Notify({
      timestamp:new Date(),
      level:"New TakeAway order",
      type:['admin','restaurant'],
      message:"A notification from order status is updated check it once ",
      metadata:{
        category:["Restaurant"],
        isViewed:false,
        isAccept:false,
        isReject:false,
      }
    })
    await newNotify.save();
    return res.status(200).json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "An error occurred while updating the order" });
  }
});


router.get("/all-orders", async (req, res) => {
    try {
      // Fetch all orders and populate references
      const orders = await Order.find({history:false})
        .populate({
          path: "items.productId",
          select: "name price category description", // Specify fields to include from Product
        })
        .populate({
          path: "items.restaurantName",
          model:"Firm",
          select: "restaurantInfo.name restaurantInfo.country restaurantInfo.address" // Specify fields to include from Restaurant
        })
        .populate({
          path: "userId",
          model: "User",
          select: "username email",
        });
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }
  
      return res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching all orders:", error);
      return res.status(500).json({ error: "An error occurred while fetching orders" });
    }
  });
  


  router.get("/takeaway/user", async (req, res) => {
    try {
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        // Get pagination parameters from the query string
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const skip = (page - 1) * limit;

        // Fetch takeaway orders with pagination
        const takeawayOrders = await Order.find({ userId: userId })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "items.productId",
                select: "name price category description",
            })
            .populate({
                path: "items.restaurantName",
                model: "Firm",
                select: "restaurantInfo.name restaurantInfo.country restaurantInfo.address image_urls",
            })
            .populate({
                path: "userId",
                model: "User",
                select: "username email",
            });

        if (!takeawayOrders || takeawayOrders.length === 0) {
            return res
                .status(404)
                .json({ message: "No takeaway orders found for this user" });
        }

        // Count total documents for the user
        const totalOrders = await Order.countDocuments({ userId: userId });

        return res.status(200).json({
            takeawayOrders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching user's takeaway orders:", error);
        return res.status(500).json({
            error: "An error occurred while fetching user's takeaway orders",
        });
    }
});


router.put("/orderFav/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { fav:status },
      {new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.status(200).json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "An error occurred while updating the order" });
  }
});

router.get("/orderFav",async(req,res)=>{
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Get pagination parameters from the query string
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    // Fetch takeaway orders with pagination
    const takeawayOrders = await Order.find({ userId: userId,fav:true })
        .skip(skip)
        .limit(limit)
        .populate({
            path: "items.productId",
            select: "name price category description",
        })
        .populate({
            path: "items.restaurantName",
            model: "Firm",
            select: "restaurantInfo.name restaurantInfo.country restaurantInfo.address image_urls",
        })
        .populate({
            path: "userId",
            model: "User",
            select: "username email",
        });

    if (!takeawayOrders || takeawayOrders.length === 0) {
        return res
            .status(404)
            .json({ message: "No takeaway orders found for this user" });
    }

    // Count total documents for the user
    const totalOrders = await Order.countDocuments({ userId: userId });

    return res.status(200).json({
        takeawayOrders,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
    });
} catch (error) {
    console.error("Error fetching user's takeaway orders:", error);
    return res.status(500).json({
        error: "An error occurred while fetching user's takeaway orders",
    });
}
})
module.exports = router;
