// Dependencies
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// In-memory storage
const otpStorage = {};
const verifiedIdentifiers = new Set();
const cooldowns = {};
const MAX_ATTEMPTS = 3;
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRE_TIME = 5 * 60 * 1000; // 5 minutes

// Rate Limiter
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests, please try again later.",
});

// Send OTP via Email (Gmail API)
router.post("/send-email-otp", otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (cooldowns[email] && cooldowns[email] > Date.now()) {
    return res
      .status(429)
      .json({ message: "Too many attempts. Try again after cooldown." });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  otpStorage[email] = {
    otp: hashedOtp,
    attempts: 0,
    createdAt: Date.now(),
  };

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: my_email,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: my_email,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: Verification_Email_Template.replace("{verificationCode}", otp),
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully to email" });
  } catch (error) {
    console.error("Error sending OTP to email:", error.message);
    res.status(500).json({ message: "Failed to send OTP via email" });
  }
});

// Verify OTP for Phone or Email
router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;

  if (!otpStorage[identifier]) {
    return res
      .status(400)
      .json({ message: "No OTP request found for this identifier" });
  }

  const data = otpStorage[identifier];

  const isExpired = Date.now() - data.createdAt > OTP_EXPIRE_TIME;
  if (isExpired) {
    delete otpStorage[identifier];
    return res.status(400).json({ message: "OTP expired" });
  }

  const isOtpValid = await bcrypt.compare(otp, data.otp);

  if (isOtpValid) {
    delete otpStorage[identifier];
    verifiedIdentifiers.add(identifier);
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } else {
    data.attempts += 1;
    if (data.attempts >= MAX_ATTEMPTS) {
      cooldowns[identifier] = Date.now() + COOLDOWN_PERIOD;
      delete otpStorage[identifier];
      return res
        .status(429)
        .json({ message: "Too many attempts. Cooldown applied for 1 hour." });
    }
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});
