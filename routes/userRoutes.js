const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { protect } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Send OTP to email
// @route   POST /api/users/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Generate 6 digit OTP
    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false, 
      lowerCaseAlphabets: false 
    });

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendEmail({
      email: email,
      subject: "Your FinMate Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
          <h2 style="color: #10b981;">Welcome to FinMate!</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #020617; background: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">${otp}</h1>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore it.</p>
        </div>
      `
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send email. Check server configuration." });
    }

    res.status(200).json({ 
      success: true, 
      message: "OTP sent to email successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Get user profile data
// @route   GET /api/users/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Get user profile data by deviceId (Legacy/Compatibility)
// @route   GET /api/users/device/:deviceId
router.get("/device/:deviceId", async (req, res) => {
  try {
    let user = await User.findOne({ deviceId: req.params.deviceId });
    
    // If user doesn't exist, create an empty one
    if (!user) {
      user = await User.create({ deviceId: req.params.deviceId });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Sync mobile data to the cloud (Overwrite/Merge)
// @route   POST /api/users/sync
router.post("/sync", protect, async (req, res) => {
  try {
    const { level, progressMap, monthly_budget, transactions } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (level) user.level = level;
    if (progressMap) user.progressMap = progressMap;
    if (typeof monthly_budget === 'number') user.monthly_budget = monthly_budget;
    if (transactions) user.transactions = transactions;
    
    user.lastSynced = Date.now();

    await user.save();

    res.status(200).json({ success: true, message: "Data successfully synced to the cloud", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Update user profile (Name)
// @route   PUT /api/users/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    await user.save();

    res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
