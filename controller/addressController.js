const Address = require("../models/Address");

// City normalization function
const normalizeCityName = (city) => {
  city = city.trim().toLowerCase();
  const cityMap = {
    // "new delhi": "delhi",
    delhi: "delhi",
    ncr: "delhi",
    gurgaon: "gurugram",
    gurugram: "gurugram",
    bangalore: "bengaluru",
    bengaluru: "bengaluru",
    mumbai: "mumbai",
    bombay: "mumbai",
    pune: "pune",
    hyderabad: "hyderabad",
    chennai: "chennai",
    kolkata: "kolkata",
    calcutta: "kolkata",
    jaipur: "jaipur",
  };
  return cityMap[city] || city;
};

// Create new address
exports.createAddresses = async (req, res) => {
  try {
    const addresses = req.body;
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res
        .status(400)
        .json({ message: "An array of addresses is required" });
    }

    for (const { address, service_area } of addresses) {
      if (!address || !service_area) {
        return res.status(400).json({
          message: "Each address must have address and service area",
        });
      }
    }

    const newAddresses = await Address.insertMany(addresses);
    res
      .status(201)
      .json({ message: "Addresses saved successfully", newAddresses });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error saving addresses", error });
  }
};

// show all subcity name and count all restaurent
exports.getAddressesByCity = async (req, res) => {
  try {
    let city = req.params.city;
    city = normalizeCityName(city);
    const cityPattern = new RegExp(city, "i");
    const localityCounts = await Address.aggregate([
      { $match: { service_area: cityPattern } },
      {
        $addFields: {
          locality: {
            $trim: { input: { $first: { $split: ["$address", ","] } } },
          },
        },
      },
      {
        $group: {
          _id: "$locality",
          name: { $first: "$locality" },
          count: { $sum: 1 },
          sampleAddress: { $first: "$address" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (localityCounts.length === 0) {
      return res
        .status(404)
        .json({ message: `No addresses found in ${city}`, data: [] });
    }

    res.status(200).json(localityCounts);
  } catch (error) {
    console.error(`Error fetching addresses for ${req.params.city}:`, error);
    res.status(500).json({
      message: `Error fetching addresses for ${req.params.city}`,
      error: error.message,
    });
  }
};

exports.getAddressesByLocality = async (req, res) => {
  try {
    const addresses = await Address.find({
      address: new RegExp(`^${req.params.locality}\\b`, "i"),
    });
    res.status(200).json(addresses);
  } catch (error) {
    console.error("Error fetching locality addresses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// // all City Fetch Automatically at user side
exports.getLocationData = async (req, res) => {
  try {
    // Step 1: Get the IP address of the client
    const ipResponse = await fetch("https://get.geojs.io/v1/ip.json");
    const ipData = await ipResponse.json();
    const ip = ipData.ip;
    console.log(ip);
    // Step 2: Use the IP to get full location data with lat/lon
    const geoResponse = await fetch(
      `https://get.geojs.io/v1/ip/geo/${ip}.json`
    );
    const geoData = await geoResponse.json();
    if (geoData.error) {
      console.error("GeoJS Error:", geoData);
      return res.status(429).json({ error: geoData.message });
    }

    const locationData = {
      city: geoData.city || "Unknown City",
      state: geoData.region || "Unknown State",
      country: geoData.country || "Unknown Country",
      lat: geoData.latitude,
      lon: geoData.longitude,
    };

    res.json(locationData);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Error fetching location" });
  }
};
