const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  image: { type: String, required: true },
  category: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  description: { type: String, required: true },
  benefits: { type: [String], required: true },
  usage: { type: String, required: true },
  weight: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  inStock: { type: Boolean, required: true },
});

module.exports = mongoose.model("Product", productSchema);
