const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: String,
  cuisines: String,
  rating: Number,
  cost: Number,
  latitude: Number,
  longitude: Number
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
