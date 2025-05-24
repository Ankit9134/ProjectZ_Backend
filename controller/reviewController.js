const express = require("express");
const Review = require("../models/Reviews");
const router = express.Router();
const User = require("../models/user");
const historyLogRecorder = require("../utils/historyLogRecorder"); // Adjust path
const mongoose=require('mongoose')
const Firm = require('../models/Firm'); // Adjust the path as necessary

router.post("/reviews", async (req, res) => {
  console.log("Raw request body:", req.body);

  // Ensure newReview object exists and destructure needed fields
  if (!req.body.newReview) {
    return res.status(400).json({ error: "Missing 'newReview' object in request body." });
  }

  const {
    email,
    date = new Date(), // Default date if not provided
    days,
    rating,
    reviewText,
    reviewType,
    aspects, // Assuming aspects is an object sent from frontend
    firm,    // Expecting ObjectId string or null
    tiffin   // Expecting ObjectId string or null
  } = req.body.newReview;

  // --- Basic Validation --- 
  if (!email || !reviewText) {
    return res
      .status(400)
      .json({ error: "Email and reviewText are required." });
  }

  // Validate rating if necessary (Mongoose schema might handle this too)
  if (rating !== undefined && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
     return res.status(400).json({ error: "Invalid rating value." });
  }

  try {
    // --- Find User --- 
    console.log(`Finding user with email: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res
        .status(404)
        .json({ error: "User with the provided email does not exist." });
    }
    console.log(`User found: ${user._id}`);

    // --- Construct Review Data Explicitly --- 
    const reviewData = {
        authorName: user._id,      // Assign the ObjectId from the looked-up user
        email: email,             // Assign the validated email string
        date: date,               // Use the provided or defaulted date
        rating: rating,           // Assign the rating number
        reviewText: reviewText,    // Assign the review text string
        reviewType: reviewType,    // Assign the type string
        // Optional fields - include only if they exist and are needed by schema
        ...(days && { days: days }),
        ...(aspects && typeof aspects === 'object' && { aspects: aspects }), // Include aspects if it's an object
        ...(firm && mongoose.Types.ObjectId.isValid(firm) && { firm: new mongoose.Types.ObjectId(firm) }), // Convert firm string to ObjectId if valid
        ...(tiffin && mongoose.Types.ObjectId.isValid(tiffin) && { tiffin: new mongoose.Types.ObjectId(tiffin) }) // Convert tiffin string to ObjectId if valid
    };

    console.log("Constructed review data for saving:", reviewData);

    // --- Create and Save Review --- 
    const review = new Review(reviewData);
    const savedReview = await review.save(); // This should now work

    console.log(`Review saved successfully: ${savedReview._id}`);

    // --- Populate and Respond --- 
    // Populate authorName and potentially firm/tiffin if needed for display
    const populatedReview = await Review.findById(savedReview._id)
        .populate("authorName", "username profileImage") // Populate specific fields from User
        // Add .populate for firm/tiffin if you need their names in the response
        // .populate("firm", "restaurantInfo.name") 
        // .populate("tiffin", "kitchenName") 
        .lean(); // Use lean for plain JS object response

    // --- History Logging --- 
    // Consider making historyLogRecorder async if it involves DB operations
    historyLogRecorder(
      req, // Pass the request object
      savedReview.constructor.modelName, // Entity: "Review"
      "CREATE", // Action: CREATE
      [savedReview._id], // Entity ID (as array)
      `New review (ID: ${savedReview._id}) submitted by user ${user.email}` // Description
    );

    // --- Send Response --- 
    res.status(201).json(populatedReview); // Return the populated review

  } catch (error) {
    console.error("Error during review creation:", error);
    // Provide more specific error info if it's a validation error
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: "Review validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error during review creation.", details: error.message });
  }
});

// router.get("/reviews", async (req, res) => {
//   try {
//     const {
//       firm,
//       tiffin,
//       reviewType,
//       page = 1,
//       limit = 10,
//       sort = "-date",
//     } = req.query;
//     const filter = {};

//     if (firm) filter.firm = firm;
//     if (tiffin) filter.tiffin = tiffin;
//     if (reviewType) filter.reviewType = reviewType;

//     const reviews = await Review.find(filter)
//       .populate({
//         path: "authorName",
//         select: "name email",
//       })
//       .populate({
//         path: "firm",
//         select: "name",
//       })
//       .populate({
//         path: "tiffin",
//         select: "name",
//       })
//       .sort(sort)
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .lean(); // lean() returns plain JS objects for faster reads

//     const totalReviews = await Review.countDocuments(filter);

//     res.status(200).json({
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total: totalReviews,
//       reviews,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// router.get("/reviews", async (req, res) => {
//   try {
//     const {
//       firm,
//       tiffin,
//       reviewType,
//       page = 1,
//       limit = 10,
//       sort = "-date",
//     } = req.query;

//     const filter = {};

//     // Convert firm and tiffin to ObjectId if they are supposed to be ObjectId
//     if (firm)
//       filter.firm = mongoose.Types.ObjectId.isValid(firm)
//         ? new mongoose.Types.ObjectId(firm)
//         : firm;
//     if (tiffin)
//       filter.tiffin = mongoose.Types.ObjectId.isValid(tiffin)
//         ? new mongoose.Types.ObjectId(tiffin)
//         : tiffin;
//     if (reviewType) filter.reviewType = reviewType;

//     const reviews = await Review.find(filter)
//       .populate({
//         path: "firm",
//         select: "restaurantInfo.name",
//       })
//       .populate({
//         path: "tiffin",
//         select: "name",
//       })
//       .sort(sort)
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .lean(); // lean() for faster response

//     const totalReviews = await Review.countDocuments(filter);

//     historyLogRecorder({
//       req,
//       entity: "Review",
//       action: "READ",
//       entityId: [firm, tiffin],
//       description: `Fetched reviews with filters: ${JSON.stringify(filter)}`,
//     });

//     res.status(200).json({
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total: totalReviews,
//       reviews,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.get("/reviews", async (req, res) => {

  try {
    const {firm, page = 1, limit = 10, sort = "-date" } = req.query;

    if (!firm) {
      return res.status(400).json({ error: "Firm ID is required" });
    }

    // Validate the firm ID
    if (!mongoose.Types.ObjectId.isValid(firm)) {
      return res.status(400).json({ error: "Invalid firm ID" });
    }

    const filter = { firm: new mongoose.Types.ObjectId(firm) };

    const reviews = await Review.find(filter)
      .populate({
        path: "firm",
        select: "restaurantInfo.name",
      })
      .populate({
        path: "tiffin",
        select: "name",
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(); // lean() for faster response

    const totalReviews = await Review.countDocuments(filter);

    // Log the history
    historyLogRecorder({
      req,
      entity: "Review",
      action: "READ",
      entityId: firm,
      description: `Fetched reviews for firm ID: ${firm}`,
    });

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalReviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).lean();
    if (!review) {
      historyLogRecorder(
        req,
        "Review",
        "READ",
        [req.params.id],
        `Attempted to read non-existent review ID ${req.params.id}`
      );
      return res
        .status(404)
        .json({ response: false, message: "Review not found" });
    }

    historyLogRecorder(
      req,
      "Review",
      "READ",
      [review._id],
      `Read review with ID ${review._id}`
    );
    res.status(200).json({ response: true, review });
  } catch (error) {
    historyLogRecorder(
      req,
      "Review",
      "READ",
      [req.params.id],
      `Error reading review ID ${req.params.id}: ${error.message}`
    );
    res.status(500).json({ response: false, message: error.message });
  }
});

router.put("/reviews/:id", async (req, res) => {
  try {
    // Destructure isHidden along with other potential update fields
    const { firm, tiffin, isHidden, ...updateData } = req.body;

    // Construct the update object, including isHidden if provided
    const updatePayload = {
      ...updateData,
      firm: firm || null,
      tiffin: tiffin || null,
    };

    // Only add isHidden to the payload if it's explicitly included in the request body
    if (typeof isHidden === 'boolean') {
      updatePayload.isHidden = isHidden;
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!review) {
      historyLogRecorder(
        req,
        "Review",
        "UPDATE",
        [req.params.id],
        `Attempted to update non-existent review ID ${req.params.id}`
      );
      return res
        .status(404)
        .json({ response: false, message: "Review not found" });
    }

    historyLogRecorder(
      req,
      review.constructor.modelName,
      "UPDATE",
      [review._id],
      `Updated review with ID ${review._id} (isHidden: ${review.isHidden})` // Log isHidden status
    );
    res.status(200).json({ response: true, review });
  } catch (error) {
    historyLogRecorder(
      req,
      "Review",
      "UPDATE",
      [req.params.id],
      `Error updating review ID ${req.params.id}: ${error.message}`
    );
    res.status(400).json({ response: false, message: error.message });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      historyLogRecorder(
        req,
        "Review",
        "DELETE",
        [req.params.id],
        `Attempted to delete non-existent review ID ${req.params.id}`
      );
      return res
        .status(404)
        .json({ response: false, message: "Review not found" });
    }

    historyLogRecorder(
      req,
      "Review", // Cannot use review.constructor.modelName as it's deleted
      "DELETE",
      [req.params.id], // Use req.params.id as review might be just data
      `Deleted review with ID ${req.params.id}`
    );
    res
      .status(200)
      .json({ response: true, message: "Review deleted successfully" });
  } catch (error) {
    historyLogRecorder(
      req,
      "Review",
      "DELETE",
      [req.params.id],
      `Error deleting review ID ${req.params.id}: ${error.message}`
    );
    res.status(500).json({ response: false, message: error.message });
  }
});

router.post("/reviews/:id/comments", async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment)
      return res
        .status(400)
        .json({ response: false, message: "Comment is required" });

    const review = await Review.findById(req.params.id);
    if (!review) {
      historyLogRecorder(
        req,
        "Review",
        "UPDATE",
        [req.params.id],
        `Attempted to add comment to non-existent review ID ${req.params.id}`
      );
      return res
        .status(404)
        .json({ response: false, message: "Review not found" });
    }

    review.comments.push(comment);
    const updatedReview = await review.save();

    historyLogRecorder(
      req,
      updatedReview.constructor.modelName,
      "UPDATE",
      [updatedReview._id],
      `Added comment to review with ID ${updatedReview._id}`
    );
    res.status(200).json({ response: true, review: updatedReview });
  } catch (error) {
    res.status(400).json({ response: false, message: error.message });
  }
});

router.post("/reviews/:id/like", async (req, res) => {
  const { email } = req.body;
  const reviewId = req.params.id;

  if (!email) {
    return res.status(400).json({
      response: false,
      message: "Email is required to like/unlike a review.",
    });
  }

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      // historyLogRecorder(
      //   req,
      //   "Review",
      //   "UPDATE",
      //   [reviewId],
      //   `Attempted to like/unlike non-existent review ID ${reviewId}`
      // );
      return res
        .status(404)
        .json({ response: false, message: "Review not found." });
    }

    const hasLiked = review.likedBy.includes(email);
    let logDescription = "";

    if (hasLiked) {
      review.likes = Math.max(0, review.likes - 1); // Prevent negative likes
      review.likedBy = review.likedBy.filter(
        (userEmail) => userEmail !== email
      );
      logDescription = `User ${email} unliked review ID ${review._id}`;
    } else {
      review.likes += 1;
      review.likedBy.push(email);
      logDescription = `User ${email} liked review ID ${review._id}`;
    }

    const updatedReview = await review.save();

    historyLogRecorder(
      req,
      updatedReview.constructor.modelName,
      "UPDATE",
      [updatedReview._id],
      logDescription
    );

    res.status(200).json({
      response: true,
      likes: updatedReview.likes,
      likedBy: updatedReview.likedBy,
      message: hasLiked
        ? "Review unliked successfully."
        : "Review liked successfully.",
    });
  } catch (error) {
    console.error("Error liking/unliking review:", error.message);
    res.status(500).json({
      response: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
});
// Get reviews by user ID
router.get('/reviews/user/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid User ID format" });
      }

      // Query based on authorName, which is an ObjectId
      // Populate authorName to get username and firm to get restaurant details
      const reviews = await Review.find({ authorName: userId })
          .populate('authorName', 'username') // Populate username from User model
          .populate({
              path: 'firm', // Populate the firm field
              select: 'restaurantInfo.name restaurantInfo.address restaurantInfo.imageUrl' // Select specific fields from Firm's restaurantInfo
          })
          .lean(); // Use lean for plain JS object

      res.status(200).json(reviews);
  } catch (error) {
      console.error("Error fetching reviews for user:", error); // Log the specific error
      res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
