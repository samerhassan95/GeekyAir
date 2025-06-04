const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken, verifyToken } = require("../utils/jwt");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const { Op } = require("sequelize");

// Register
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Check if user exists
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "waiter",
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${email}`;
    const html = `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`;
    console.log("🔗 Email verification link:", verificationUrl);
    await sendEmail(email, "Verify your email", html);

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email
router.get("/verify-email", async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email)
    return res.status(400).send("Invalid verification link");

  try {
    const user = await User.findOne({
      where: { email, verificationToken: token },
    });
    if (!user) return res.status(400).send("Invalid token or email");

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send("Email verified successfully. You can now login.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    if (!user.isVerified)
      return res.status(403).json({ error: "Email not verified" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Password reset request
router.post("/password-reset-request", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    const html = `<p>Reset your password by clicking <a href="${resetUrl}">here</a>. This link expires in 1 hour.</p>`;

    console.log("🔐 Password Reset Link:", resetUrl);
    await sendEmail(email, "Password Reset Request", html);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Password reset confirm
router.post("/password-reset", async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword)
    return res.status(400).json({ error: "Missing parameters" });

  try {
    const user = await User.findOne({
      where: {
        email,
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    console.log("🔍 Checking for user with email:", email);
    console.log("🔍 Token:", token);
    console.log("🔍 Date now:", Date.now());
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
