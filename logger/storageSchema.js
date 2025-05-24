const { logger } = require("./index");
// message --> what action is perform
//meta --> other important info
//res --> request body
// actorType --> ["restaurantVendor", "tiffinVendor", "admin", "moderator",  "user", "marketingGuy" ]

// serverity level of message
// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   verbose: 4,
//   debug: 5,
//   silly: 6
// };

// message | (request - endpoint) | method;

function logHistory(req, message, actorType, meta = {}) {
  let logEntry;

  // let meta = {
  //   firm_id,
  //  prev_state,
  //  curr_state,
  //   userRole: actorType,
  //   ipAddress: "192.168.1.1",
  //  event: {
  // id,
  //  temperedSchemaModel,
  //  action
  // }
  // };

  switch (actorType) {
    case "restaurantOwner":
      logEntry = {
        actorType,
        vendorId: req.body.id || req.params.id,
        vendorName: req.body.username || req.query.username,
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;

    case "tiffinOwner":
      logEntry = {
        actorType,
        tiffinVendorId: req.body.id || req.params.id,
        vendorName: req.body.username || req.query.username,
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;

    case "admin":
      logEntry = {
        actorType,
        adminId: req.body.id || req.params.id,
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;

    case "moderator":
      logEntry = {
        actorType,
        moderatorId: req.body.id || req.params.id,
        moderatorName: req.body.username || "Anonymous",
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;

    case "user":
      logEntry = {
        actorType,
        userId: req.body.id || req.params.id,
        userName: req.body.username || req.query.username,
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;
    case "marketingPerson":
      logEntry = {
        actorType,
        userId: req.body.id || req.params.id,
        userName: req.body.username || req.query.username,
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      break;

    default:
      logEntry = {
        actorType: "unknown",
        details: "Invalid actor type",
        meta,
        responseTime: req.responseTime + "ms" || "N/A",
        route: req.originalUrl,
        method: req.method,
      };
      alert("your log is not record correct the actorType");
  }

  // Log the entry using Winston
  logger.info(message, logEntry);
}

module.exports = { logHistory };
