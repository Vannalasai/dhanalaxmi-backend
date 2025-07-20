const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const { adminAuthMiddleware } = require("../middleware/auth");
const { format } = require("fast-csv");

// 1. సైన్ అప్ అయిన యూజర్లందరినీ పొందండి
// ఎండ్‌పాయింట్: GET /api/admin/users
router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    // పాస్‌వర్డ్ మినహా అన్ని యూజర్లను పొందండి
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. ఆర్డర్లన్నింటినీ పొందండి (యూజర్ వివరాలతో సహా)
// ఎండ్‌పాయింట్: GET /api/admin/orders
router.get("/orders", adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ orderedAt: -1 })
      // 'user' ఫీల్డ్‌లో ఉన్న ఐడీ ఆధారంగా, 'users' కలెక్షన్ నుండి 'name' మరియు 'email' ను పొందండి
      .populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/orders/export", adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ orderedAt: -1 })
      .populate("user", "name email");

    const csvStream = format({ headers: true });

    // బ్రౌజర్‌కు ఇది ఒక డౌన్‌లోడ్ ఫైల్ అని చెప్పడానికి హెడర్స్ సెట్ చేయండి
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orders_${Date.now()}.csv"`
    );

    csvStream.pipe(res);

    // ప్రతీ ఆర్డర్‌ను ఫార్మాట్ చేసి, CSV స్ట్రీమ్‌కు పంపండి
    orders.forEach((order) => {
      csvStream.write({
        "Order ID": order._id.toString().slice(-6),
        Date: new Date(order.orderedAt).toLocaleString(),
        "User Name": order.user ? order.user.name : "N/A",
        "User Email": order.user ? order.user.email : "N/A",
        "Total Amount": order.totalAmount,
        Status: order.orderStatus,
        "Shipping Address": `${order.shippingAddress.name}, ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zip}, Ph: ${order.shippingAddress.phone}`,
        Products: order.items
          .map((item) => `${item.name} (${item.weight}) x ${item.quantity}`)
          .join(" | "),
      });
    });

    csvStream.end();
  } catch (error) {
    console.error("Error exporting orders:", error);
    res.status(500).json({ message: "Failed to export orders" });
  }
});

router.put("/orders/:orderId/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    // enum లో ఉన్న విలువలు మాత్రమే అనుమతించబడతాయో లేదో చెక్ చేయండి
    const allowedStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true } // అప్‌డేట్ చేసిన కొత్త డాక్యుమెంట్‌ను తిరిగి ఇస్తుంది
    ).populate("user", "name email");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
