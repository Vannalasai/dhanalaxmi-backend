// routes/products.js

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { adminAuthMiddleware } = require("../middleware/auth");

// Create a new product (admin only)
router.post("/", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      name,
      image,
      category,
      rating,
      description,
      benefits,
      usage,
      variants,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !image ||
      !category ||
      !description ||
      !variants ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return res.status(400).json({
        message: "Missing or invalid product data. Variants are required.",
      });
    }

    const product = new Product({
      name,
      image,
      category,
      rating,
      description,
      benefits,
      usage,
      variants,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET రూట్స్ (వీటిలో మార్పులు అవసరం లేదు, అవే పనిచేస్తాయి)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a product by ID (admin only)
router.put("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // అప్‌డేట్ చేసిన కొత్త డాక్యుమెంట్‌ను తిరిగి ఇస్తుంది
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a product by ID (admin only)
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
