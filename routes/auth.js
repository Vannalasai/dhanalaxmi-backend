// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendEmail, loadTemplate } = require("../utils/sendEmail");
const { authMiddleware } = require("../middleware/auth");
const crypto = require("crypto");

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

// routes/auth.js లోని login ఫంక్షన్
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    // పేలోడ్‌లో 'id' మరియు 'role' రెండింటినీ చేర్చండి
    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
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

// ఎండ్‌పాయింట్: POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // యూజర్ లేకపోయినా, సెక్యూరిటీ కోసం సక్సెస్ మెసేజ్ పంపండి
      return res
        .status(200)
        .json({
          message:
            "If a user with that email exists, a password reset link has been sent.",
        });
    }

    // రీసెట్ టోకెన్ జనరేట్ చేయండి
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 నిమిషాల గడువు

    await user.save();

    // రీసెట్ లింక్ సృష్టించండి
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const emailHtml = loadTemplate("password-reset.html", {
      USER_NAME: user.name,
      RESET_URL: resetUrl,
    });

    await sendEmail({
      to: user.email,
      subject: "Your Password Reset Link for DhanaLaxmi Foods",
      html: emailHtml,
    });

    res
      .status(200)
      .json({
        message:
          "If a user with that email exists, a password reset link has been sent.",
      });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. కొత్త పాస్‌వర్డ్‌ను సెట్ చేయడానికి
// ఎండ్‌పాయింట్: POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // టోకెన్ గడువు ముగియలేదని నిర్ధారించుకోండి
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired." });
    }

    // కొత్త పాస్‌వర్డ్‌ను సెట్ చేసి, టోకెన్ ఫీల్డ్స్‌ను క్లియర్ చేయండి
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
