// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendEmail, loadTemplate } = require("../utils/sendEmail");
const { authMiddleware } = require("../middleware/auth");

// Register — user must have verified via code first
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, mobile, isVerified } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    if (!isVerified)
      return res.status(400).json({ message: "Email not verified" });

    user = new User({ email, password, name, mobile, isVerified });
    await user.save();

    // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send welcome email
    const welcomeHtml = loadTemplate("welcome.html", { USER_NAME: name });
    await sendEmail({
      to: email,
      subject: "Welcome to DhanaLaxmi Foods!",
      html: welcomeHtml,
      text: `Hi ${name}, your account is now active. Welcome aboard!`,
    });

    res.status(201).json({ token, user: { id: user._id, email, name } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res
        .status(400)
        .json({ message: "Please verify your email first" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user: { id: user._id, email, name: user.name } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias /me for frontend convenience
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select(
      "name email mobile isVerified"
    );
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(u);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send verification code email
router.post("/send-verification", async (req, res) => {
  try {
    const { email, code } = req.body;
    const html = loadTemplate("verification.html", {
      VERIFICATION_CODE: code,
    });
    await sendEmail({
      to: email,
      subject: "Your DhanaLaxmi Foods Verification Code",
      html,
      text: `Your verification code is: ${code} (expires in 10 minutes)`,
    });
    res.status(200).json({ message: "Verification code sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send verification code" });
  }
});

// Test email
router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "This is a test email to verify setup.",
    });
    res.status(200).json({ message: "Test email sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send test email" });
  }
});

// Simple health‐check
router.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

module.exports = router;
