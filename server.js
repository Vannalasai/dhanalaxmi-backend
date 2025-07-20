const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const cors = require("cors");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const addressRoutes = require("./routes/addresses");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const contactRoutes = require("./routes/contact");

const app = express();

// Add this line before your routes
app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
