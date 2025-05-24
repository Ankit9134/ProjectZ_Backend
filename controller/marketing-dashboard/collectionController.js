// Import statements moved to the bottom of the file

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find();
    res.json(collections);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const { title, description, isDefault, status } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    const collection = new Collection({
      title,
      description,
      isDefault: isDefault || false,
      status: status || 'Active',
    });

    // Handle image upload if provided
    if (req.files && req.files.length > 0) {
      const photo = req.files[0]; // Get the uploaded file
      if (photo) {
        const cloudinaryRes = await uploadOnCloudinary(photo.path);
        if (cloudinaryRes) {
          collection.photoWeb = cloudinaryRes.url; // Save cloudinary URL to collection
          collection.photoApp = cloudinaryRes.url; // Use same URL for both web and app
        }
      }
    }

    await collection.save();

    res.status(201).json({ message: 'Collection created successfully', collection });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(400).send(err.message);
  }
};

// // update a collection
// exports.updateCollection = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { startDate, endDate, ...bodyFields } = req.body;

//     // find the collection document
//     const collection = await Collection.findById(id);
//     if (!collection) return res.status(404).send("Collection not found");

//     // update only the fields that are present in the request body
//     const fieldsToUpdate = {};
//     Object.keys(bodyFields).forEach(key => {
//       if (bodyFields[key] !== undefined) { // Check if the field is provided
//         fieldsToUpdate[key] = bodyFields[key];
//       }
//     });
//     Object.assign(collection, fieldsToUpdate);

//     // update status based on the provided dates.
//     let newStartDate = collection.startDate;
//     let newEndDate = collection.endDate;

//     if (startDate !== undefined || endDate !== undefined) {
//       // Merge provided dates with existing ones
//       newStartDate = startDate !== undefined ? new Date(startDate) : new Date(collection.startDate);
//       newEndDate = endDate !== undefined ? new Date(endDate) : new Date(collection.endDate);

//       // Update collection dates if provided
//       if (startDate !== undefined) collection.startDate = startDate;
//       if (endDate !== undefined) collection.endDate = endDate;

//       // Determine the new status
//       const now = new Date();
//       if (now < newStartDate) {
//         collection.status = "Upcoming";
//       } else if (now > newEndDate) {
//         collection.status = "Inactive";
//       } else {
//         collection.status = "Active";
//       }
//     }

//     // default collection will always be active and have no dates
//     if (collection.isDefault) {
//       collection.status = "Active";
//       collection.startDate = undefined;
//       collection.endDate = undefined
//     }

//     // Handle image uploads if provided
//         if (req.files && req.files.length > 0) {

//           const photoWeb = req.files.find(file => file.fieldname === "photoWeb")
//           if (photoWeb) {
//             const cloudinaryRes = await uploadOnCloudinary(photoWeb.path)
//             if (cloudinaryRes) {
//               collection.photoWeb = cloudinaryRes.url  // save cloudinary url response in collection
//             }
//           }

//           const photoApp = req.files.find(file => file.fieldname === "photoApp")
//           if (photoApp) {
//             const cloudinaryRes = await uploadOnCloudinary(photoApp.path)
//             if (cloudinaryRes) {
//               collection.photoApp = cloudinaryRes.url
//             }
//           }
//         }

//     await collection.save();
//     res.json({ message: "Collection updated successfully", collection });
//   } catch (err) {
//     console.log("error while updating collection: ", err.message)
//     res.status(400).json(err.message);
//   }
// };

// // to delete
// exports.deleteCollection = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const collection = await Collection.findById(id);
//     if (!collection) return res.status(404).json({ message: "Collection not found" });

//     // Check for last default Collection
//     if (collection.isDefault) {
//       const defaultCount = await Collection.countDocuments({ isDefault: true });
//       if (defaultCount <= 1) {
//         return res.status(403).json({
//           message: "At least one default Collection must remain"
//         });
//       }
//     }

//     // Cloudinary deletion helper
//     const deleteCloudinaryAsset = async (url) => {
//       if (!url) return;
//       const publicId = url.split('/upload/')[1]?.split('.')[0];
//       if (publicId) {
//         await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
//       }
//     };

//     // Parallel deletion
//     await Promise.all([
//       deleteCloudinaryAsset(Collection.photoWeb),
//       deleteCloudinaryAsset(Collection.photoApp)
//     ]);

//     await Collection.findByIdAndDelete(id);
//     return res.status(200).json({ message: "Collection deleted successfully" });

//   } catch (err) {
//     console.error("Delete error:", err);
//     return res.status(500).json({
//       message: "Deletion failed. Please try again later"
//     });
//   }
// };

// // return active collections
// exports.getActiveCollections = async (req, res) => {
//   try {
//     const activeCollections = await Collection.find({ status: 'Active' });
//     res.status(200).json(activeCollections);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching active collections', message: err.message });
//   }
// };

// // POST: add a new click entry with the current date
// exports.clickCounts = async (req, res) => {
//   try {
//     const { _id } = req.params;

//     // Add a new click entry with the current date
//     const updatedCollection = await Collection.findByIdAndUpdate(
//       _id,
//       { $push: { clicks: { date: new Date() } } }, // Push a new click object
//       { new: true }
//     );

//     res.status(200).json({
//       Collection: updatedCollection.title,
//       totalClicks: updatedCollection.clicks.length, // Total clicks = length of the array
//     });
//   } catch (err) {
//     res.status(500).json({
//       msg: "Error updating collection click count: ",
//       error: err.message,
//     });
//   }
// };

// // filter clicks by Today, This Week, or This Month, use MongoDB aggregation

// // GET: get filtered clicks
// exports.getClicksByTimeframe = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { timeframe } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ msg: "Invalid collection ID" });
//     }

//     const now = new Date();
//     const utcNow = new Date(now.toISOString().slice(0, -1)); // Workaround for UTC parsing
//     let startDate;

//     switch (timeframe) {
//       case "today":
//         startDate = new Date(utcNow);
//         startDate.setUTCHours(0, 0, 0, 0);
//         break;
//       case "week":
//         // Start on Monday
//         const day = utcNow.getUTCDay();
//         const diff = day === 0 ? 6 : day - 1;
//         startDate = new Date(utcNow);
//         startDate.setUTCDate(utcNow.getUTCDate() - diff);
//         startDate.setUTCHours(0, 0, 0, 0);
//         break;
//       case "month":
//         startDate = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1));
//         break;
//       default:
//         return res.status(400).json({ msg: "Invalid timeframe" });
//     }

//     const collection = await Collection.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(id) } },
//       {
//         $project: {
//           totalClicks: { $size: "$clicks" },
//           filteredClicks: {
//             $size: {
//               $filter: {
//                 input: "$clicks",
//                 as: "click",
//                 cond: { $gte: ["$$click.date", startDate] },
//               },
//             },
//           },
//         },
//       },
//     ]);

//     if (!collection.length) {
//       return res.status(404).json({ msg: "Collection not found" });
//     }

//     res.status(200).json({
//       totalClicks: collection[0].totalClicks,
//       timeframeClicks: collection[0].filteredClicks,
//     });
//   } catch (err) {
//     res.status(500).json({ msg: "Error fetching clicks", error: err.message });
//   }
// };

const { uploadOnCloudinary } = require("../../utils/cloudinary"); // Adjust path
const Collection = require("../../models/marketing-dashboard/Collection"); // Adjust path
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const historyLogRecorder = require("../../utils/historyLogRecorder"); // Adjust path
const Notify=require("../../models/logs/notify");
// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find();
    historyLogRecorder(
      req,
      "Collection",
      "READ",
      collections.map((c) => c._id),
      `Retrieved all collections (${collections.length} found)`
    );
    res.json(collections);
  } catch (err) {
    historyLogRecorder(
      req,
      "Collection",
      "READ",
      [],
      `Error retrieving all collections: ${err.message}`
    );
    res.status(500).send(err.message);
  }
};

// Create a new collection
exports.createCollection = async (req, res) => {
  let savedCollectionId = null;
  try {
    const { title, isDefault, status } = req.body;
    const collection = new Collection({
      title,
      isDefault: isDefault || false,
      status: status || "Inactive",
    });

    await collection.save();
    savedCollectionId = collection._id;

    historyLogRecorder(
      req,
      collection.constructor.modelName,
      "CREATE",
      [collection._id],
      `Created new collection '${collection.title}' with ID ${collection._id}`
    );
      const newNotify=new Notify({
            timestamp:new Date(),
            level:"A New Collection",
            type:['admin','restaurant'],
            message:"A New Collection is created in a marketing dashboard",
            metadata:{
              category:["Marketing"],
              isViewed:false,
              isAccept:false,
              isReject:false,
            }
    })
    await newNotify.save();
    res
      .status(201)
      .json({ message: "Collection created successfully", collection });
  } catch (err) {
    historyLogRecorder(
      req,
      "Collection",
      "CREATE",
      savedCollectionId ? [savedCollectionId] : [],
      `Error creating collection: ${err.message}`
    );
    res.status(400).send(err.message);
  }
};

// update a collection
exports.updateCollection = async (req, res) => {
  const { id } = req.params;
  let collectionTitle = "Unknown";
  try {
    const { startDate, endDate, ...bodyFields } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      historyLogRecorder(
        req,
        "Collection",
        "UPDATE",
        [id],
        `Attempted to update non-existent collection ID ${id}`
      );
      return res.status(404).send("Collection not found");
    }
    collectionTitle = collection.title;

    const fieldsToUpdate = {};
    Object.keys(bodyFields).forEach((key) => {
      if (bodyFields[key] !== undefined) {
        fieldsToUpdate[key] = bodyFields[key];
      }
    });
    Object.assign(collection, fieldsToUpdate);

    let newStartDate = collection.startDate;
    let newEndDate = collection.endDate;

    if (startDate !== undefined || endDate !== undefined) {
      newStartDate =
        startDate !== undefined
          ? new Date(startDate)
          : collection.startDate
          ? new Date(collection.startDate)
          : null;
      newEndDate =
        endDate !== undefined
          ? new Date(endDate)
          : collection.endDate
          ? new Date(collection.endDate)
          : null;

      if (startDate !== undefined) collection.startDate = newStartDate;
      if (endDate !== undefined) collection.endDate = newEndDate;

      const now = new Date();
      if (newStartDate && now < newStartDate) {
        collection.status = "Upcoming";
      } else if (newEndDate && now > newEndDate) {
        collection.status = "Inactive";
      } else if (newStartDate && newEndDate) {
        collection.status = "Active";
      } else if (newStartDate && !newEndDate) {
        collection.status = "Active";
      } else {
        collection.status = "Inactive";
      }
    }

    if (collection.isDefault) {
      collection.status = "Active";
      collection.startDate = undefined;
      collection.endDate = undefined;
    }

    if (req.files && req.files.length > 0) {
      const photoWeb = req.files.find((file) => file.fieldname === "photoWeb");
      if (photoWeb) {
        const cloudinaryRes = await uploadOnCloudinary(photoWeb.path);
        if (cloudinaryRes) {
          collection.photoWeb = cloudinaryRes.url;
        }
      }

      const photoApp = req.files.find((file) => file.fieldname === "photoApp");
      if (photoApp) {
        const cloudinaryRes = await uploadOnCloudinary(photoApp.path);
        if (cloudinaryRes) {
          collection.photoApp = cloudinaryRes.url;
        }
      }
    }

    await collection.save();

    historyLogRecorder(
      req,
      collection.constructor.modelName,
      "UPDATE",
      [collection._id],
      `Updated collection '${collection.title}' (ID: ${collection._id})`
    );

      const newNotify=new Notify({
            timestamp:new Date(),
            level:"A Collection is Updated",
            type:['admin','restaurant'],
            message:"A Collection details is updated check it once",
            metadata:{
              category:["Marketing"],
              isViewed:false,
              isAccept:false,
              isReject:false,
            }
    })
    await newNotify.save();
    res.json({ message: "Collection updated successfully", collection });
  } catch (err) {
    console.log("error while updating collection: ", err.message);
    historyLogRecorder(
      req,
      "Collection",
      "UPDATE",
      [id],
      `Error updating collection '${collectionTitle}' (ID: ${id}): ${err.message}`
    );
    res.status(400).json({ message: err.message });
  }
};

// to delete
exports.deleteCollection = async (req, res) => {
  const { id } = req.params;
  let collectionTitle = "Unknown";
  try {
    const collection = await Collection.findById(id);
    if (!collection) {
      historyLogRecorder(
        req,
        "Collection",
        "DELETE",
        [id],
        `Attempted to delete non-existent collection ID ${id}`
      );
      return res.status(404).json({ message: "Collection not found" });
    }
    collectionTitle = collection.title;

    if (collection.isDefault) {
      const defaultCount = await Collection.countDocuments({ isDefault: true });
      if (defaultCount <= 1) {
        historyLogRecorder(
          req,
          "Collection",
          "DELETE",
          [id],
          `Attempted to delete the last default collection '${collectionTitle}' (ID: ${id}). Forbidden.`
        );
        return res.status(403).json({
          message: "At least one default Collection must remain",
        });
      }
    }

    const deleteCloudinaryAsset = async (url) => {
      if (!url) return;
      const parts = url.split("/");
      const publicIdWithExt = parts
        .slice(parts.indexOf("upload") + 2)
        .join("/");
      const publicId =
        publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")) ||
        publicIdWithExt;
      if (publicId) {
        console.log(`Attempting to delete Cloudinary asset: ${publicId}`);
        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
          console.log(`Deleted Cloudinary asset: ${publicId}`);
        } catch (cloudinaryError) {
          console.error(
            `Cloudinary deletion failed for public ID ${publicId}:`,
            cloudinaryError
          );
        }
      }
    };

    // Corrected: Use the instance's properties
    await Promise.all([
      deleteCloudinaryAsset(collection.photoWeb),
      deleteCloudinaryAsset(collection.photoApp),
    ]);

    await Collection.findByIdAndDelete(id);

    historyLogRecorder(
      req,
      "Collection",
      "DELETE",
      [id],
      `Deleted collection '${collectionTitle}' (ID: ${id})`
    );

    return res.status(200).json({ message: "Collection deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    historyLogRecorder(
      req,
      "Collection",
      "DELETE",
      [id],
      `Error deleting collection '${collectionTitle}' (ID: ${id}): ${err.message}`
    );
    return res.status(500).json({
      message: "Deletion failed. Please try again later",
      error: err.message,
    });
  }
};

// return active collections
exports.getActiveCollections = async (req, res) => {
  try {
    const activeCollections = await Collection.find({ status: "Active" });
    historyLogRecorder(
      req,
      "Collection",
      "READ",
      activeCollections.map((c) => c._id),
      `Retrieved active collections (${activeCollections.length} found)`
    );
    res.status(200).json(activeCollections);
  } catch (err) {
    historyLogRecorder(
      req,
      "Collection",
      "READ",
      [],
      `Error retrieving active collections: ${err.message}`
    );
    res.status(500).json({
      error: "Error fetching active collections",
      message: err.message,
    });
  }
};

// POST: add a new click entry with the current date
exports.clickCounts = async (req, res) => {
  const { _id } = req.params;
  try {
    const updatedCollection = await Collection.findByIdAndUpdate(
      _id,
      { $push: { clicks: { date: new Date() } } },
      { new: true }
    );

    if (!updatedCollection) {
      historyLogRecorder(
        req,
        "Collection",
        "UPDATE",
        [_id],
        `Attempted to record click for non-existent collection ID ${_id}`
      );
      return res
        .status(404)
        .json({ msg: "Collection not found to record click." });
    }

    historyLogRecorder(
      req,
      updatedCollection.constructor.modelName,
      "UPDATE",
      [updatedCollection._id],
      `Recorded a click for collection '${updatedCollection.title}' (ID: ${updatedCollection._id}). New total clicks: ${updatedCollection.clicks.length}`
    );

    res.status(200).json({
      Collection: updatedCollection.title,
      totalClicks: updatedCollection.clicks.length,
    });
  } catch (err) {
    historyLogRecorder(
      req,
      "Collection",
      "UPDATE",
      [_id],
      `Error recording click for collection ID ${_id}: ${err.message}`
    );
    res.status(500).json({
      msg: "Error updating collection click count",
      error: err.message,
    });
  }
};

// GET: get filtered clicks
exports.getClicksByTimeframe = async (req, res) => {
  const { id } = req.params;
  const { timeframe } = req.query;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid collection ID" });
    }

    const now = new Date();
    const utcNow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )
    );
    let startDate;

    switch (timeframe) {
      case "today":
        startDate = new Date(utcNow);
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case "week":
        const day = utcNow.getUTCDay();
        const diff = utcNow.getUTCDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(
          Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), diff)
        );
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(
          Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1)
        );
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      default:
        historyLogRecorder(
          req,
          "Collection",
          "READ",
          [id],
          `Attempted to get clicks for collection ID ${id} with invalid timeframe '${timeframe}'`
        );
        return res.status(400).json({
          msg: "Invalid timeframe specified (use 'today', 'week', or 'month')",
        });
    }

    const collectionData = await Collection.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $project: {
          _id: 1,
          title: 1,
          totalClicks: { $size: { $ifNull: ["$clicks", []] } },
          filteredClicks: {
            $size: {
              $filter: {
                input: { $ifNull: ["$clicks", []] },
                as: "click",
                cond: { $gte: ["$$click.date", startDate] },
              },
            },
          },
        },
      },
    ]);

    if (!collectionData.length) {
      historyLogRecorder(
        req,
        "Collection",
        "READ",
        [id],
        `Attempted to get clicks for non-existent collection ID ${id} (Timeframe: ${timeframe})`
      );
      return res.status(404).json({ msg: "Collection not found" });
    }

    historyLogRecorder(
      req,
      "Collection",
      "READ",
      [id],
      `Retrieved click counts for collection '${collectionData[0].title}' (ID: ${id}). Timeframe: ${timeframe}. Total: ${collectionData[0].totalClicks}, Filtered: ${collectionData[0].filteredClicks}`
    );

    res.status(200).json({
      totalClicks: collectionData[0].totalClicks,
      timeframeClicks: collectionData[0].filteredClicks,
    });
  } catch (err) {
    historyLogRecorder(
      req,
      "Collection",
      "READ",
      [id],
      `Error retrieving clicks for collection ID ${id} (Timeframe: ${timeframe}): ${err.message}`
    );
    res.status(500).json({ msg: "Error fetching clicks", error: err.message });
  }
};
