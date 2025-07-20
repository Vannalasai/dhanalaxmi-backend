// models/Product.js

const mongoose = require("mongoose");

// ప్రతీ వేరియంట్‌కు ఒక సబ్-స్కీమా
const variantSchema = new mongoose.Schema({
  weight: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  quantity: { type: Number, required: true, default: 0 },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  benefits: { type: [String], required: true },
  usage: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },

  // పాత ఫీల్డ్స్‌కు బదులుగా ఈ 'variants' అర్రేను వాడండి
  variants: [variantSchema],

  // ఉత్పత్తి స్టాక్‌లో ఉందో లేదో తెలుసుకోవడానికి ఒక వర్చువల్ ఫీల్డ్
  inStock: { type: Boolean, default: false },
});

// ప్రొడక్ట్‌ను సేవ్ చేసే ముందు మొత్తం క్వాంటిటీ ఆధారంగా inStock ను సెట్ చేయండి
productSchema.pre("save", function (next) {
  const totalQuantity = this.variants.reduce(
    (sum, variant) => sum + variant.quantity,
    0
  );
  this.inStock = totalQuantity > 0;
  next();
});

module.exports = mongoose.model("Product", productSchema);
