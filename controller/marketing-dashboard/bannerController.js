const { uploadOnCloudinary } = require("../../utils/cloudinary"); // Adjust path
const Banner = require("../../models/marketing-dashboard/Banner"); // Adjust path
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const historyLogRecorder = require("../../utils/historyLogRecorder"); // Adjust path
const Notify=require("../../models/logs/notify")
// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    historyLogRecorder(
      req,
      "Banner",
      "READ",
      banners.map((b) => b._id),
      `Retrieved all banners (${banners.length} found)`
    );
    res.json(banners);
  } catch (err) {
    historyLogRecorder(
      req,
      "Banner",
      "READ",
      [],
      `Error retrieving all banners: ${err.message}`
    );
    res.status(500).send(err.message);
  }
};

// Create a new banner
exports.createBanner = async (req, res) => {
  let savedBannerId = null;
  try {
    const { title, isDefault, status } = req.body;
    const banner = new Banner({
      title,
      isDefault: isDefault || false,
      status: status || "Inactive",
    });

    await banner.save();
    savedBannerId = banner._id;

    historyLogRecorder(
      req,
      banner.constructor.modelName,
      "CREATE",
      [banner._id],
      `Created new banner '${banner.title}' with ID ${banner._id}`
    );

      const newNotify=new Notify({
          timestamp:new Date(),
          level:"New Banner is Created",
          type:['admin'],
          message:"A  Banner is Created from the Marketing dashboard check it once",
          metadata:{
            category:["Marketing"],
            isViewed:false,
            isAccept:false,
            isReject:false,
          }
        })
        await newNotify.save();
    res.status(201).json({ message: "Banner created successfully", banner });
  } catch (err) {
    historyLogRecorder(
      req,
      "Banner",
      "CREATE",
      savedBannerId ? [savedBannerId] : [],
      `Error creating banner: ${err.message}`
    );
    res.status(400).send(err.message);
  }
};

// update a banner
exports.updateBanner = async (req, res) => {
  const { id } = req.params;
  let bannerTitle = "Unknown"; // For logging in case of early failure
  try {
    const { startDate, endDate, ...bodyFields } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      historyLogRecorder(
        req,
        "Banner",
        "UPDATE",
        [id],
        `Attempted to update non-existent banner ID ${id}`
      );
      return res.status(404).send("Banner not found");
    }
    bannerTitle = banner.title; // Store title for logging

    delete bodyFields.clicks;

    const fieldsToUpdate = {};
    Object.keys(bodyFields).forEach((key) => {
      if (bodyFields[key] !== undefined) {
        fieldsToUpdate[key] = bodyFields[key];
      }
    });
    Object.assign(banner, fieldsToUpdate);

    let newStartDate = banner.startDate;
    let newEndDate = banner.endDate;

    if (startDate !== undefined || endDate !== undefined) {
      newStartDate =
        startDate !== undefined
          ? new Date(startDate)
          : banner.startDate
          ? new Date(banner.startDate)
          : null;
      newEndDate =
        endDate !== undefined
          ? new Date(endDate)
          : banner.endDate
          ? new Date(banner.endDate)
          : null;

      if (startDate !== undefined) banner.startDate = newStartDate;
      if (endDate !== undefined) banner.endDate = newEndDate;

      const now = new Date();
      if (newStartDate && now < newStartDate) {
        banner.status = "Upcoming";
      } else if (newEndDate && now > newEndDate) {
        banner.status = "Inactive";
      } else if (newStartDate && newEndDate) {
        // Only active if both dates are valid and range includes now
        banner.status = "Active";
      } else if (newStartDate && !newEndDate) {
        // Active if start date is past and no end date
        banner.status = "Active";
      } else {
        banner.status = "Inactive"; // Default to inactive if dates are invalid/incomplete
      }
    }

    if (banner.isDefault) {
      banner.status = "Active";
      banner.startDate = undefined;
      banner.endDate = undefined;
    }

    if (req.files && req.files.length > 0) {
      const photoWeb = req.files.find((file) => file.fieldname === "photoWeb");
      if (photoWeb) {
        const cloudinaryRes = await uploadOnCloudinary(photoWeb.path);
        if (cloudinaryRes) {
          banner.photoWeb = cloudinaryRes.url;
        }
      }

      const photoApp = req.files.find((file) => file.fieldname === "photoApp");
      if (photoApp) {
        const cloudinaryRes = await uploadOnCloudinary(photoApp.path);
        if (cloudinaryRes) {
          banner.photoApp = cloudinaryRes.url;
        }
      }
    }

    await banner.save();

    historyLogRecorder(
      req,
      banner.constructor.modelName,
      "UPDATE",
      [banner._id],
      `Updated banner '${banner.title}' (ID: ${banner._id})`
    );

      const newNotify=new Notify({
          timestamp:new Date(),
          level:"A Banner is updated",
          type:['admin'],
          message:"A Banner is updated by the admin check it  ",
          metadata:{
            category:["Marketing"],
            isViewed:false,
            isAccept:false,
            isReject:false,
          }
        })
        await newNotify.save();
    res.json({ message: "Banner updated successfully", banner });
  } catch (err) {
    console.log("error while updating banner", err.message);
    historyLogRecorder(
      req,
      "Banner",
      "UPDATE",
      [id],
      `Error updating banner '${bannerTitle}' (ID: ${id}): ${err.message}`
    );
    res.status(400).json({ message: err.message }); // Send JSON response for errors
  }
};

// to delete
exports.deleteBanner = async (req, res) => {
  const { id } = req.params;
  let bannerTitle = "Unknown";
  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      historyLogRecorder(
        req,
        "Banner",
        "DELETE",
        [id],
        `Attempted to delete non-existent banner ID ${id}`
      );
      return res.status(404).json({ message: "Banner not found" });
    }
    bannerTitle = banner.title; // Store title for logging

    if (banner.isDefault) {
      const defaultCount = await Banner.countDocuments({ isDefault: true });
      if (defaultCount <= 1) {
        historyLogRecorder(
          req,
          "Banner",
          "DELETE",
          [id],
          `Attempted to delete the last default banner '${bannerTitle}' (ID: ${id}). Forbidden.`
        );
        return res.status(403).json({
          message: "At least one default banner must remain",
        });
      }
    }

    const deleteCloudinaryAsset = async (url) => {
      if (!url) return;
      // Basic public ID extraction, might need adjustment based on your Cloudinary setup
      const parts = url.split("/");
      const publicIdWithExt = parts
        .slice(parts.indexOf("upload") + 2)
        .join("/");
      const publicId =
        publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf(".")) ||
        publicIdWithExt;
      if (publicId) {
        console.log(`Attempting to delete Cloudinary asset: ${publicId}`); // Debug log
        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
          console.log(`Deleted Cloudinary asset: ${publicId}`); // Debug log
        } catch (cloudinaryError) {
          console.error(
            `Cloudinary deletion failed for public ID ${publicId}:`,
            cloudinaryError
          );
          // Decide if you want to proceed with DB deletion even if Cloudinary fails
        }
      }
    };

    await Promise.all([
      deleteCloudinaryAsset(banner.photoWeb),
      deleteCloudinaryAsset(banner.photoApp),
    ]);

    await Banner.findByIdAndDelete(id);

    historyLogRecorder(
      req,
      "Banner",
      "DELETE",
      [id],
      `Deleted banner '${bannerTitle}' (ID: ${id})`
    );

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    historyLogRecorder(
      req,
      "Banner",
      "DELETE",
      [id],
      `Error deleting banner '${bannerTitle}' (ID: ${id}): ${err.message}`
    );
    return res.status(500).json({
      message: "Deletion failed. Please try again later",
      error: err.message, // Include error message
    });
  }
};

// return active banners
exports.getActiveBanners = async (req, res) => {
  try {
    const activeBanners = await Banner.find({ status: "Active" });
    historyLogRecorder(
      req,
      "Banner",
      "READ",
      activeBanners.map((b) => b._id),
      `Retrieved active banners (${activeBanners.length} found)`
    );
    res.status(200).json(activeBanners);
  } catch (err) {
    historyLogRecorder(
      req,
      "Banner",
      "READ",
      [],
      `Error retrieving active banners: ${err.message}`
    );
    res
      .status(500)
      .json({ error: "Error fetching active banners", message: err.message });
  }
};

// POST: add a new click entry with the current date when user click on a banner
exports.clickCounts = async (req, res) => {
  const { _id } = req.params; // Use _id to match route param likely
  try {
    const updatedBanner = await Banner.findByIdAndUpdate(
      _id,
      { $push: { clicks: { date: new Date() } } },
      { new: true }
    );

    if (!updatedBanner) {
      historyLogRecorder(
        req,
        "Banner",
        "UPDATE",
        [_id],
        `Attempted to record click for non-existent banner ID ${_id}`
      );
      return res.status(404).json({ msg: "Banner not found to record click." });
    }

    historyLogRecorder(
      req,
      updatedBanner.constructor.modelName,
      "UPDATE",
      [updatedBanner._id],
      `Recorded a click for banner '${updatedBanner.title}' (ID: ${updatedBanner._id}). New total clicks: ${updatedBanner.clicks.length}`
    );

    res.status(200).json({
      Banner: updatedBanner.title,
      totalClicks: updatedBanner.clicks.length,
    });
  } catch (err) {
    historyLogRecorder(
      req,
      "Banner",
      "UPDATE",
      [_id],
      `Error recording click for banner ID ${_id}: ${err.message}`
    );
    res.status(500).json({
      msg: "Error updating banner click count", // Simplified msg
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
      return res.status(400).json({ msg: "Invalid banner ID" });
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
        const day = utcNow.getUTCDay(); // 0 for Sunday, 1 for Monday, etc.
        const diff = utcNow.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
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
          "Banner",
          "READ",
          [id],
          `Attempted to get clicks for banner ID ${id} with invalid timeframe '${timeframe}'`
        );
        return res.status(400).json({
          msg: "Invalid timeframe specified (use 'today', 'week', or 'month')",
        });
    }

    const bannerData = await Banner.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $project: {
          _id: 1,
          title: 1, // Include title for logging context
          totalClicks: { $size: { $ifNull: ["$clicks", []] } }, // Handle potentially missing clicks array
          filteredClicks: {
            $size: {
              $filter: {
                input: { $ifNull: ["$clicks", []] }, // Handle potentially missing clicks array
                as: "click",
                cond: { $gte: ["$$click.date", startDate] },
              },
            },
          },
        },
      },
    ]);

    if (!bannerData.length) {
      historyLogRecorder(
        req,
        "Banner",
        "READ",
        [id],
        `Attempted to get clicks for non-existent banner ID ${id} (Timeframe: ${timeframe})`
      );
      return res.status(404).json({ msg: "Banner not found" });
    }

    historyLogRecorder(
      req,
      "Banner",
      "READ",
      [id],
      `Retrieved click counts for banner '${bannerData[0].title}' (ID: ${id}). Timeframe: ${timeframe}. Total: ${bannerData[0].totalClicks}, Filtered: ${bannerData[0].filteredClicks}`
    );

    res.status(200).json({
      totalClicks: bannerData[0].totalClicks,
      timeframeClicks: bannerData[0].filteredClicks,
    });
  } catch (err) {
    historyLogRecorder(
      req,
      "Banner",
      "READ",
      [id],
      `Error retrieving clicks for banner ID ${id} (Timeframe: ${timeframe}): ${err.message}`
    );
    res.status(500).json({ msg: "Error fetching clicks", error: err.message });
  }
};
