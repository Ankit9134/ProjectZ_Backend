const HistoryLog = require("../models/historyLog");

//to read all the logs
const getAllHistoryLog = async (req, res) => {
  try {
    const logs = await HistoryLog.find()
      .sort({ timestamp: -1 })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting all history logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//select logs from particular entity
const getEntity = async (req, res) => {
  try {
    if (!req.query.word) {
      return res
        .status(400)
        .json({ error: "Select filter again cannot applied correctly" });
    }
    const logs = await HistoryLog.find({ entity: req.query.word })
      .sort({
        timestamp: -1,
      })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting entity logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//filter logs on the basis of user role  ???
const getLogsByUserRole = async (req, res) => {
  try {
    if (!req.query.role) {
      return res
        .status(400)
        .json({ error: "User role is missing, select again" });
    }
    const logs = await HistoryLog.find({
      userRole: { $in: [`${req.query.role}`] },
    })
      .sort({ timestamp: -1 })
      .populate("performedBy", "username email");
    console.log(logs);
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting logs by user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//selected los within given time frame
const getLogsWithInDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Missing 'start' or 'end' date" });
    }
    const logs = await HistoryLog.find({
      timestamp: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    })
      .sort({ timestamp: -1 })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting logs within date range:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//filter logs by action
const getLogsByActions = async (req, res) => {
  try {
    if (!req.query.word) {
      return res
        .status(400)
        .json({ error: "Action is missing select some action" });
    }
    const logs = await HistoryLog.find({ action: req.query.word })
      .sort({
        timestamp: -1,
      })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting logs by actions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//filter by both entity and action
const getLogsByEntityAndAction = async (req, res) => {
  try {
    const { entity, action } = req.query;
    if (!entity || !action) {
      return res
        .status(400)
        .json({ error: "Missing 'entity' or 'action' query parameters" });
    }
    const logs = await HistoryLog.find({ entity, action })
      .sort({
        timestamp: -1,
      })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting logs by entity and action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//sort on the basis of response time
const getLogsByResponseTime = async (req, res) => {
  try {
    const query = {};
    if (req.query.order === "asc") {
      query.sort = { responseTime: 1 };
    } else if (req.query.order === "desc") {
      query.sort = { responseTime: -1 };
    } else {
      query.sort = { responseTime: 1 };
    }

    const logs = await HistoryLog.find()
      .sort(query.sort)
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting logs by response time:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//get the archieved logs whcih are older than one year
const getArchievedLogs = async (req, res) => {
  try {
    const logs = await HistoryLog.find({ archived: true })
      .sort({
        timestamp: -1,
      })
      .populate("performedBy", "username email");
    res.status(200).json({ response: true, logs });
  } catch (error) {
    console.error("Error getting archived logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ???
const searchByName = async (req, res) => {
  try {
    const { query } = req.query;
    let matchQuery = {};

    if (query) {
      matchQuery = {
        $or: [
          { "user.name": { $regex: query, $options: "i" } },
          { "user.email": { $regex: query, $options: "i" } },
        ],
      };
    }

    const logs = await HistoryLog.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "performedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: matchQuery,
      },
      {
        // Replace performedBy with the populated user
        $addFields: {
          performedBy: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
          },
        },
      },
      {
        // Optionally remove the now-unused user field
        $project: {
          entity: 1,
          action: 1,
          performedBy: 1,
          description: 1,
          timestamp: 1,
        },
      },
      {
        $sort: { timestamp: -1 },
      },
    ]);

    res.status(200).json({ response: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllHistoryLog,
  getEntity,
  getLogsByUserRole,
  getLogsWithInDateRange,
  getLogsByActions,
  getLogsByEntityAndAction,
  getLogsByResponseTime,
  getArchievedLogs,
  searchByName,
};
