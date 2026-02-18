const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const User = require("../models/User");

const router = express.Router();


// ================= EMAIL TRANSPORT =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (!["user", "owner"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const exist = await User.findOne({ username });

    if (exist) {
      return res.status(400).json({ msg: "Username exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email,
      password: hash,
      role,
      otp,
      verified: false
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "DineScout OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ msg: "OTP Sent" });

  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= VERIFY =================
router.post("/verify", async (req, res) => {
  try {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    user.verified = true;
    user.otp = "";

    await user.save();

    res.json({ msg: "Verified" });

  } catch (err) {
    console.log("Verify Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {

    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (!user.verified) {
      return res.status(400).json({ msg: "Verify email first" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role
    });

  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
