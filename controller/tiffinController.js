const Tiffin = require("../models/Tiffin");
const RestaurantDocument = require("../models/FirmDocuments");
const mongoose = require("mongoose");
const historyLogRecorder = require("../models/historyLog");
const fs = require("fs"); // Add fs import for file operations

/**
 * Add a new Tiffin service
 * @route POST /firm/addTiffin
 */
const addTiffin = async (req, res) => {
  console.log("Inside addTiffin function");
  console.log(req.body);

  try {
    const {
      firmName, // Using firmName for tiffin name
      ownerName,
      ownerEmail,
      ownerPhone,
      primaryContactNumber,
      cities,
      mealDays,
      flexibleOrderDates,
      category,
      cuisines, // Using cuisines for meals to maintain API consistency
    } = req.body;

    if (!firmName) {
      return res.status(400).json({
        success: false,
        message: "Tiffin name is required",
      });
    }

    // Use a mock user ID for testing (should be replaced with actual user ID in production)
    const mockUserId = new mongoose.Types.ObjectId();

    // Format mealDays into serviceDays for the menu
    const serviceDays = Array.isArray(mealDays) ? mealDays : [];

    // Create new tiffin service document using existing schema
    const newTiffin = new Tiffin({
      kitchenName: firmName,
      ownerMail: ownerEmail,
      ownerPhoneNo: {
        countryCode: ownerPhone ? ownerPhone.substring(0, 3) : "+91", // Extract country code with fallback
        number: ownerPhone ? ownerPhone.substring(3) : "", // Extract number with fallback
        fullNumber: ownerPhone || "",
      },
      // Format category to match schema
      category: [
        category === "Both" ? "both" : category?.toLowerCase() || "veg",
      ],
      // Initialize menu with service days and flexible dates from form
      menu: {
        serviceDays: serviceDays,
        isFlexibleDates: flexibleOrderDates || false,
        plans: [{ label: "Basic" }], // Default plan
        mealTypes: Array.isArray(cuisines)
          ? cuisines.map((meal) => ({
              label: meal,
              description: `${meal} meal`,
              prices: new Map([["Basic", 0]]), // Default price of 0 for now
            }))
          : [],
        instructions: [],
      },
      // Set deliveryCity based on cities selected
      deliveryCity: Array.isArray(cities) && cities.length > 0 ? cities[0] : "",
      // Default ratings
      ratings: 0,
      // Set owner
      kitchenOwner: [mockUserId],
      //Set nwlyAdded flag to true
      newlyAdded: true,
    });

    // Save to MongoDB database
    const savedTiffin = await newTiffin.save();
    console.log("Tiffin service saved with ID:", savedTiffin._id);

    // Record history log
    try {
      historyLogRecorder(
        req,
        savedTiffin.constructor.modelName,
        "CREATE",
        savedTiffin._id,
        `New tiffin service '${savedTiffin.kitchenName}' added with ID ${savedTiffin._id}`
      );
    } catch (logError) {
      console.warn("Warning: Unable to record history log", logError);
      // Continue execution even if logging fails
    }

    res.status(201).json({
      success: true,
      message: "Tiffin service information saved successfully",
      tiffin: {
        id: savedTiffin._id,
        name: savedTiffin.kitchenName,
      },
      nextStep: "/tiffin/documents", // URL for next registration step
    });
  } catch (error) {
    console.error("Error adding tiffin service: ", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

/**
 * Upload document for tiffin service
 * This follows the same pattern as restaurant document uploads
 * @route POST /firm/upload-tiffin-document
 */
const uploadTiffinDocument = async (req, res) => {
  try {
    const { tiffinId, documentType } = req.body;

    if (
      !tiffinId ||
      !documentType ||
      tiffinId === "null" ||
      tiffinId === "undefined"
    ) {
      return res.status(400).json({
        success: false,
        message: "Tiffin ID and document type are required",
      });
    }

    // Check if tiffin exists
    const tiffin = await Tiffin.findById(tiffinId);
    if (!tiffin) {
      return res.status(404).json({
        success: false,
        message: "Tiffin service not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Find existing document record or create new one
    // Important: We're using the same RestaurantDocument model
    // but with tiffinId in the restaurantId field
    let documentRecord = await RestaurantDocument.findOne({
      restaurantId: tiffinId,
    });

    if (!documentRecord) {
      documentRecord = new RestaurantDocument({
        restaurantId: tiffinId,
      });
    }

    // Update the specific document field based on documentType
    documentRecord[documentType] = req.file.path;

    // Save the document record
    await documentRecord.save();

    // Log the document upload
    try {
      historyLogRecorder(
        req,
        "RestaurantDocument",
        "UPDATE",
        documentRecord._id,
        `Document ${documentType} uploaded for tiffin service ${
          tiffin.kitchenName || tiffinId
        }`
      );
    } catch (logError) {
      console.warn("Warning: Unable to record history log", logError);
      // Continue execution even if logging fails
    }

    res.status(200).json({
      success: true,
      message: `${documentType} uploaded successfully`,
      filePath: req.file.path,
    });
  } catch (error) {
    console.error("Error uploading tiffin document: ", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading document",
      error: error.message,
    });
  }
};

/**
 * Get all documents for a tiffin service
 * @route GET /tiffinDocuments/:tiffinId
 */
const getTiffinDocuments = async (req, res) => {
  try {
    const { tiffinId } = req.params;
    const documents = await RestaurantDocument.findOne({
      restaurantId: tiffinId,
    });

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "No documents found for this tiffin service",
      });
    }

    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error retrieving tiffin documents", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving documents",
      error: error.message,
    });
  }
};

/**
 * Delete a specific document for a tiffin service
 * @route DELETE /tiffinDocuments/:tiffinId/:documentType
 */
const deleteTiffinDocument = async (req, res) => {
  try {
    const { tiffinId, documentType } = req.params;

    const documentRecord = await RestaurantDocument.findOne({
      restaurantId: tiffinId,
    });

    if (!documentRecord) {
      return res.status(404).json({
        success: false,
        message: "No documents found for this tiffin service",
      });
    }

    // Get the file path before removing it from the database
    const filePath = documentRecord[documentType];

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: `${documentType} not found for this tiffin service`,
      });
    }

    // Remove file from filesystem
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file: ", err);
      }
    });

    // Remove file path from database
    documentRecord[documentType] = undefined;
    await documentRecord.save();

    // Log the document deletion
    try {
      historyLogRecorder(
        req,
        "RestaurantDocument",
        "DELETE",
        documentRecord._id,
        `Document ${documentType} deleted for tiffin service ID ${tiffinId}`
      );
    } catch (logError) {
      console.warn("Warning: Unable to record history log", logError);
      // Continue execution even if logging fails
    }

    res.status(200).json({
      success: true,
      message: `${documentType} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting tiffin document: ", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting document",
      error: error.message,
    });
  }
};

/**
 * Complete tiffin registration process
 * @route POST /firm/complete-tiffin-registration
 */
const completeTiffinRegistration = async (req, res) => {
  try {
    const { tiffinId, termsAccepted } = req.body;

    if (!tiffinId || termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message: "Invalid tiffin ID or terms not accepted",
      });
    }

    // Find and update the tiffin service
    const updatedTiffin = await Tiffin.findByIdAndUpdate(
      tiffinId,
      {
        // Add any finalization fields if needed
        status: "active", // Add status field to indicate registration is complete
      },
      { new: true } // Return the updated document
    );

    if (!updatedTiffin) {
      return res.status(404).json({
        success: false,
        message: "Tiffin service not found",
      });
    }

    // Record history log
    try {
      historyLogRecorder(
        req,
        updatedTiffin.constructor.modelName,
        "UPDATE",
        updatedTiffin._id,
        `Completed registration for tiffin service '${updatedTiffin.kitchenName}'`
      );
    } catch (logError) {
      console.warn("Warning: Unable to record history log", logError);
      // Continue execution even if logging fails
    }

    res.status(200).json({
      success: true,
      message: "Tiffin service registration completed successfully",
    });
  } catch (error) {
    console.error("Error completing tiffin registration: ", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

/**
 * Get all tiffin services
 * @route GET /tiffin
 */
/**
 * Get all tiffin services
 * @route GET /tiffin
 */
const getAllTiffins = async (req, res) => {
  try {
    // Get query parameters for pagination or filtering
    const { limit = 20, page = 1, status } = req.query;
    const skip = (page - 1) * limit;

    // Build the query object
    let query = { newlyAdded: true };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Find tiffins with pagination
    const tiffins = await Tiffin.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-menu") // Exclude menu for performance
      .sort({ createdAt: -1 }); // Most recent first

    // Get total count for pagination
    const totalCount = await Tiffin.countDocuments(query);

    // Log the request
    historyLogRecorder(
      req,
      "Tiffin",
      "READ",
      tiffins.map((t) => t._id),
      `Retrieved list of all tiffins (page: ${page}, limit: ${limit})`
    );

    // Return the response
    return res.status(200).json({
      success: true,
      count: tiffins.length,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      tiffins,
    });
  } catch (error) {
    console.error("Error fetching all tiffins:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

// Export the functions
module.exports = {
  addTiffin,
  uploadTiffinDocument,
  getTiffinDocuments,
  getAllTiffins,
  deleteTiffinDocument,
  completeTiffinRegistration,
};
