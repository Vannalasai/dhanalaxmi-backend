const express = require("express");
const router = express.Router();
const { sendEmail, loadTemplate } = require("../utils/sendEmail"); // మీ sendEmail యుటిలిటీని ఇంపోర్ట్ చేసుకోండి

// ఎండ్‌పాయింట్: POST /api/contact/send
router.post("/send", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // అడ్మిన్‌కు పంపే ఇమెయిల్ టెంప్లేట్‌ను లోడ్ చేయండి
    const adminHtml = loadTemplate("contact-admin-notification.html", {
      USER_NAME: name,
      USER_EMAIL: email,
      SUBJECT: subject,
      MESSAGE: message,
    });

    // మీ వ్యాపార ఇమెయిల్‌కు మెయిల్ పంపండి
    await sendEmail({
      to: process.env.BUSINESS_EMAIL,
      subject: `New Contact Form Message: ${subject}`,
      html: adminHtml,
      replyTo: email, // యూజర్‌కు నేరుగా రిప్లై ఇవ్వడానికి
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res
      .status(500)
      .json({ message: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
