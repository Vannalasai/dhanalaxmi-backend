// utils/sendEmail.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

/**
 * Load an HTML template and replace {{PLACEHOLDER}} tokens.
 * @param {string} filename – name of template in /templates
 * @param {Object<string,string>} replacements – map of token → value
 */
function loadTemplate(filename, replacements) {
  const fullPath = path.join(__dirname, "../templates", filename);
  let template = fs.readFileSync(fullPath, "utf8");
  for (const key in replacements) {
    const re = new RegExp(`{{${key}}}`, "g");
    template = template.replace(re, replacements[key]);
  }
  return template;
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"DhanaLaxmi Foods" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text, // plain‐text fallback
  });
}

module.exports = { sendEmail, loadTemplate };
