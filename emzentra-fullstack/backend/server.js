require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const FRONTEND_DIR = path.join(__dirname, "..", "frontend", "public");
const DATA_DIR = path.join(__dirname, "data");
const ENQUIRIES_FILE = path.join(DATA_DIR, "enquiries.json");

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many enquiries from this connection. Please try again later." }
});

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}
async function saveEnquiry(enquiry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let items = [];
  try {
    const current = await fs.readFile(ENQUIRIES_FILE, "utf8");
    items = JSON.parse(current);
    if (!Array.isArray(items)) items = [];
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  items.push(enquiry);
  await fs.writeFile(ENQUIRIES_FILE, JSON.stringify(items, null, 2), { mode: 0o600 });
}
async function sendEmail(enquiry) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CONTACT_TO || !CONTACT_FROM) return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_PORT || "587") === "465",
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  await transporter.sendMail({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    replyTo: enquiry.email,
    subject: `EmZentra website enquiry: ${enquiry.service || "General enquiry"}`,
    text: [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Company: ${enquiry.company || "Not provided"}`,
      `Service: ${enquiry.service || "Not specified"}`,
      "",
      "Message:",
      enquiry.message
    ].join("\n")
  });
  return true;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "EmZentra website API" });
});

app.post("/api/contact", contactLimiter, async (req, res, next) => {
  try {
    // Honeypot field: bots that fill it receive a generic success response.
    if (cleanString(req.body.website, 200)) {
      return res.status(200).json({ message: "Thank you. Your enquiry has been received." });
    }

    const enquiry = {
      id: require("crypto").randomUUID(),
      createdAt: new Date().toISOString(),
      name: cleanString(req.body.name, 120),
      email: cleanString(req.body.email, 254),
      company: cleanString(req.body.company, 160),
      service: cleanString(req.body.service, 100),
      message: cleanString(req.body.message, 5000)
    };

    const errors = [];
    if (enquiry.name.length < 2) errors.push("Please enter your name.");
    if (!validEmail(enquiry.email)) errors.push("Please enter a valid email address.");
    if (enquiry.message.length < 10) errors.push("Please enter a message of at least 10 characters.");
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    // Persist enquiries locally even when SMTP is not configured.
    await saveEnquiry(enquiry);
    let emailed = false;
    try {
      emailed = await sendEmail(enquiry);
    } catch (mailError) {
      console.error("Email delivery failed:", mailError.message);
    }

    return res.status(201).json({
      message: emailed
        ? "Thank you. Your enquiry has been received and sent to the EmZentra team."
        : "Thank you. Your enquiry has been saved. Email delivery is not configured yet."
    });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(FRONTEND_DIR, { extensions: ["html"] }));
app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "An unexpected server error occurred. Please try again later." });
});

app.listen(PORT, () => {
  console.log(`EmZentra website is running at http://localhost:${PORT}`);
});
