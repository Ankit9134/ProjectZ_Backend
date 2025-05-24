const mongoose = require("mongoose");
const Firm = require("../models/Firm");
const Review = require("../models/Reviews");
const MenuItem = require("../models/MenuItem");

const calResponseTime = (req, res, next) => {
  if (req.headers["token"]) {
    req.startTime = process.hrtime(); // Start timer
  }

  // Hook into res.send to capture response time before sending the response
  const originalSend = res.send;
  res.send = function (body) {
    if (req.startTime) {
      const elapsed = process.hrtime(req.startTime);
      const responseTime = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(3); // Convert to ms

      console.log(`Request to ${req.originalUrl} took ${responseTime}ms`);

      // Store response time in the request object (optional, for logging)
      req.responseTime = responseTime;
    }

    originalSend.apply(res, arguments); // Call the original res.send()
  };

  next();
};

module.exports = { calResponseTime };
