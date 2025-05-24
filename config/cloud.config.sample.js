require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration (Temporary File Storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
const folder = "project-z";

// Upload Single Image to Cloudinary
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, { folder });
    fs.unlinkSync(req.file.path); // Remove temp file
    res.json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Upload Multiple Images to Cloudinary
router.post(
  "/upload-multiple",
  upload.array("images", 10),
  async (req, res) => {
    try {
      const uploadResults = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder,
          });
          fs.unlinkSync(file.path);
          return { url: result.secure_url, public_id: result.public_id };
        })
      );
      res.json({
        message: "Images uploaded successfully",
        images: uploadResults,
      });
    } catch (err) {
      res.status(500).json({ error: "Upload failed", details: err.message });
    }
  }
);

// Update Single Image on Cloudinary
router.put("/update/:public_id", upload.single("image"), async (req, res) => {
  try {
    if (file && file.path) {
      await cloudinary.uploader.destroy(`${folder}/${req.params.public_id}`); // Delete old image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder,
      });
      fs.unlinkSync(req.file.path);
      res.json({
        message: "Image updated successfully",
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
});

// Delete Single Image from Cloudinary
router.delete("/delete/:public_id", async (req, res) => {
  try {
    await cloudinary.uploader.destroy(`${folder}/${req.params.public_id}`);
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// Delete Multiple Images from Cloudinary ??
router.delete("/delete-multiple", async (req, res) => {
  try {
    const { public_ids } = req.body;
    if (!public_ids || !Array.isArray(public_ids)) {
      return res.status(400).json({ error: "Invalid request format" });
    }
    const response = await Promise.all(
      public_ids.map((id) => cloudinary.uploader.destroy(`${folder}/${id}`))
    );

    res.json({ message: "Images deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

module.exports = router;
