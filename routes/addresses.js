const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth"); // మనం ఈ middlewareను క్రియేట్ చేస్తాం

// యూజర్‌కు సంబంధించిన అన్ని అడ్రస్‌లను పొందండి (GET)
// Endpoint: GET /api/addresses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// యూజర్ కోసం కొత్త అడ్రస్‌ను యాడ్ చేయండి (POST)
// Endpoint: POST /api/addresses
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAddress = req.body;

    // కొత్త అడ్రస్‌ను యూజర్ అడ్రస్‌ల జాబితాకు యాడ్ చేయండి
    user.addresses.push(newAddress);
    await user.save();

    // సేవ్ చేసిన కొత్త అడ్రస్ ను రెస్పాన్స్ గా పంపండి
    const savedAddress = user.addresses[user.addresses.length - 1];
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ఎండ్‌పాయింట్: PUT /api/addresses/:addressId
router.put("/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // యూజర్ యొక్క అడ్రస్‌ల జాబితా నుండి సరైన అడ్రస్‌ను కనుగొనండి
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // అడ్రస్ వివరాలను అప్‌డేట్ చేయండి
    address.set(req.body);
    await user.save();

    res.status(200).json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
