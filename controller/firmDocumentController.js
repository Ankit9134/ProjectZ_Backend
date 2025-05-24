// const RestaurantDocument = require("../models/FirmDocuments");

// const Firm = require("../models/Firm");
// const fs = require("fs");
// const multer = require("multer");
// const path = require("path");
// const mongoose = require("mongoose");
// const historyLogRecorder = require("../models/historyLog");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Create uploads/documents directory if it doesn't exist
//     const dir = "uploads/documents";
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     // Get document type from the request
//     const documentType = req.body.documentType || "document";

//     // Get original file extension
//     const ext = path.extname(file.originalname);

//     // Create more descriptive filename
//     // Format: documentType-restaurantId-timestamp.extension
//     const restaurantId = req.body.restaurantId || "unknown";
//     const timestamp = Date.now();

//     const newFilename = `${documentType}-${restaurantId.substring(
//       0,
//       8
//     )}-${timestamp}${ext}`;

//     cb(null, newFilename);
//   },
// });

// //File filter to only allow images
// const fileFilter = (req, file, cb) => {
//   //Accept only image files
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed!"), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, //Currently we are only allowing files which are upto 5MB
//   },
// });

// //Controller function to upload a document
// const uploadDocument = async (req, res) => {
//   try {
//     const { restaurantId, documentType } = req.body;

//     if (
//       !restaurantId ||
//       !documentType ||
//       restaurantId === "null" ||
//       restaurantId === "undefined"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Restaurant ID and document type are required",
//       });
//     }

//     //Checking restaurant exists or not
//     const restaurant = await Firm.findById(restaurantId);
//     if (!restaurant) {
//       return res.status(404).json({
//         success: false,
//         message: "Restaurant not found",
//       });
//     }

//     //check if file was uploaded already
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     //Find existing document record or create new one
//     let documentRecord = await RestaurantDocument.findOne({ restaurantId });

//     if (!documentRecord) {
//       documentRecord = new RestaurantDocument({
//         restaurantId: restaurantId,
//       });
//     }

//     //Update the specific document field based on documentType
//     documentRecord[documentType] = req.file.path;

//     //save the document record
//     await documentRecord.save();

//     //Log the document upload
//     historyLogRecorder(
//       req,
//       "RestaurantDocument",
//       "UPDATE",
//       documentRecord._id,
//       `Document ${documentType} uploaded for restaurant ${
//         restaurant.restaurantInfo?.name || restaurantId
//       }`
//     );

//     res.status(200).json({
//       success: true,
//       message: `${documentType} uploaded successfully`,
//       filePath: req.file.path,
//     });
//   } catch (error) {
//     console.error("Error uploading document : ", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while uploading document",
//       error: error.message,
//     });
//   }
// };

// //Controller to get all documents for a restaurant
// const getRestaurantDocuments = async (req, res) => {
//   try {
//     const { restaurantId } = req.params;
//     const documents = await RestaurantDocument.findOne({ restaurantId });

//     if (!documents) {
//       return res.status(404).json({
//         success: false,
//         message: "No documents found for this restaurant",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       documents,
//     });
//   } catch (error) {
//     console.error("Error retrieving restaurant documents", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while retrieving documents",
//       error: error.message,
//     });
//   }
// };

// //Controller to delete Document
// const deleteDocument = async (req, res) => {
//   try {
//     const { restaurantId, documentType } = req.params;

//     const documentRecord = await RestaurantDocument.findOne({ restaurantId });

//     if (!documentRecord) {
//       return res.status(404).json({
//         success: false,
//         message: "No documents found for this restaurant",
//       });
//     }

//     //Get the file path before removing it from the database
//     const filePath = documentRecord[documentType];

//     if (!filePath) {
//       return res.status(404).json({
//         success: false,
//         message: `${documentType} not found for this restaurant`,
//       });
//     }

//     //Removing file from filesystem
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error("Error deleting file : ", err);
//       }
//     });

//     //Remove file path from database
//     documentRecord[documentType] = undefined;
//     await documentRecord.save();

//     //Log the document deletion
//     historyLogRecorder(
//       req,
//       "RestaurantDocument",
//       "DELETE",
//       documentRecord._id,
//       `Document ${documentType} deleted for restaurant ID ${restaurantId}`
//     );

//     res.status(200).json({
//       success: true,
//       message: `${documentType} deleted successfully`,
//     });
//   } catch (error) {
//     console.error("Error deleting document : ", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while deleting document",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   upload,
//   uploadDocument,
//   getRestaurantDocuments,
//   deleteDocument,
// };

const RestaurantDocument = require("../models/FirmDocuments");
const Firm = require("../models/Firm");
const Tiffin = require("../models/Tiffin"); // Add Tiffin model import
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const historyLogRecorder = require("../models/historyLog");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads/documents directory if it doesn't exist
    const dir = "uploads/documents";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Get document type from the request
    const documentType = req.body.documentType || "document";

    // Get original file extension
    const ext = path.extname(file.originalname);

    // Create more descriptive filename
    // Format: documentType-serviceId-timestamp.extension
    // Handle both restaurant and tiffin IDs
    const serviceId = req.body.restaurantId || req.body.tiffinId || "unknown";
    const timestamp = Date.now();

    const newFilename = `${documentType}-${serviceId.substring(
      0,
      8
    )}-${timestamp}${ext}`;

    cb(null, newFilename);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Currently we are only allowing files which are up to 10MB
  },
});

// Controller function to upload a document
const uploadDocument = async (req, res) => {
  try {
    console.log("Document upload request body:", req.body);

    // Check for restaurant or tiffin ID
    const { restaurantId, tiffinId, documentType, serviceType } = req.body;
    const serviceId = restaurantId || tiffinId;

    if (
      !serviceId ||
      !documentType ||
      serviceId === "null" ||
      serviceId === "undefined"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Service ID (restaurant or tiffin) and document type are required",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let serviceName = "unknown";

    // Checking if the service exists based on service type or ID
    if (tiffinId || serviceType === "tiffin") {
      // Check tiffin exists
      const tiffin = await Tiffin.findById(tiffinId);
      if (!tiffin) {
        return res.status(404).json({
          success: false,
          message: "Tiffin service not found",
        });
      }
      serviceName = tiffin.kitchenName || tiffinId;
    } else {
      // Check restaurant exists
      const restaurant = await Firm.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }
      serviceName = restaurant.restaurantInfo?.name || restaurantId;
    }

    // Find existing document record or create new one
    // Important: We're using restaurantId field for both restaurant and tiffin services
    let documentRecord = await RestaurantDocument.findOne({
      restaurantId: serviceId,
    });

    if (!documentRecord) {
      documentRecord = new RestaurantDocument({
        restaurantId: serviceId,
      });
    }

    // Update the specific document field based on documentType
    documentRecord[documentType] = req.file.path;

    // Save the document record
    await documentRecord.save();

    // Log the document upload with appropriate service type
    const serviceTypeStr =
      tiffinId || serviceType === "tiffin" ? "tiffin service" : "restaurant";

    historyLogRecorder(
      req,
      "RestaurantDocument",
      "UPDATE",
      documentRecord._id,
      `Document ${documentType} uploaded for ${serviceTypeStr} ${serviceName}`
    );

    res.status(200).json({
      success: true,
      message: `${documentType} uploaded successfully`,
      filePath: req.file.path,
    });
  } catch (error) {
    console.error("Error uploading document: ", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading document",
      error: error.message,
    });
  }
};

// Controller to get all documents for a service (restaurant or tiffin)
const getServiceDocuments = async (req, res) => {
  try {
    const { serviceId, serviceType } = req.params;
    const idToUse = serviceId;

    const documents = await RestaurantDocument.findOne({
      restaurantId: idToUse,
    });

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: `No documents found for this ${serviceType || "service"}`,
      });
    }

    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error retrieving service documents", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving documents",
      error: error.message,
    });
  }
};

// Controller to delete Document
const deleteDocument = async (req, res) => {
  try {
    const { serviceId, documentType, serviceType } = req.params;
    const idToUse = serviceId;

    const documentRecord = await RestaurantDocument.findOne({
      restaurantId: idToUse,
    });

    if (!documentRecord) {
      return res.status(404).json({
        success: false,
        message: `No documents found for this ${serviceType || "service"}`,
      });
    }

    // Get the file path before removing it from the database
    const filePath = documentRecord[documentType];

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: `${documentType} not found for this ${
          serviceType || "service"
        }`,
      });
    }

    // Removing file from filesystem
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file: ", err);
      }
    });

    // Remove file path from database
    documentRecord[documentType] = undefined;
    await documentRecord.save();

    // Log the document deletion
    const serviceTypeStr =
      serviceType === "tiffin" ? "tiffin service" : "restaurant";

    historyLogRecorder(
      req,
      "RestaurantDocument",
      "DELETE",
      documentRecord._id,
      `Document ${documentType} deleted for ${serviceTypeStr} ID ${serviceId}`
    );

    res.status(200).json({
      success: true,
      message: `${documentType} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting document: ", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting document",
      error: error.message,
    });
  }
};

// Wrapper functions with specific naming for backward compatibility
const getRestaurantDocuments = (req, res) => {
  req.params.serviceType = "restaurant";
  return getServiceDocuments(req, res);
};

const getTiffinDocuments = (req, res) => {
  req.params.serviceType = "tiffin";
  return getServiceDocuments(req, res);
};

module.exports = {
  upload,
  uploadDocument,
  getRestaurantDocuments,
  getTiffinDocuments,
  getServiceDocuments,
  deleteDocument,
};
