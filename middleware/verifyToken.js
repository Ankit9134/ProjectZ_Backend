const User = require("../models/user");
const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const { model } = require("mongoose");

dotEnv.config();
const secretKey = process.env.WhatIsYourName;

const verifyToken = async (req, res, next) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(401).json({ error: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    const vendor = await User.findById(decoded.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor Not Found" });
    }
    req.vendorId = vendor._id;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Invaild token" });
  }
};
module.exports = verifyToken;
