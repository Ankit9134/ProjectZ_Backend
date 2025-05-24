const multer = require("multer");
const fs = require("fs");

const tempDir = "temp/";
if (!fs.existsSync(tempDir)) {
  // creates a folder if not exists already
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // defines how the uploaded file will be named
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]; // If an unsupported file type (.exe, .pdf) is uploaded, an error is thrown
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP allowed."));
    }
  },
}).any(); // Accepts any field name

module.exports = upload;
