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
      price,
      originalPrice,
      image,
      category,
      rating,
      description,
      benefits,
      usage,
      weight,
      quantity,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      typeof price !== "number" ||
      !image ||
      !category ||
      typeof rating !== "number" ||
      !description ||
      !Array.isArray(benefits) ||
      !usage ||
      !weight ||
      typeof quantity !== "number" ||
      quantity < 0
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid product data" });
    }

    // Derive inStock from quantity
    const inStock = quantity > 0;

    const product = new Product({
      name,
      price,
      originalPrice, // optional
      image,
      category,
      rating,
      description,
      benefits,
      usage,
      weight,
      quantity,
      inStock,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all products (public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get one product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
