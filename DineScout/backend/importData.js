const mongoose = require("mongoose");
const csv = require("csvtojson");
const Restaurant = require("./models/Restaurant");

// Connect MongoDB
mongoose.connect(
  "mongodb+srv://dhushitha:dhushi22@cluster0.xt0dcl4.mongodb.net/dinescout"
);

// Check valid number
function isValidNumber(val) {
  return val !== "" && val !== null && !isNaN(Number(val));
}

async function importData() {
  try {

    const data = await csv().fromFile("../dataset/zomato.csv");

    const cleanData = [];

    for (let item of data) {

      const rating = item["Aggregate rating"];
      const cost = item["Average Cost for two"];
      const lat = item["Latitude"];
      const lon = item["Longitude"];

      if (
        isValidNumber(rating) &&
        isValidNumber(cost) &&
        isValidNumber(lat) &&
        isValidNumber(lon)
      ) {

        cleanData.push({
          name: item["Restaurant Name"],
          cuisines: item["Cuisines"],
          rating: Number(rating),
          cost: Number(cost),
          latitude: Number(lat),
          longitude: Number(lon)
        });
      }
    }

    // Clear old data
    await Restaurant.deleteMany({});

    // Insert new data
    await Restaurant.insertMany(cleanData);

    console.log("✅ Imported:", cleanData.length, "restaurants");

    process.exit();

  } catch (err) {
    console.log("❌ Import Error:", err);
  }
}

importData();
