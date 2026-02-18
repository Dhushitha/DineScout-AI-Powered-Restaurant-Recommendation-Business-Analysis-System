const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const Restaurant = require("../models/Restaurant");


// ================= TOKEN VERIFY =================
function verifyToken(req, res, next) {

  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ msg: "No token" });
  }

  try {

    jwt.verify(token, process.env.JWT_SECRET);
    next();

  } catch {

    return res.status(401).json({ msg: "Invalid token" });

  }
}


// ================= DISTANCE FUNCTION =================
function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371; // KM

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}


// ================= SEARCH (WITH LOCATION) =================
router.get("/search", verifyToken, async (req, res) => {

  try {

    const { cuisine, budget, lat, lon } = req.query;

    console.log("SEARCH:", cuisine, budget, lat, lon);

    if (!lat || !lon) {
      return res.status(400).json({ error: "Location missing" });
    }

    // Base query
    let query = {
      cuisines: { $regex: cuisine, $options: "i" }
    };

    // Budget filter (optional)
    if (budget && budget !== "") {
      query.cost = { $lte: Number(budget) };
    }

    // Get restaurants
    const data = await Restaurant.find(query);

    // Add distance
    const result = data.map(r => {

      let distance = 9999;

      // If coordinates exist
      if (r.latitude && r.longitude) {

        distance = getDistance(
          Number(lat),
          Number(lon),
          r.latitude,
          r.longitude
        );

      }

      return {

        id: r._id,
        name: r.name,
        cuisines: r.cuisines,
        rating: r.rating,
        cost: r.cost,

        latitude: r.latitude,
        longitude: r.longitude,

        distance: distance.toFixed(2)

      };

    });

    // Sort by distance then rating
    result.sort((a, b) => {

      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return b.rating - a.rating;

    });

    // Send top 20
    res.json(result.slice(0, 20));

  } catch (err) {

    console.log("SEARCH ERROR:", err);

    res.status(500).json({ error: "Server Error" });

  }

});


module.exports = router;
