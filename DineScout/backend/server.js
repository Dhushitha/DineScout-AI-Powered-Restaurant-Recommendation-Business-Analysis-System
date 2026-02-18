const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurant");

const app = express();


// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cors());


// ================= API ROUTES FIRST =================
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);


// ================= OWNER ROUTES =================
app.get("/api/owner/meta", async (req, res) => {
  try {
    const r = await axios.get("http://127.0.0.1:7000/meta");
    res.json(r.data);
  } catch (err) {
    console.log("META ERROR:", err.message);
    res.status(500).json({ error: "Meta error" });
  }
});

app.post("/api/owner/market-analysis", async (req, res) => {
  try {
    const r = await axios.post(
      "http://127.0.0.1:7000/market-analysis",
      req.body
    );
    res.json(r.data);
  } catch (err) {
    console.log("ANALYSIS ERROR:", err.message);
    res.status(500).json({ error: "Analysis error" });
  }
});


// ================= FRONTEND LAST =================
app.use(express.static(
  path.join(__dirname, "../frontend")
));


// ================= MONGODB =================
mongoose.connect(
  "<your_mongoDB_string"
)
.then(() => console.log("MongoDB Connected ✅"))
.catch(e => console.log("Mongo Error:", e));


// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});
