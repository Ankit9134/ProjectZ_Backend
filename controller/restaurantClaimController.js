// const RestaurantClaimOwnerside = require('../models/RestaurantClaimOwnerside');
// const { v2: cloudinary } = require('cloudinary');

// // Cloudinary Config
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// exports.createClaim = async (req, res) => {
//   try {
//     const {
//       name,
//       address,
//       ownerName,
//       registrationNumber,
//       email,
//       phone,
//     } = req.body;

//     // Upload files to Cloudinary
//     const proofOfOwnership = req.files['proofOfOwnership']
//       ? await cloudinary.uploader.upload(req.files['proofOfOwnership'][0].path, { folder: 'restaurants/proofs' })
//       : null;
//     const foodServicesPermit = req.files['foodServicesPermit']
//       ? await cloudinary.uploader.upload(req.files['foodServicesPermit'][0].path, { folder: 'restaurants/permits' })
//       : null;
//     const additionalDocuments = req.files['additionalDocuments']
//       ? await cloudinary.uploader.upload(req.files['additionalDocuments'][0].path, { folder: 'restaurants/documents' })
//       : null;

//     // Create new restaurant claim
//     const restaurantClaim = new RestaurantClaimOwnerside({
//       name,
//       address,
//       ownerName,
//       registrationNumber,
//       email,
//       phone,
//       proofOfOwnership: proofOfOwnership?.secure_url || '',
//       foodServicesPermit: foodServicesPermit?.secure_url || '',
//       additionalDocuments: additionalDocuments?.secure_url || '',
//       status: 'pending',
//     });

//     await restaurantClaim.save();

//     res.status(201).json({
//       success: true,
//       message: 'Restaurant claim submitted successfully',
//       data: restaurantClaim,
//     });
//   } catch (error) {
//     console.error('Error creating restaurant claim:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error submitting restaurant claim',
//       error: error.message,
//     });
//   }
// };

// exports.getAllClaims = async (req, res) => {
//   try {
//     const claims = await RestaurantClaimOwnerside.find();
//     res.status(200).json({
//       success: true,
//       data: claims,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching restaurant claims',
//       error: error.message,
//     });
//   }
// };

// exports.getClaimById = async (req, res) => {
//   try {
//     const claim = await RestaurantClaimOwnerside.findById(req.params.id);
//     if (!claim) {
//       return res.status(404).json({
//         success: false,
//         message: 'Restaurant claim not found',
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: claim,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching restaurant claim',
//       error: error.message,
//     });
//   }
// };

// exports.updateClaim = async (req, res) => {
//   try {
//     const updateData = { ...req.body };

//     // Upload new files to Cloudinary if provided
//     if (req.files) {
//       if (req.files['proofOfOwnership']) {
//         const proofOfOwnership = await cloudinary.uploader.upload(
//           req.files['proofOfOwnership'][0].path,
//           { folder: 'restaurants/proofs' }
//         );
//         updateData.proofOfOwnership = proofOfOwnership.secure_url;
//       }
//       if (req.files['foodServicesPermit']) {
//         const foodServicesPermit = await cloudinary.uploader.upload(
//           req.files['foodServicesPermit'][0].path,
//           { folder: 'restaurants/permits' }
//         );
//         updateData.foodServicesPermit = foodServicesPermit.secure_url;
//       }
//       if (req.files['additionalDocuments']) {
//         const additionalDocuments = await cloudinary.uploader.upload(
//           req.files['additionalDocuments'][0].path,
//           { folder: 'restaurants/documents' }
//         );
//         updateData.additionalDocuments = additionalDocuments.secure_url;
//       }
//     }

//     const claim = await RestaurantClaimOwnerside.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     );

//     if (!claim) {
//       return res.status(404).json({
//         success: false,
//         message: 'Restaurant claim not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: claim,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating restaurant claim',
//       error: error.message,
//     });
//   }
// };

// exports.deleteClaim = async (req, res) => {
//   try {
//     const claim = await RestaurantClaimOwnerside.findByIdAndDelete(req.params.id);

//     if (!claim) {
//       return res.status(404).json({
//         success: false,
//         message: 'Restaurant claim not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Restaurant claim deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting restaurant claim',
//       error: error.message,
//     });
//   }
// };

const RestaurantClaimOwnerside = require("../models/RestaurantClaimOwnerside");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Restaurant = require("../models/claimRestaurant");
// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "restaurant-claims",
      resource_type: "auto",
    });
    fs.unlinkSync(file.path); // Remove local file after upload
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("File upload failed");
  }
};

exports.createClaim = async (req, res) => {
  try {
    const { name, address, ownerName, registrationNumber, email, phone } =
      req.body;

    const documentUrls = {};
    const fileFields = [
      "proofOfOwnership",
      "foodServicesPermit",
      "additionalDocuments",
    ];

    for (const field of fileFields) {
      if (req.files && req.files[field]) {
        documentUrls[field] = await uploadToCloudinary(req.files[field][0]);
      }
    }

    const restaurantClaim = new RestaurantClaimOwnerside({
      name,
      address,
      ownerName,
      registrationNumber,
      email,
      phone,
      ...documentUrls,
      status: "pending",
    });

    await restaurantClaim.save();

    historyLogRecorder(
      req,
      "RestaurantClaimOwnerside",
      "create",
      [restaurantClaim._id],
      "New restaurant claim created"
    );

    res.status(201).json({
      success: true,
      message: "Restaurant claim submitted successfully",
      data: restaurantClaim,
    });
  } catch (error) {
    console.error("Claim creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error submitting restaurant claim",
    });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const claims = await RestaurantClaimOwnerside.find();
    res.status(200).json({
      success: true,
      data: claims,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant claims",
      error: error.message,
    });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const claim = await RestaurantClaimOwnerside.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Restaurant claim not found",
      });
    }
    res.status(200).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant claim",
      error: error.message,
    });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Upload new files to Cloudinary if provided
    if (req.files) {
      if (req.files["proofOfOwnership"]) {
        const proofOfOwnership = await cloudinary.uploader.upload(
          req.files["proofOfOwnership"][0].path,
          { folder: "restaurants/proofs" }
        );
        updateData.proofOfOwnership = proofOfOwnership.secure_url;
      }
      if (req.files["foodServicesPermit"]) {
        const foodServicesPermit = await cloudinary.uploader.upload(
          req.files["foodServicesPermit"][0].path,
          { folder: "restaurants/permits" }
        );
        updateData.foodServicesPermit = foodServicesPermit.secure_url;
      }
      if (req.files["additionalDocuments"]) {
        const additionalDocuments = await cloudinary.uploader.upload(
          req.files["additionalDocuments"][0].path,
          { folder: "restaurants/documents" }
        );
        updateData.additionalDocuments = additionalDocuments.secure_url;
      }
    }

    const claim = await RestaurantClaimOwnerside.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Restaurant claim not found",
      });
    }

    res.status(200).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating restaurant claim",
      error: error.message,
    });
  }
};

exports.deleteClaim = async (req, res) => {
  try {
    const claim = await RestaurantClaimOwnerside.findByIdAndDelete(
      req.params.id
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Restaurant claim not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant claim deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting restaurant claim",
      error: error.message,
    });
  }
};

// Approve a claim
exports.approve = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant name is required" });
    }

    // Find the claim using restaurant name and update the status
    const updatedClaim = await RestaurantClaimOwnerside.findOneAndUpdate(
      { name }, // Finding by restaurant name
      { status: "approved" },
      { new: true }
    );

    if (!updatedClaim) {
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    }

    // Extract ownerName from the updated claim
    const { ownerName } = updatedClaim;

    // Update the restaurant status and ownerName
    await Restaurant.findOneAndUpdate(
      { name },
      { status: "claimed", ownerName }
    );

    res.status(200).json({
      success: true,
      message: "Claim approved successfully",
      claim: updatedClaim,
    });
  } catch (error) {
    console.error("Error approving claim:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Find a restaurant by registration number
// Find a restaurant by email

exports.getRestaurantByOwnerName = async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    if (!registrationNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Owner Name is required" });
    }

    const restaurant = await RestaurantClaimOwnerside.findOne({
      registrationNumber: String(registrationNumber),
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
