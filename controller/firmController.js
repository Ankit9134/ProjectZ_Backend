const Firm = require("../models/Firm");
const Tiffin = require("../models/Tiffin");
const User = require("../models/user");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const path = require("path");
const cron = require("node-cron"); // Import node-cron
const { query } = require("express");
// const Features = require("../models/Features");
const Reviews = require("../models/Reviews");
const { error } = require("console");
const mongoose = require("mongoose");
const historyLogRecorder = require("../models/historyLog");
const validateRestaurant = require("../middleware/validate");
const Notify=require("../models/logs/notify")
const RestaurantDocument = require("../models/FirmDocuments");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); //Folder where the images uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Generating a unique file name
  },
});
const upload = multer({ storage: storage });

// function to add a firm ????
// const addFirm = async (req, res) => {
//   //Just adding the required thinngs in the process , other data linke location , video can be stored later
//   try {
//     const { firmName, area, category, phone, city, offer } = req.body;
//     const image = req.file ? req.file.filename : undefined;

//     const vendor = await User.findById(req.vendorId);
//     if (!vendor) {
//       res.status(404).json({ message: "Vendor Not Found" });
//     }
//     if (vendor.firm.length > 0) {
//       res.status(400).json({ message: "One Vendor Can Have Only One Firm" });
//     }
//     const firm = new Firm({
//       firmName,
//       area,
//       category,
//       phone,
//       city,
//       offer,
//       image,
//       vendor: vendor._id,
//     });
//     const savedFirm = await firm.save();
//     const firmId = savedFirm._id;
//     vendor.firm.push(savedFirm);
//     await vendor.save();
//     return res.status(200).json({ message: "Firm Added Successfully", firmId });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// API handler
const getSimilarRestaurants = async (req, res) => {
  try {
    const { restaurantId, cursor } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Missing restaurantId",
      });
    }

    const { data, nextCursor } = await findSimilarRestaurants(
      restaurantId,
      cursor
    );

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No similar restaurants found with 80% or higher match",
      });
    }

    res.status(200).json({
      success: true,
      totalResults: data.length,
      data,
      nextCursor, // Send cursor for pagination
    });
  } catch (error) {
    console.error("Error finding similar restaurants:", error);
    res.status(500).json({
      success: false,
      message: "Server Error. Unable to fetch data.",
      error: error.message,
    });
  }
};

const excelBulkUpload = async (req, res, next) => {
  try {
    let restaurantInfo = req.body;

    // Validate and transform restaurant data
    const validatedData = restaurantInfo.map((obj) => {
      const { error, value } = validateRestaurant.validate(obj, {
        abortEarly: false,
      });

      if (error) {
        const errorMessages = error.details
          .map((err) => err.message)
          .join(", ");
        throw new Error(`Validation errors: ${errorMessages}`);
      }

      return {
        ...value,
        cuisines: value.cuisines.split(/,\s*/),
        dietary: value.dietary.split(/,\s*/),
        category: value.category.split(/,\s*/),
      };
    });

    // Simulate database operation
    const allFirm = await Firm.insertMany(validatedData);
    if (allFirm) {
      console.log("We got the firms", allFirm);
    }
    res.status(200).json({ message: "Data successfully saved", data: allFirm });
  } catch (err) {
    // Handle Joi errors within the same middleware
    if (err.isJoi || err.message.includes("Validation errors")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// function to search firm by firm name  +++
const searchFirmByName = async (req, res) => {
  try {
    const { firmName } = req.query;
    if (!firmName) {
      return res
        .status(400)
        .json({ message: "Please provide a firmName to search." });
    }
    const firms = await Firm.find({
      firmName: { $regex: firmName, $options: "i" },
    }).select("restaurantInfo.name address");
    // .populate("Reviews")
    // .populate({
    //   path: "menu.menuTabs.sections.items",
    //   model: "MenuItem",
    // });

    if (firms.length === 0) {
      return res
        .status(404)
        .json({ message: "No firms found matching the search criteria." });
    }

    res.status(200).json({ firms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// function to delete firm +++
const deleteFirmById = async (req, res) => {
  try {
    const firmId = req.params.firmId;
    const deletedFirm = await Firm.findByIdAndDelete(firmId);
    if (!deletedFirm) {
      return res.status(404).json({ error: "Firm Not Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// function to find veg resturants ---
const pureVegFirms = async (req, res) => {
  try {
    // console.log("I get hitted");
    const { cursor, limit = 10, itemLimit = 30 } = req.query;
    const parsedLimit = parseInt(limit, 10) || 10; // Ensure limit is a valid number

    let query = { category: { $size: 1, $all: ["veg"] } };
    // let itemLimit = 30;

    if (cursor) {
      query._id = { $gt: cursor }; // Convert cursor to ObjectId
    }

    const firms = await Firm.find(query)
      .limit(parsedLimit)
      // .populate({
      //   path: "menu.menuTabs.sections.items",
      //   model: "MenuItem",
      //   strictPopulate: false, // Prevent errors if some fields are null
      //   options: { limit: parseInt(itemLimit) }, // Limit menu items per section
      // })
      .sort({ _id: 1 });

    // console.log(firms);

    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//filter by rating +++
const filterFirmsByRating = async (req, res) => {
  try {
    const { rating, cursor, limit = 10 } = req.query;
    // const { rating, limit = 10 } = req.query;
    console.log(rating);
    if (!rating) {
      return res
        .status(400)
        .json({ message: "Please select a rating filter." });
    }

    const ratingThreshold = parseFloat(rating);
    if (isNaN(ratingThreshold) || ![3.5, 4.0, 4.5].includes(ratingThreshold)) {
      return res.status(400).json({
        message: "Invalid rating option. Please select 3.5, 4.0, or 4.5.",
      });
    }
    let query = { "ratings.overall": { $gte: ratingThreshold } };
    // if (cursor) query._id = { $gt: cursor };

    const firms = await Firm.find(query).limit(parseInt(limit));
    // .sort({ _id: 1 });
    if (!firms) {
      return res.status(404).json({ message: "No firms found." });
    }
    res.status(200).json({
      firms,
      // nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//filrer by offers count +++
const filterFirmsWithOffers = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    let query = { offer: { $exists: true, $ne: [] } };
    if (cursor) query._id = { $gt: cursor };
    const firms = await Firm.find(query)
      .limit(parseInt(limit))
      .populate("Offer")
      .sort({ _id: 1 });
    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//??????
const filterFirmsByCuisines = async (req, res) => {
  try {
    const { cuisines, cursor, limit = 10 } = req.query;
    if (!cuisines)
      return res
        .status(400)
        .json({ message: "Please select at least one cuisine to filter." });
    const cuisinesArray = Array.isArray(cuisines) ? cuisines : [cuisines];
    let query = { cuisines: { $in: cuisinesArray } };
    if (cursor) query._id = { $gt: cursor };
    const firms = await Firm.find(query)
      .limit(parseInt(limit))
      .sort({ _id: 1 });
    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//filter by dietary +++
const filterFirmByDietary = async (req, res) => {
  try {
    const { dietary, cursor, limit = 10 } = req.query;
    if (!dietary)
      return res
        .status(400)
        .json({ message: "Please select at least one dietary preference." });
    const dietaryArray = Array.isArray(dietary) ? dietary : [dietary];
    let query = { dietary: { $in: dietaryArray } };
    if (cursor) query._id = { $gt: cursor };
    const firms = await Firm.find(query)
      .limit(parseInt(limit))
      .sort({ _id: 1 });
    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//??? popularity on which basis
const sortFirmsByPopularity = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    let query = {};
    if (cursor) query._id = { $gt: cursor };
    const firms = await Firm.find(query)
      .limit(parseInt(limit))
      .sort({ popularity: -1 });
    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//apply many filters +++
const filterFirms = async (req, res) => {
  try {
    const {
      firmName,
      category,
      cuisines,
      dietary,
      minRating,
      sortByPopularity,
      offer,
      pureVeg,
      cursor,
      limit = 10,
    } = req.query;
    let filter = {};
    if (firmName) filter.firmName = { $regex: firmName, $options: "i" };
    if (category)
      filter.category = {
        $all: Array.isArray(category) ? category : [category],
      };
    if (cuisines)
      filter.cuisines = {
        $in: Array.isArray(cuisines) ? cuisines : [cuisines],
      };
    if (dietary)
      filter.dietary = { $in: Array.isArray(dietary) ? dietary : [dietary] };
    if (minRating) filter.ratings = { $gte: parseFloat(minRating) };
    if (offer === "true") filter.offer = { $exists: true, $ne: "" };
    if (pureVeg === "true") filter.category = { $all: ["veg"] };
    if (cursor) filter._id = { $gt: cursor };
    let sort = {};
    if (sortByPopularity === "true") sort.popularity = -1;
    const firms = await Firm.find(filter).limit(parseInt(limit)).sort(sort);
    res.status(200).json({
      firms,
      nextCursor: firms.length ? firms[firms.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// new implementations
// new firm controller
// ???
// const addRestaurant = async (req, res) => {
//   console.log(req.body);
//   try {
//     const {
//       restaurantInfo,
//       firmName,
//       // opening_hours,
//       // reviewSummary,
//       image_urls,
//       menu_url,
//       // menu_images,
//       // menu,

//       // reviews,
//       // faqs,
//       // source_url,
//       dietary,
//       feature,
//       popularity,
//     } = req.body;
//     console.log(restaurantInfo)
//     const user = req.session.user;
//     console.log(req.session,user)
//     const dbUser = await User.findById(user.id);
//     if (!dbUser) {
//       return res
//         .status(403)
//         .json({ response: false, message: "User not exist" });
//     }

//     const newRestaurant = new Firm({
//       restaurantInfo,
//       name:firmName,
//       // opening_hours,
//       // reviewSummary,
//       image_urls,
//       menu_url,
//       // menu_images,
//       // menu,
//       feature,
//       dietary,
//       popularity,
//       // reviews,
//       // faqs,
//       // source_url,
//     });
//     newRestaurant.vendor.push(dbUser._id);

//     await newRestaurant.save();

//     res.status(201).json({
//       message: "Restaurant added successfully",
//       restaurant: newRestaurant,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server Error" ,error:error});
//   }
// };

// Configure storage

//Commented by Murtuza
// const addRestaurant = async (req, res) => {
//   console.log("Received Body:", req.body); // Debugging
//   console.log("Received Files:", req.file || req.files);

//   try {
//     const firmName = req.body.firmName;
//     const restaurantInfo = req.body.restaurantInfo
//       ? JSON.parse(req.body.restaurantInfo)
//       : {};

//     if (!firmName) {
//       return res
//         .status(400)
//         .json({ response: false, message: "Firm name is required" });
//     }

//     const user = req.session.user;
//     const dbUser = await User.findById(user.id);
//     if (!dbUser) {
//       return res
//         .status(403)
//         .json({ response: false, message: "User not exist" });
//     }

//     const newRestaurant = new Firm({
//       restaurantInfo,
//       name: firmName,
//       image_urls: req.body.image_urls,
//       menu_url: req.body.menu_url,
//       feature: req.body.feature,
//       dietary: req.body.dietary,
//       popularity: req.body.popularity,
//     });

//     newRestaurant.vendor.push(dbUser._id);
//     await newRestaurant.save();

//     historyLogRecorder(
//       req, // The request object
//       newRestaurant.constructor.modelName, // Entity Type: "Firm" (dynamically retrieved)
//       "CREATE", // Action: Creating a new record
//       newRestaurant._id, // Entity ID: The ID of the newly created restaurant
//       `New restaurant '${newRestaurant.name}' added by user ${
//         dbUser.email || dbUser._id
//       }` // Description
//     );

//     res.status(201).json({
//       message: "Restaurant added successfully",
//       restaurant: newRestaurant,
//     });
//   } catch (error) {
//     console.error("Error Adding Restaurant:", error);
//     res.status(500).json({ error: "Server Error", details: error.message });
//   }
// };

//Created by Murtuza
// const addRestaurant = async (req, res) => {
//   console.log("We are inside addRestaurant");
//   console.log(req.body);

//   try {
//     const {
//       firmName,
//       ownerName,
//       ownerEmail,
//       ownerPhone,
//       primaryContactNumber,
//       location,
//       shopNo,
//       floorLevel,
//       area,
//       city,
//       landmark,
//       category,
//       services,
//       cuisines,
//     } = req.body;

//     if (!firmName) {
//       return res.status(400).json({
//         success: false,
//         message: "Restaurant name is required",
//       });
//     }

//     // Bypass authentication for now (we'll add it back later)
//     // Create a mock user ID for testing
//     const mockUserId = new mongoose.Types.ObjectId();

//     // Constructing the full address
//     const fullAddress = `${shopNo ? `Shop ${shopNo}, ` : ""}${
//       floorLevel ? `Floor ${floorLevel}, ` : ""
//     }${area ? `${area}, ` : ""}${city ? `${city}` : ""}${
//       landmark ? `, near ${landmark}` : ""
//     }`;

//     // Create new restaurant document using existing schema
//     const newRestaurant = new Firm({
//       restaurantInfo: {
//         name: firmName,
//         phoneNo: primaryContactNumber || ownerPhone,
//         address: fullAddress,
//         area: area,
//         city: city,
//         category:
//           category === "Both"
//             ? ["veg", "non-veg"]
//             : [category?.toLowerCase() || "veg"],
//         cuisines: Array.isArray(cuisines)
//           ? cuisines
//           : cuisines
//           ? cuisines.split(",").map((c) => c.trim())
//           : [],

//         // Explicitly structure the additionalInfo object
//         additionalInfo: {
//           ownerName: ownerName || "",
//           ownerEmail: ownerEmail || "",
//           ownerPhone: ownerPhone || "",
//           // If there are any other fields in additionalInfo, add them here
//           diningStyle: req.body.diningStyle || "",
//           dressCode: req.body.dressCode || "",
//           executiveCheif: req.body.executiveCheif || "",
//           hoursOfOperation: req.body.hoursOfOperation || "",
//           parking: req.body.parking || "",
//           publicTransit: req.body.publicTransit || "",
//           paymentOptions: req.body.paymentOptions || "",
//           additionalDetails: req.body.additionalDetails || "",
//         },
//       },

//       features: Array.isArray(services) ? services : services ? [services] : [],
//       popularity: 0,
//       source_url: "test_registration",

//       // Using local storage for dev environment
//       image_urls: req.body.image_urls || [],
//       menu_url: req.body.menu_url || "",
//       vendor: [mockUserId], // Use mock user ID
//     });

//     // Save to MongoDB database
//     const savedRestaurant = await newRestaurant.save();
//     console.log("Restaurant saved with ID:", savedRestaurant._id);

//     // For debugging: Verify we can retrieve what we saved
//     const retrievedRestaurant = await Firm.findById(savedRestaurant._id);
//     console.log(
//       "Retrieved restaurant additionalInfo:",
//       retrievedRestaurant?.restaurantInfo?.additionalInfo || "Not found"
//     );

//     // Skip history logging for simplicity during testing

//     res.status(201).json({
//       success: true,
//       message: "Restaurant information saved successfully",
//       restaurant: {
//         id: savedRestaurant._id,
//         name: savedRestaurant.restaurantInfo.name,
//       },
//       nextStep: "/restaurant/documents", // URL for next registration step
//     });
//   } catch (error) {
//     console.error("Error adding restaurant: ", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       details: error.message,
//     });
//   }
// };

const addRestaurant = async (req, res) => {
  console.log("We are inside addRestaurant");
  console.log(req.body);

  try {
    const {
      firmName,
      ownerName,
      ownerEmail,
      ownerPhone,
      primaryContactNumber,
      location,
      shopNo,
      floorLevel,
      area,
      city,
      landmark,
      category,
      services,
      cuisines,
    } = req.body;

    if (!firmName) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name is required",
      });
    }

    // TODO: Replace mock user ID with actual authenticated user
    // For now, using a mock user ID for testing
    const mockUserId = new mongoose.Types.ObjectId();

    // Constructing the full address
    const fullAddress = `${shopNo ? `Shop ${shopNo}, ` : ""}${
      floorLevel ? `Floor ${floorLevel}, ` : ""
    }${area ? `${area}, ` : ""}${city ? `${city}` : ""}${
      landmark ? `, near ${landmark}` : ""
    }`;

    // Create new restaurant document using existing schema
    const newRestaurant = new Firm({
      // Add top-level owner information
      ownerName,
      ownerEmail,
      ownerPhone,
      newlyAdded: true,

      restaurantInfo: {
        name: firmName,
        phoneNo: primaryContactNumber || ownerPhone,
        address: fullAddress,
        area: area,
        city: city,

        category:
          category === "Both"
            ? ["veg", "non-veg"]
            : [category?.toLowerCase() || "veg"],
        cuisines: Array.isArray(cuisines)
          ? cuisines
          : cuisines
          ? cuisines.split(",").map((c) => c.trim())
          : [],

        // Explicitly structure the additionalInfo object
        additionalInfo: {
          diningStyle: req.body.diningStyle || "",
          dressCode: req.body.dressCode || "",
          executiveCheif: req.body.executiveCheif || "",
          hoursOfOperation: req.body.hoursOfOperation || "",
          parking: req.body.parking || "",
          publicTransit: req.body.publicTransit || "",
          paymentOptions: req.body.paymentOptions || "",
          additionalDetails: req.body.additionalDetails || "",

          // Optional: keep these for additional storage if needed
          ownerName: ownerName || "",
          ownerEmail: ownerEmail || "",
          ownerPhone: ownerPhone || "",
        },
      },

      features: Array.isArray(services) ? services : services ? [services] : [],
      popularity: 0,
      source_url: "test_registration",

      // Using local storage for dev environment
      image_urls: req.body.image_urls || [],
      menu_url: req.body.menu_url || "",
      vendor: [mockUserId], // Use mock user ID
    });

    // Save to MongoDB database
    const savedRestaurant = await newRestaurant.save();
    console.log("Restaurant saved with ID:", savedRestaurant._id);

    // Record history log
    historyLogRecorder(
      req, // The request object
      savedRestaurant.constructor.modelName, // Entity Type: "Firm"
      "CREATE", // Action: Creating a new record
      savedRestaurant._id, // Entity ID
      `New restaurant '${savedRestaurant.restaurantInfo.name}' added with ID ${savedRestaurant._id}` // Description
    );

      const newNotify=new Notify({
          timestamp:new Date(),
          level:"New Restaurant is Registered check it once",
          type:['admin'],
          message:"A notification that new Restaurant is registered check it ",
          metadata:{
            category:["Restaurant"],
            isViewed:false,
            isAccept:false,
            isReject:false,
          }
        })
        await newNotify.save();

    res.status(201).json({
      success: true,
      message: "Restaurant information saved successfully",
      restaurant: {
        id: savedRestaurant._id,
        name: savedRestaurant.restaurantInfo.name,
      },
      nextStep: "/restaurant/documents", // URL for next registration step
    });
  } catch (error) {
    console.error("Error adding restaurant: ", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

const updateRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId, status } = req.body;

    // Validate input - Added "Rejected" and "Later" to valid statuses
    const validStatuses = [
      "Pending",
      "Claimed",
      "Unclaimed",
      "Revoked",
      "Approved",
      "Rejected",
      "Later",
    ];
    if (!restaurantId || !status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID or status",
      });
    }

    // Find and update the restaurant
    const updatedRestaurant = await Firm.findByIdAndUpdate(
      restaurantId,
      { restaurantStatus: status },
      { new: true } // Return the updated document
    );

    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant status updated successfully",
      restaurant: {
        id: updatedRestaurant._id,
        status: updatedRestaurant.restaurantStatus,
      },
    });
  } catch (error) {
    console.error("Error updating restaurant status: ", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

const updateTiffinStatus = async (req, res) => {
  try {
    const { tiffinId, status } = req.body;

    // Validate input with the same valid statuses plus "Active"
    const validStatuses = [
      "Pending",
      "Claimed",
      "Unclaimed",
      "Revoked",
      "Approved",
      "Rejected",
      "Later",
      "Active",
    ];
    if (!tiffinId || !status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tiffin ID or status",
      });
    }

    // Find and update the tiffin
    const updatedTiffin = await Tiffin.findByIdAndUpdate(
      tiffinId,
      { status: status }, // Use the status field we added to the Tiffin model
      { new: true } // Return the updated document
    );

    if (!updatedTiffin) {
      return res.status(404).json({
        success: false,
        message: "Tiffin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tiffin status updated successfully",
      tiffin: {
        id: updatedTiffin._id,
        status: updatedTiffin.status,
      },
    });
  } catch (error) {
    console.error("Error updating tiffin status: ", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

//Testing testAddRestaurant, Created by Murtuza
const testAddRestaurant = async (req, res) => {
  try {
    console.log("Test restaurant data:", req.body);

    // Create a basic restaurant with minimal required fields
    const newRestaurant = new Firm({
      restaurantInfo: {
        name: req.body.firmName || "Test Restaurant",
        category: ["veg"],
      },
      // Use a fake vendor ID
      vendor: [new mongoose.Types.ObjectId()],
    });

    // Save to database
    const savedRestaurant = await newRestaurant.save();
    console.log("Restaurant saved:", savedRestaurant._id);

    // Verify it was saved
    const verifiedRestaurant = await Firm.findById(savedRestaurant._id);

    res.status(201).json({
      success: true,
      message: "Test restaurant created successfully",
      restaurant: {
        id: savedRestaurant._id,
        name: savedRestaurant.restaurantInfo.name,
      },
    });
  } catch (error) {
    console.error("Test restaurant creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      details: error.message,
    });
  }
};

// Apply Multer middleware in the route

// get firm by id +++
const getFirmById = async (req, res) => {
  try {
    const { id } = req.params;
    const firm = await Firm.findById(id)
      // .select("-menu -reviews -offer")
      .sort({ updatedAt: -1 }); // Sort in descending
    if (!firm) {
      return res.status(404).json({ error: "Firm Not Found" });
    }
    // console.log(firm);
    historyLogRecorder(
      req, // Request object
      firm.constructor.modelName, // Entity: "Firm"
      "READ", // Action: READ
      [firm._id], // Entity ID (as an array)
      `Retrieved details for Firm ID ${firm._id}` // Description
    );
    return res.status(200).json(firm);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
// get all restaurants +++
const getAllRestaurants = async (req, res) => {
  try {
    console.log(req.session.user);
    const { lastId } = req.query;
    const limit = 20;

    let query = {};
    if (lastId) {
      query = { _id: { $gt: lastId } };
    }
    const restaurants = await Firm.find(query).limit(limit).select("-menu");
    historyLogRecorder(
      req, // Request object
      "Firm", // Entity: "Firm" (since we query Firm model directly)
      "READ", // Action: READ
      restaurants.map((r) => r._id), // Entity IDs: Array of retrieved firm IDs
      `Retrieved list of restaurants (limit: ${limit}, starting after: ${
        lastId || "start"
      })` // Description
    );

    return res.status(200).json({
      restaurants,
      lastId:
        restaurants.length > 0 ? restaurants[restaurants.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//getting newly added Tiffins
const getTiffins = async (req, res) => {
  try {
    console.log(req.session.user);
    const { lastId } = req.query;
    const limit = 20;

    let query = { newlyAdded: true };
    if (lastId) {
      query = { _id: { $gt: lastId } };
    }
    const tiffins = await Tiffin.find(query).limit(limit).select("-menu");
    historyLogRecorder(
      req, // Request object
      "Tiffin", // Entity: "Tiffin" (since we query Tiffin model directly)
      "READ", // Action: READ
      tiffins.map((r) => r._id), // Entity IDs: Array of retrieved firm IDs
      `Retrieved list of tiffins (limit: ${limit}, starting after: ${
        lastId || "start"
      })` // Description
    );

    return res.status(200).json({
      tiffins,
      lastId: tiffins.length > 0 ? tiffins[tiffins.length - 1]._id : null,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

//getting newly added restaurants
const getNewRestaurants = async (req, res) => {
  try {
    console.log(req.session.user);
    const { lastId } = req.query;
    const limit = 20;

    let query = { newlyCreated: true };
    if (lastId) {
      query = { _id: { $gt: lastId } };
    }
    const restaurants = await Firm.find({ newlyAdded: true })
      .limit(limit)
      .select("-menu");
    historyLogRecorder(
      req, // Request object
      "Firm", // Entity: "Firm" (since we query Firm model directly)
      "READ", // Action: READ
      restaurants.map((r) => r._id), // Entity IDs: Array of retrieved firm IDs
      `Retrieved list of restaurants (limit: ${limit}, starting after: ${
        lastId || "start"
      })` // Description
    );

    return res.status(200).json({
      restaurants,
      lastId:
        restaurants.length > 0 ? restaurants[restaurants.length - 1]._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).populate({
      path: "menu.menuTabs.sections.items",
      model: "MenuItem",
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    historyLogRecorder(
      req, // Request object
      restaurant.constructor.modelName, // Entity: "Firm"
      "READ", // Action: READ
      [restaurant._id], // Entity ID (as an array)
      `Retrieved full menu for Restaurant ID ${restaurantId}` // Description
    );
    return res.status(200).json({
      menuTabs: restaurant.menu.menuTabs,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getMenuTabs = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "menu.menuTabs.name"
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const menuTabs = restaurant.menu?.menuTabs.map((tab) => tab.name) || [];
    historyLogRecorder(
      req, // Request object
      restaurant.constructor.modelName, // Entity: "Firm"
      "READ", // Action: READ
      [restaurant._id], // Entity ID (as an array)
      `Retrieved menu tab names for Restaurant ID ${restaurantId}` // Description
    );
    return res.status(200).json({ menuTabs });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getMenuSections = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Firm.findById(restaurantId).select(
      "menu.menuTabs.sections.name"
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const sections =
      restaurant.menu?.menuTabs.flatMap((tab) =>
        tab.sections.map((section) => section.name)
      ) || [];

    return res.status(200).json({ sections });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
// const getMenuSectionsWithItems = async (req, res) => {
//   try {
//     const { restaurantId } = req.params;
//     const restaurant = await Firm.findById(restaurantId)
//       .select("menu.menuTabs.sections.name menu.menuTabs.sections.items")
//       // .populate("menu.menuTabs.sections.items");
//       .populate({
//         path: "menu.menuTabs.sections.items",
//         select: "_id name price description variations", // Include _id explicitly
//       });

//     if (!restaurant) {
//       return res.status(404).json({ message: "Restaurant not found" });
//     }
//     const menuData =
//       restaurant.menu?.menuTabs.flatMap((tab) =>
//         tab.sections.map((section) => ({
//           sectionName: section.name,
//           items: section.items.map((item) => ({
//             name: item.name,
//             price: item.price,
//             description: item.description,
//             variations: item.variations,
//             id: item._id,
//           })),
//         }))
//       ) || [];

//     return res.status(200).json({ menuSections: menuData });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
const getMenuSectionsWithItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Firm.findById(restaurantId)
      .select("menu.menuTabs.sections.name menu.menuTabs.sections.items")
      .populate({
        path: "menu.menuTabs.sections.items",
        select: "_id name price description variations",
      });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuData =
      restaurant.menu?.menuTabs?.flatMap((tab) =>
        (tab.sections || []).map((section) => ({
          sectionName: section.name || "Unnamed Section",
          items: (section.items || []).map((item) => ({
            id: item._id || null,
            name: item.name || "Unnamed Item",
            price: item.price || "N/A",
            description: item.description || "",
            variations: item.variations || [],
          })),
        }))
      ) || [];

    console.log("Transformed Menu Data:", JSON.stringify(menuData, null, 2));

    return res.status(200).json({ menuSections: menuData });
  } catch (error) {
    console.error("Error fetching menu sections:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//+++
const getMenuImages = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select("menu_images");
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json({ menuImages: restaurant.menu_images });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getPhoneNumber = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.phoneNo"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json({ phone: restaurant.restaurantInfo.phoneNo });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getAddress = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.address"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json({ address: restaurant.restaurantInfo.address });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getInstagram = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.instagram"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res
      .status(200)
      .json({ instagram: restaurant.restaurantInfo.instagram });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getAdditionalInfo = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.additionalInfo"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      restaurantId,
      "Fetched additional info of the restaurant"
    );
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      restaurantId,
      "Fetched additional info of the restaurant"
    );
    return res
      .status(200)
      .json({ additionalInfo: restaurant.restaurantInfo.additionalInfo });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getRestaurantOverview = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.overview"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      restaurantId,
      "Fetched overview of the restaurant"
    );
    return res
      .status(200)
      .json({ overview: restaurant.restaurantInfo.overview });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getRestaurantRatings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Firm.findById(restaurantId).select(
      "restaurantInfo.ratings"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      restaurantId,
      "Fetched ratings of the restaurant"
    );
    return res.status(200).json({ ratings: restaurant.restaurantInfo.ratings });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getRestaurantsByRatings = async (req, res) => {
  try {
    const { food, service, ambience, lastId } = req.query;
    const limit = 50;
    let query = {};
    if (food || service || ambience) {
      query["restaurantInfo.ratings"] = {};
      if (food) {
        query["restaurantInfo.ratings.food"] = { $gte: Number(food) };
      }
      if (service) {
        query["restaurantInfo.ratings.service"] = { $gte: Number(service) };
      }
      if (ambience) {
        query["restaurantInfo.ratings.ambience"] = { $gte: Number(ambience) };
      }
    }
    if (lastId) {
      query._id = { $gt: lastId };
    }
    const restaurants = await Firm.find(query).limit(limit);
    return res.status(200).json({
      restaurants,
      lastId:
        restaurants.length > 0 ? restaurants[restaurants.length - 1]._id : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
};
//+++
const getRestaurantFAQs = async (req, res) => {
  try {
    const { firmId } = req.params;
    //to select faqs from the firm
    const firm = await Firm.findById(firmId, "faqs");
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      firm._id,
      "Fetched Faqs from the restaurant"
    );
    res.status(200).json({ faqs: firm.faqs });
  } catch (error) {
    console.error("Error in getFirmFAQs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++

const getRestaurantImages = async (req, res) => {
  try {
    const { firmId } = req.params;
    const firm = await Firm.findById(firmId, "image_url");
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }

    res.status(200).json({ image_urls: firm?.image_urls || [] });
  } catch (error) {
    console.error("Error in getFirmImages:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//+++
const getRestaurantOpeningHours = async (req, res) => {
  try {
    const { firmId } = req.params;
    const firm = await Firm.findById(firmId, "opening_hours");
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }
    historyLogRecorder(
      req,
      "Firm",
      "READ",
      firm._id,
      "Fetched the opening hours of the restaurant"
    );
    res.status(200).json({ opening_hours: firm.opening_hours });
  } catch (error) {
    console.error("Error in getFirmOpeningHours:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const { documentType, restaurantId } = req.body;
    const file = req.file;

    if (!file || !documentType || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for restaurant document upload",
      });
    }

    // Check if restaurant exists
    const restaurant = await Firm.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Find or create document record
    let documentRecord = await RestaurantDocument.findOne({
      restaurantId: restaurantId,
    });

    if (!documentRecord) {
      documentRecord = new RestaurantDocument({
        restaurantId: restaurantId,
      });
    }

    // Update the specific document field
    documentRecord[documentType] = file.path;
    await documentRecord.save();

    // Log the document upload
    historyLogRecorder(
      req,
      "RestaurantDocument",
      "UPDATE",
      documentRecord._id,
      `Document ${documentType} uploaded for restaurant ${restaurantId}`
    );

    res.status(200).json({
      success: true,
      message: `${documentType} uploaded successfully`,
      filePath: file.path,
    });
  } catch (error) {
    console.error("Error uploading restaurant document: ", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading document",
      error: error.message,
    });
  }
};

module.exports = {
  // addFirm: [upload.single("image"), addFirm],
  deleteFirmById,
  searchFirmByName,
  pureVegFirms,
  getSimilarRestaurants,
  filterFirmsByRating,
  filterFirmsWithOffers,
  filterFirmsByCuisines,
  filterFirmByDietary,
  sortFirmsByPopularity,
  filterFirms,
  // new functions according to data scraped
  addRestaurant,
  updateRestaurantStatus,
  updateTiffinStatus,
  getFirmById, //get it
  getAllRestaurants, //get it
  getNewRestaurants, //for getting newly added restaurants
  getTiffins, //to get all added tiffins
  getRestaurantMenu, //get
  getMenuTabs,
  getMenuSections,
  getMenuSectionsWithItems,
  getMenuImages,
  getPhoneNumber,
  getAddress,
  getInstagram,
  getAdditionalInfo,
  getRestaurantOverview,
  getRestaurantRatings,
  getRestaurantsByRatings,
  getRestaurantFAQs,
  getRestaurantImages,
  getRestaurantOpeningHours,
  excelBulkUpload,
  uploadDocument,

  //new function to check testAddRestaurant
  testAddRestaurant,
};
