// const Lvl = new Map();
// Lvl.set("error", 0);
// Lvl.set("warn", 1);
// Lvl.set("info", 2);

const { logger } = require("../logger");
const { dataLogger } = require("../logger/dataLogger");

// Lvl.forEach((value, key) => {
//   console.log(key);
// });

// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   verbose: 4,
//   debug: 5,
//   silly: 6
// };

function historyLog(req, res, next) {
  const logEntry = {
    endpoint: req.originalUrl,
    method: req.method,
    user: req.user ? req.user._id : "Guest",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    status: res.statusCode,
  };

  logger.info("message get recorded", logEntry);
  next();
}

module.exports = historyLog;
