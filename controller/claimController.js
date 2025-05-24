const Claim = require("../models/claim");
const multer = require("multer");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// OTP verification - Send OTP
exports.verifyClaim = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .json({ message: "Either email or phone number is required." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const claim = new Claim({
      method: "OTP",
      email,
      phoneNumber,
      otp,
      otpGeneratedAt: new Date(),
    });
    await claim.save();

    console.log(`OTP sent to ${email || phoneNumber}: ${otp}`); // Replace with actual OTP sending logic
    res
      .status(201)
      .json({ message: "OTP sent successfully.", claimId: claim._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OTP validation
exports.validateOtp = async (req, res) => {
  const { email, phoneNumber, otp } = req.body;

  if (!otp || (!email && !phoneNumber)) {
    return res
      .status(400)
      .json({ message: "OTP and either email or phone number are required." });
  }

  try {
    const claim = await Claim.findOne({
      otp,
      $or: [{ email }, { phoneNumber }],
    });

    if (!claim) {
      return res.status(400).json({ message: "Invalid OTP or details." });
    }

    const otpExpiry = new Date(claim.otpGeneratedAt);
    const now = new Date();
    if (now - otpExpiry > 5 * 60 * 1000) {
      // 5 minutes in milliseconds
      return res.status(400).json({ message: "OTP has expired." });
    }

    claim.status = "Approved";
    claim.otp = null; // Clear the OTP
    await claim.save();

    res.status(200).json({ message: "OTP verified successfully.", claim });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Document upload
exports.uploadClaim = async (req, res) => {
  const { email, phoneNumber, registeredBusinessName } = req.body;
  if (!req.file || (!email && !phoneNumber)) {
    return res
      .status(400)
      .json({
        message: "Document and either email or phone number are required.",
      });
  }

  try {
    const claim = new Claim({
      method: "Document",
      email,
      phoneNumber,
      registeredBusinessName,
      documents: [req.file.path],
    });
    await claim.save();

    res
      .status(201)
      .json({ message: "Claim submitted successfully.", claimId: claim._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
