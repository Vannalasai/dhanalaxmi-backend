// models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// కొత్తగా అడ్రస్ కోసం ఒక స్కీమాను డిఫైన్ చేయండి
const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  type: { type: String, enum: ["HOME", "WORK"], default: "HOME" },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // userSchema కు addresses ఫీల్డ్‌ను యాడ్ చేయండి
  addresses: [addressSchema],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
