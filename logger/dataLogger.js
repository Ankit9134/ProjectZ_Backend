const { createLogger, format, transports, level } = require("winston");
require("dotenv").config({ path: "../.env" });

// Requiring `winston-mongodb` will expose winston.transports.MongoDB`
require("winston-mongodb");

const dbConfig = {
  // db: `${process.env.MONGO_LOCAL_URL}/olcademy`,
  // db: "mongodb://127.0.0.1:27017/olcademy",
  db: `${process.env.MONGO_ATLAS_URI}`,
  // db: `mongodb+srv://techolcademy:m32gdIOIjbETl5q2@cluster0.iuwuq.mongodb.net/project-z`,
  capped: true, // Use capped collections for fixed-size logging
  // options: { useNewUrlParser: true, useUnifiedTopology: true },
  // tryReconnect: true, // Custom metadata field
};

const customFormat = format((info) => {
  // info.random = "IAmString"; custom field
  // info.hardLevel = 3;
  return info;
});

const dataLogger = () => {
  return createLogger({
    // level: "info",
    format: format.combine(
      customFormat(), // Use the custom format
      format.json() // Store the logs in JSON format
    ),
    transports: [
      // direct stream from and store to db
      new transports.MongoDB({
        ...dbConfig,
        collection: "logs",
      }),
    ],
  });
};

const customFormat2 = format((info) => {
  // info.random = "IAmString"; custom field
  // info.hardLevel = 3;
  info.isViewed = false;
  info.isAccept = false;
  info.isReject = false;
  return info;
});

const notifyLogger = () => {
  return createLogger({
    format: format.combine(
      customFormat2(), // Use the custom format
      format.json() // Store the logs in JSON format
    ),
    transports: [
      // direct stream from and store to db
      new transports.MongoDB({
        ...dbConfig,
        collection: "notifylogs",
      }),
    ],
  });
};

module.exports = { dataLogger, notifyLogger };
