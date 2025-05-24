const Firm = require("../../models/Firm");
const { pipeline } = require("stream");
const { promisify } = require("util");

// Configuration constants
const CONFIG = {
  EARTH_RADIUS_KM: 6371,
  BATCH_SIZE: 5000,
  DEFAULT_RADIUS: 5,
  DEFAULT_LIMIT: 20,
  DEFAULT_CURSOR: 0,
  PRICE_SORT_MAP: {
    "CAN$30 and under": 1,
    "CAN$31 to CAN$50": 2,
    "CAN$51 and over": 3,
  },
  DAYS_MAP: {
    0: "SundaySun",
    1: "MondayMon",
    2: "TuesdayTue",
    3: "WednesdayWed",
    4: "ThursdayThu",
    5: "FridayFri",
    6: "SaturdaySat",
  },
  ALCOHOL_TERMS: [/Bar\/Lounge/i, /Beer/i, /Cocktails/i, /Full Bar/i, /Wine/i],
  DIETARY_TERMS: [/Vegan/i, /Halal/i, /Gluten[-\s]?Free/i, /Vegetarian/i],
  TIMEZONE: "America/Toronto",
};

// KD-Tree Node
class Node {
  constructor(restaurant, left = null, right = null) {
    this.restaurant = restaurant;
    this.left = left;
    this.right = right;
  }
}

// KD-Tree Implementation
class KDTree {
  constructor(points = []) {
    this.root = points.length ? this.buildTree(points, 0) : null;
  }

  buildTree(points, depth, batchSize = CONFIG.BATCH_SIZE) {
    if (!points?.length) return null;

    const axis = depth % 2;
    const coords = new Float32Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
      coords[i * 2] = parseFloat(points[i].latitude);
      coords[i * 2 + 1] = parseFloat(points[i].longitude);
    }

    const indices = new Array(points.length).fill().map((_, i) => i);
    indices.sort(
      (a, b) =>
        coords[axis === 0 ? a * 2 : a * 2 + 1] -
        coords[axis === 0 ? b * 2 : b * 2 + 1]
    );

    const sortedPoints = indices.map((i) => points[i]);
    const median = Math.floor(sortedPoints.length / 2);

    return new Node(
      sortedPoints[median],
      sortedPoints[0] !== sortedPoints[median]
        ? this.buildTree(sortedPoints.slice(0, median), depth + 1, batchSize)
        : null,
      sortedPoints[median + 1]
        ? this.buildTree(sortedPoints.slice(median + 1), depth + 1, batchSize)
        : null
    );
  }

  findNearby(target, radius) {
    if (!this.root) return [];

    const results = [];
    const distanceCache = Object.create(null);

    const latDelta = (radius / CONFIG.EARTH_RADIUS_KM) * (180 / Math.PI);
    const lonDelta = latDelta / Math.cos(this._toRadians(target.lat));
    const latMin = target.lat - latDelta;
    const latMax = target.lat + latDelta;
    const lonMin = target.lon - lonDelta;
    const lonMax = target.lon + lonDelta;

    const searchTree = (node, depth = 0) => {
      if (!node) return;

      const { latitude, longitude } = node.restaurant;
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (lat < latMin || lat > latMax || lon < lonMin || lon > lonMax) {
        const axis = depth % 2;
        const targetValue = axis === 0 ? target.lat : target.lon;
        const nodeValue = axis === 0 ? lat : lon;
        const nextBranch = targetValue < nodeValue ? node.left : node.right;
        searchTree(nextBranch, depth + 1);
        return;
      }

      const cacheKey = `${lat},${lon}`;
      let distance = distanceCache[cacheKey];

      if (!distance) {
        distance = this._haversineDistance(target, { lat, lon });
        distanceCache[cacheKey] = distance;
      }

      if (distance <= radius) {
        results.push({ restaurant: node.restaurant, distance });
      }

      const axis = depth % 2;
      const targetValue = axis === 0 ? target.lat : target.lon;
      const nodeValue = axis === 0 ? lat : lon;

      const nextBranch = targetValue < nodeValue ? node.left : node.right;
      const oppositeBranch = targetValue < nodeValue ? node.right : node.left;

      searchTree(nextBranch, depth + 1);
      if (oppositeBranch && Math.abs(targetValue - nodeValue) < radius) {
        searchTree(oppositeBranch, depth + 1);
      }
    };
    searchTree(this.root);
    return results;
  }

  _haversineDistance(point1, point2) {
    const dLat = this._toRadians(point2.lat - point1.lat);
    const dLon = this._toRadians(point2.lon - point1.lon);
    const lat1 = this._toRadians(point1.lat);
    const lat2 = this._toRadians(point2.lat);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return CONFIG.EARTH_RADIUS_KM * c;
  }

  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

// Function to check if restaurant is open now
function isOpenNow(schedule) {
  const daysMap = [
    "SundaySun",
    "MondayMon",
    "TuesdayTue",
    "WednesdayWed",
    "ThursdayThu",
    "FridayFri",
    "SaturdaySat",
  ];

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
  );
  const currentDay = daysMap[now.getDay()];
  if (!schedule || !schedule[currentDay]) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openTime, closeTime] = schedule[currentDay]?.split("-") || [];
  if (!openTime || !closeTime) return false;

  const timeToMinutes = (time) => {
    const [hours, minutesPart] = time.trim().split(":");
    let [minutes, period] = minutesPart?.match(/(\d+)(AM|PM)/i) || [];
    if (!minutes || !period) return null;

    let totalMinutes = (parseInt(hours) % 12) * 60 + parseInt(minutes);
    if (/PM/i.test(period)) totalMinutes += 12 * 60;
    return totalMinutes;
  };

  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  if (openMinutes === null || closeMinutes === null) return false;

  return closeMinutes <= openMinutes
    ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
    : currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// KD-Tree Management
let kdTree;
let isKdTreeInitialized = false;

const streamFirms = async () => {
  const firms = [];
  const cursor = Firm.find({})
    .select(
      "latitude longitude _id location restaurantInfo.name restaurantInfo.cuisines restaurantInfo.priceRange restaurantInfo.ratings.overall"
    )
    .lean()
    .batchSize(CONFIG.BATCH_SIZE)
    .cursor();

  await promisify(pipeline)(
    cursor,
    new (require("stream").Transform)({
      objectMode: true,
      transform(firm, _, callback) {
        if (
          firm.latitude &&
          firm.longitude &&
          !isNaN(parseFloat(firm.latitude)) &&
          !isNaN(parseFloat(firm.longitude))
        ) {
          firms.push(firm);
        }
        callback();
      },
    })
  );

  return firms;
};

const initializeKDTree = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Initializing KD-Tree (attempt ${i + 1}/${retries})...`);
      const firms = await streamFirms();

      const validFirms = firms.filter(
        (firm) =>
          firm.latitude &&
          firm.longitude &&
          !isNaN(parseFloat(firm.latitude)) &&
          !isNaN(parseFloat(firm.longitude))
      );

      if (!validFirms.length) {
        throw new Error("No valid firms with coordinates found");
      }

      kdTree = new KDTree(validFirms);
      isKdTreeInitialized = true;
      console.log(`KD-Tree initialized with ${validFirms.length} firms`);
      return;
    } catch (error) {
      console.error(`KD-Tree initialization failed (attempt ${i + 1}):`, error);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  kdTree = new KDTree();
  isKdTreeInitialized = false;
  console.error("KD-Tree initialization failed after all retries");
};

const rebuildKDTree = async () => {
  try {
    await initializeKDTree();
    console.log(
      isOpenNow({
        SundaySun: "3PM-10PM",
        MondayMon: "5PM-10PM",
        TuesdayTue: "5PM-10PM",
        WednesdayWed: "5PM-10PM",
        ThursdayThu: "5PM-10PM",
        FridayFri: "5PM-11PM",
        SaturdaySat: "12PM-11PM",
      }),
      "is open now"
    );
  } catch (error) {
    console.error("KD-Tree rebuild failed:", error);
  }
};

// Query Builder
const buildQueryConditions = ({
  feature,
  cuisines,
  minRating,
  maxRating,
  Alcohol,
  Dietary,
  priceRange,
  offers,
  others,
}) => {
  const conditions = [];

  if (feature) {
    const featureArray = feature.split(",").map((item) => item.trim());
    conditions.push({
      features: { $all: featureArray.map((f) => new RegExp(`^${f}$`, "i")) },
    });
  }

  if (cuisines) {
    const cuisineArray = cuisines.split(",").map((item) => item.trim());
    conditions.push({
      "restaurantInfo.cuisines": {
        $in: cuisineArray.map((c) => new RegExp(c, "i")),
      },
    });
  }

  if (minRating || maxRating) {
    const ratingCond = {};
    if (minRating) ratingCond.$gte = Number(minRating);
    if (maxRating) ratingCond.$lte = Number(maxRating);
    conditions.push({ "restaurantInfo.ratings.overall": ratingCond });
  }

  if (Alcohol === "true" || Dietary === "true") {
    const details = [];
    if (Alcohol === "true") details.push(...CONFIG.ALCOHOL_TERMS);
    if (Dietary === "true") details.push(...CONFIG.DIETARY_TERMS);
    conditions.push({
      "restaurantInfo.additionalInfo.additionalDetails": { $in: details },
    });
  }

  if (priceRange) {
    const priceValue = parseInt(priceRange);
    const priceLabel =
      priceValue <= 80
        ? "CAN$30 and under"
        : priceValue <= 100
        ? "CAN$31 to CAN$50"
        : "CAN$51 and over";
    conditions.push({ "restaurantInfo.priceRange": priceLabel });
  }

  if (offers === "true") {
    conditions.push({ offer: { $exists: true, $not: { $size: 0 } } });
  }

  if (others) {
    const othersArray = others.split(",").map((item) => item.trim());
    const otherTerms = othersArray.map((o) => new RegExp(o, "i"));
    conditions.push({
      "restaurantInfo.additionalInfo.additionalDetails": { $in: otherTerms },
    });
  }

  return conditions;
};

// Main Handler
const getRestaurants = async (req, res) => {
  try {
    const {
      lat,
      lon,
      radius = CONFIG.DEFAULT_RADIUS,
      limit = CONFIG.DEFAULT_LIMIT,
      cursor = CONFIG.DEFAULT_CURSOR,
      feature,
      cuisines,
      minRating,
      maxRating,
      Alcohol,
      Dietary,
      sortBy,
      others,
      priceRange,
      openNow,
      offers,
    } = req.query;

    const radiusNum = parseFloat(radius);
    const limitNum = parseInt(limit, 10);
    const cursorNum = parseInt(cursor, 10);

    // Validate query parameters
    if (
      (lat && lon && (isNaN(radiusNum) || radiusNum <= 0)) ||
      isNaN(limitNum) ||
      limitNum <= 0 ||
      isNaN(cursorNum) ||
      cursorNum < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
      });
    }

    let target;
    if (lat && lon) {
      target = { lat: parseFloat(lat), lon: parseFloat(lon) };
    }

    if (target && (isNaN(target.lat) || isNaN(target.lon))) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const conditions = buildQueryConditions({
      feature,
      cuisines,
      minRating,
      maxRating,
      Alcohol,
      Dietary,
      priceRange,
      offers,
      others,
    });

    // Sort options
    const sortOptions = {
      lowToHigh: { priceSort: 1, _id: 1 },
      highToLow: { priceSort: -1, _id: 1 },
      HighToLow: { ratingSort: -1, _id: 1 },
      LowToHigh: { ratingSort: 1, _id: 1 },
      distance: { distance: 1, _id: 1 },
      deliveryTime: { distance: 1, _id: 1 }, // Approximated by distance
      default: { _id: 1 },
    };

    let firms = [];
    let usedKDTree = false;
    let totalAvailable = 0;

    if (target) {
      const geoQuery = {
        $geoNear: {
          near: { type: "Point", coordinates: [target.lon, target.lat] },
          distanceField: "distance",
          maxDistance: radiusNum * 1000, // Convert radius to meters
          spherical: true,
          query: conditions.length ? { $and: conditions } : {},
        },
      };

      // Prepare sort stage
      let sortStage = sortOptions[sortBy] || sortOptions.default;

      if (openNow === "true") {
        const now = new Date(
          new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
        );
        const currentDay = CONFIG.DAYS_MAP[now.getDay()];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Count total available with openNow filter
        const countPipeline = [
          geoQuery,
          {
            $addFields: {
              isOpen: {
                $and: [
                  { $lte: [currentMinutes, 1440] },
                  {
                    $let: {
                      vars: {
                        open: `$opening_hours.${currentDay}.open`,
                        close: `$opening_hours.${currentDay}.close`,
                      },
                      in: {
                        $cond: [
                          { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                          false,
                          {
                            $cond: [
                              { $lte: ["$$close", "$$open"] },
                              {
                                $or: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                              {
                                $and: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              distance: { $divide: ["$distance", 1000] }, // Convert to kilometers
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $match: { isOpen: true } },
          { $count: "total" },
        ];

        const countResult = await Firm.aggregate(countPipeline).exec();
        totalAvailable = countResult[0]?.total || 0;

        firms = await Firm.aggregate([
          geoQuery,
          {
            $addFields: {
              isOpen: {
                $and: [
                  { $lte: [currentMinutes, 1440] },
                  {
                    $let: {
                      vars: {
                        open: `$opening_hours.${currentDay}.open`,
                        close: `$opening_hours.${currentDay}.close`,
                      },
                      in: {
                        $cond: [
                          { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                          false,
                          {
                            $cond: [
                              { $lte: ["$$close", "$$open"] },
                              {
                                $or: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                              {
                                $and: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              distance: { $divide: ["$distance", 1000] }, // Convert to kilometers
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $match: { isOpen: true } },
          { $sort: sortStage },
          { $skip: cursorNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              latitude: 1,
              longitude: 1,
              "restaurantInfo.name": 1,
              "restaurantInfo.address": 1,
              "restaurantInfo.cuisines": 1,
              "restaurantInfo.ratings.overall": 1,
              "restaurantInfo.priceRange": 1,
              "restaurantInfo.additionalInfo.additionalDetails": 1,
              features: 1,
              opening_hours: 1,
              offer: 1,
              image_urls: 1,
              distance: 1,
            },
          },
        ]).exec();
      } else {
        // Count total available without openNow
        const countPipeline = [
          geoQuery,
          {
            $addFields: {
              distance: { $divide: ["$distance", 1000] }, // Convert to kilometers
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $count: "total" },
        ];

        const countResult = await Firm.aggregate(countPipeline).exec();
        totalAvailable = countResult[0]?.total || 0;

        firms = await Firm.aggregate([
          geoQuery,
          {
            $addFields: {
              distance: { $divide: ["$distance", 1000] }, // Convert to kilometers
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $sort: sortStage },
          { $skip: cursorNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              latitude: 1,
              longitude: 1,
              "restaurantInfo.name": 1,
              "restaurantInfo.address": 1,
              "restaurantInfo.cuisines": 1,
              "restaurantInfo.ratings.overall": 1,
              "restaurantInfo.priceRange": 1,
              "restaurantInfo.additionalInfo.additionalDetails": 1,
              features: 1,
              opening_hours: 1,
              offer: 1,
              image_urls: 1,
              distance: 1,
            },
          },
        ]).exec();
      }

      // Debug invalid distance values
      firms.forEach((firm, index) => {
        if (typeof firm.distance !== "number" || isNaN(firm.distance)) {
          console.warn(
            `Invalid distance at index ${index}:`,
            firm.distance,
            "for firm _id:",
            firm._id
          );
          firm.distance = null;
        }
      });

      // Fallback to KD-Tree if no results and KD-Tree is initialized
      if (!firms.length && isKdTreeInitialized && kdTree) {
        console.log("Falling back to KD-Tree search");
        usedKDTree = true;
        const nearbyRestaurants = kdTree.findNearby(target, radiusNum);
        const nearbyIds = nearbyRestaurants.map((item) => item.restaurant._id);
        let query = {
          _id: { $in: nearbyIds },
          ...(conditions.length && { $and: conditions }),
        };

        // Create a lookup map for distances
        const distanceMap = Object.create(null);
        nearbyRestaurants.forEach((item) => {
          distanceMap[String(item.restaurant._id)] = item.distance;
        });

        // Count total available with filters
        if (openNow === "true") {
          const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
          );
          const currentDay = CONFIG.DAYS_MAP[now.getDay()];
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          const countPipeline = [
            { $match: query },
            {
              $addFields: {
                isOpen: {
                  $and: [
                    { $lte: [currentMinutes, 1440] },
                    {
                      $let: {
                        vars: {
                          open: `$opening_hours.${currentDay}.open`,
                          close: `$opening_hours.${currentDay}.close`,
                        },
                        in: {
                          $cond: [
                            { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                            false,
                            {
                              $cond: [
                                { $lte: ["$$close", "$$open"] },
                                {
                                  $or: [
                                    { $gte: [currentMinutes, "$$open"] },
                                    { $lt: [currentMinutes, "$$close"] },
                                  ],
                                },
                                {
                                  $and: [
                                    { $gte: [currentMinutes, "$$open"] },
                                    { $lt: [currentMinutes, "$$close"] },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                priceSort: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$30 and under",
                          ],
                        },
                        then: 1,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$31 to CAN$50",
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$51 and over",
                          ],
                        },
                        then: 3,
                      },
                    ],
                    default: 999,
                  },
                },
                ratingSort: {
                  $ifNull: ["$restaurantInfo.ratings.overall", 0],
                },
              },
            },
            { $match: { isOpen: true } },
            { $count: "total" },
          ];

          const countResult = await Firm.aggregate(countPipeline).exec();
          totalAvailable = countResult[0]?.total || 0;

          firms = await Firm.aggregate([
            { $match: query },
            {
              $addFields: {
                isOpen: {
                  $and: [
                    { $lte: [currentMinutes, 1440] },
                    {
                      $let: {
                        vars: {
                          open: `$opening_hours.${currentDay}.open`,
                          close: `$opening_hours.${currentDay}.close`,
                        },
                        in: {
                          $cond: [
                            { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                            false,
                            {
                              $cond: [
                                { $lte: ["$$close", "$$open"] },
                                {
                                  $or: [
                                    { $gte: [currentMinutes, "$$open"] },
                                    { $lt: [currentMinutes, "$$close"] },
                                  ],
                                },
                                {
                                  $and: [
                                    { $gte: [currentMinutes, "$$open"] },
                                    { $lt: [currentMinutes, "$$close"] },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                distance: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        nearbyRestaurants.map((item) => item.distance),
                        {
                          $indexOfArray: [
                            nearbyRestaurants.map((item) =>
                              String(item.restaurant._id)
                            ),
                            { $toString: "$_id" },
                          ],
                        },
                      ],
                    },
                    null,
                  ],
                },
                priceSort: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$30 and under",
                          ],
                        },
                        then: 1,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$31 to CAN$50",
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$51 and over",
                          ],
                        },
                        then: 3,
                      },
                    ],
                    default: 999,
                  },
                },
                ratingSort: {
                  $ifNull: ["$restaurantInfo.ratings.overall", 0],
                },
              },
            },
            { $match: { isOpen: true, distance: { $ne: null } } },
            { $sort: sortStage },
            { $skip: cursorNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                latitude: 1,
                longitude: 1,
                "restaurantInfo.name": 1,
                "restaurantInfo.address": 1,
                "restaurantInfo.cuisines": 1,
                "restaurantInfo.ratings.overall": 1,
                "restaurantInfo.priceRange": 1,
                "restaurantInfo.additionalInfo.additionalDetails": 1,
                features: 1,
                opening_hours: 1,
                offer: 1,
                image_urls: 1,
                distance: 1,
              },
            },
          ]).exec();
        } else {
          totalAvailable = await Firm.countDocuments(query);

          firms = await Firm.aggregate([
            { $match: query },
            {
              $addFields: {
                distance: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        nearbyRestaurants.map((item) => item.distance),
                        {
                          $indexOfArray: [
                            nearbyRestaurants.map((item) =>
                              String(item.restaurant._id)
                            ),
                            { $toString: "$_id" },
                          ],
                        },
                      ],
                    },
                    null,
                  ],
                },
                priceSort: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$30 and under",
                          ],
                        },
                        then: 1,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$31 to CAN$50",
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            "$restaurantInfo.priceRange",
                            "CAN$51 and over",
                          ],
                        },
                        then: 3,
                      },
                    ],
                    default: 999,
                  },
                },
                ratingSort: {
                  $ifNull: ["$restaurantInfo.ratings.overall", 0],
                },
              },
            },
            { $match: { distance: { $ne: null } } },
            { $sort: sortStage },
            { $skip: cursorNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                latitude: 1,
                longitude: 1,
                "restaurantInfo.name": 1,
                "restaurantInfo.address": 1,
                "restaurantInfo.cuisines": 1,
                "restaurantInfo.ratings.overall": 1,
                "restaurantInfo.priceRange": 1,
                "restaurantInfo.additionalInfo.additionalDetails": 1,
                features: 1,
                opening_hours: 1,
                offer: 1,
                image_urls: 1,
                distance: 1,
              },
            },
          ]).exec();
        }

        firms = firms.map((firm) => ({
          ...firm,
          image_urls: firm.image_urls || [],
          features: firm.features || [],
          distance: firm.distance ? Number(firm.distance).toFixed(2) : null,
        }));
      }
    } else {
      // Non-geospatial query
      if (sortBy === "distance" || sortBy === "deliveryTime") {
        return res.status(400).json({
          success: false,
          message: "Distance sorting requires latitude and longitude",
        });
      }

      const sortStage = sortOptions[sortBy] || sortOptions.default;

      if (openNow === "true") {
        const now = new Date(
          new Date().toLocaleString("en-US", { timeZone: CONFIG.TIMEZONE })
        );
        const currentDay = CONFIG.DAYS_MAP[now.getDay()];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Count total available with openNow filter
        const countPipeline = [
          { $match: conditions.length ? { $and: conditions } : {} },
          {
            $addFields: {
              isOpen: {
                $and: [
                  { $lte: [currentMinutes, 1440] },
                  {
                    $let: {
                      vars: {
                        open: `$opening_hours.${currentDay}.open`,
                        close: `$opening_hours.${currentDay}.close`,
                      },
                      in: {
                        $cond: [
                          { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                          false,
                          {
                            $cond: [
                              { $lte: ["$$close", "$$open"] },
                              {
                                $or: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                              {
                                $and: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $match: { isOpen: true } },
          { $count: "total" },
        ];

        const countResult = await Firm.aggregate(countPipeline).exec();
        totalAvailable = countResult[0]?.total || 0;

        firms = await Firm.aggregate([
          { $match: conditions.length ? { $and: conditions } : {} },
          {
            $addFields: {
              isOpen: {
                $and: [
                  { $lte: [currentMinutes, 1440] },
                  {
                    $let: {
                      vars: {
                        open: `$opening_hours.${currentDay}.open`,
                        close: `$opening_hours.${currentDay}.close`,
                      },
                      in: {
                        $cond: [
                          { $or: [{ $not: "$$open" }, { $not: "$$close" }] },
                          false,
                          {
                            $cond: [
                              { $lte: ["$$close", "$$open"] },
                              {
                                $or: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                              {
                                $and: [
                                  { $gte: [currentMinutes, "$$open"] },
                                  { $lt: [currentMinutes, "$$close"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $match: { isOpen: true } },
          { $sort: sortStage },
          { $skip: cursorNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              latitude: 1,
              longitude: 1,
              "restaurantInfo.name": 1,
              "restaurantInfo.address": 1,
              "restaurantInfo.cuisines": 1,
              "restaurantInfo.ratings.overall": 1,
              "restaurantInfo.priceRange": 1,
              "restaurantInfo.additionalInfo.additionalDetails": 1,
              features: 1,
              opening_hours: 1,
              offer: 1,
              image_urls: 1,
              distance: { $literal: null },
            },
          },
        ]).exec();
      } else {
        totalAvailable = await Firm.countDocuments(
          conditions.length ? { $and: conditions } : {}
        );

        firms = await Firm.aggregate([
          { $match: conditions.length ? { $and: conditions } : {} },
          {
            $addFields: {
              priceSort: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$30 and under"],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$31 to CAN$50"],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: ["$restaurantInfo.priceRange", "CAN$51 and over"],
                      },
                      then: 3,
                    },
                  ],
                  default: 999,
                },
              },
              ratingSort: {
                $ifNull: ["$restaurantInfo.ratings.overall", 0],
              },
            },
          },
          { $sort: sortStage },
          { $skip: cursorNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              latitude: 1,
              longitude: 1,
              "restaurantInfo.name": 1,
              "restaurantInfo.address": 1,
              "restaurantInfo.cuisines": 1,
              "restaurantInfo.ratings.overall": 1,
              "restaurantInfo.priceRange": 1,
              "restaurantInfo.additionalInfo.additionalDetails": 1,
              features: 1,
              opening_hours: 1,
              offer: 1,
              image_urls: 1,
              distance: { $literal: null },
            },
          },
        ]).exec();
      }

      firms = firms.map((firm) => ({
        ...firm,
        image_urls: firm.image_urls || [],
        features: firm.features || [],
        distance: firm.distance ? Number(firm.distance).toFixed(2) : null,
      }));
    }

    if (!firms.length) {
      console.warn(
        `No restaurants found for query: lat=${target?.lat}, lon=${
          target?.lon
        }, radius=${radiusNum}, conditions=${JSON.stringify(conditions)}`
      );
      return res.status(200).json({
        success: true,
        totalResults: 0,
        totalAvailable,
        data: [],
        nextCursor: null,
        filtersApplied: {
          location: !!target,
          conditions: conditions.length ? conditions : "none",
          openNow: openNow === "true",
          usedKDTree,
          sortBy: sortBy || "default",
        },
      });
    }

    const response = {
      success: true,
      totalResults: firms.length,
      totalAvailable,
      data: firms,
      nextCursor:
        cursorNum + firms.length < totalAvailable ? cursorNum + limitNum : null,
      filtersApplied: {
        location: !!target,
        conditions: conditions.length ? conditions : "none",
        openNow: openNow === "true",
        usedKDTree,
        sortBy: sortBy || "default",
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = { getRestaurants, rebuildKDTree };
