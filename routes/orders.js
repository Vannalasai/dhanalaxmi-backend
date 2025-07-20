const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { authMiddleware } = require("../middleware/auth");
const { sendEmail, loadTemplate } = require("../utils/sendEmail");

// Create Razorpay Order
// Endpoint: POST /api/orders/create
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Number(req.body.amount) * 100, // Amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.error("Error creating Razorpay order:", error);
        return res.status(500).json({ message: "Something went wrong!" });
      }
      res.status(200).json({ data: order });
    });
  } catch (error) {
    console.error("Error in /create order route:", error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

// Verify Payment, Update Stock, Save Order, and Send Email
// Endpoint: POST /api/orders/verify
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderItems,
      shippingAddress,
      totalAmount,
    } = req.body;

    // 1. Verify Razorpay Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid payment signature!" });
    }

    // 2. Update Product Stock
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          if (variant.quantity < item.quantity) {
            return res
              .status(400)
              .json({
                message: `Not enough stock for ${item.name} (${item.weight}).`,
              });
          }
          variant.quantity -= item.quantity;
        }
        await product.save();
      }
    }

    // 3. Save the Order to Database
    const newOrder = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });
    await newOrder.save();

    // 4. Send Confirmation Email to Customer
    try {
      const itemsHtml = newOrder.items
        .map(
          (item) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.name} (${item.weight})</td>
                <td style="padding: 10px; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 10px; text-align: right;">₹${item.price.toFixed(
                  2
                )}</td>
            </tr>
        `
        )
        .join("");

      const shippingAddressHtml = `${newOrder.shippingAddress.name}<br>${newOrder.shippingAddress.street}<br>${newOrder.shippingAddress.city}, ${newOrder.shippingAddress.state} - ${newOrder.shippingAddress.zip}<br>Ph: ${newOrder.shippingAddress.phone}`;

      const shippingFee = 0; // Update if you have a dynamic shipping fee
      const subtotal = newOrder.totalAmount - shippingFee;

      const customerHtml = loadTemplate("order-confirmation.html", {
        CUSTOMER_NAME: newOrder.shippingAddress.name,
        ORDER_ID: newOrder._id.toString().slice(-6).toUpperCase(),
        ORDER_DATE: new Date(newOrder.orderedAt).toLocaleDateString(),
        ITEMS_HTML: itemsHtml,
        SUBTOTAL: subtotal.toFixed(2),
        SHIPPING_FEE: shippingFee.toFixed(2),
        TOTAL_AMOUNT: newOrder.totalAmount.toFixed(2),
        SHIPPING_ADDRESS_HTML: shippingAddressHtml,
      });

      await sendEmail({
        to: req.user.email,
        subject: `Your DhanaLaxmi Foods Order #${newOrder._id
          .toString()
          .slice(-6)
          .toUpperCase()} is Confirmed!`,
        html: customerHtml,
      });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Do not block the order from completing if email fails. Log the error.
    }

    res.status(200).json({
      message: "Payment verified successfully and order placed!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Order verification error:", error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

// Get Order History for the logged-in user
// Endpoint: GET /api/orders/history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      orderedAt: -1,
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

module.exports = router;
