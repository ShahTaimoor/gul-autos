const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { isAuthorized, isAdmin } = require('../middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http'); // 👈 serverless adapter

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cookieParser());

// Generate Tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXP });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXP });
  return { accessToken, refreshToken };
};

// Signup
router.post('/signup', async (req, res) => {
  const { name, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, password: hashedPassword });

    res.status(201).json({ success: true, message: 'User created', user });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    user.password = undefined;
    const { accessToken, refreshToken } = generateTokens(user._id);

    res
      .cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true, user, token: accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// Refresh Token
router.get('/refresh-token', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    });

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ success: true, token: accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res
    .clearCookie('token', { httpOnly: true, secure: true, sameSite: 'None' })
    .clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' })
    .json({ success: true, message: 'Logged out' });
});

// Get All Users (Admin Only)
router.get('/all-users', isAuthorized, isAdmin, async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json({ success: true, users });
});

// Update Profile
router.put('/update-profile', isAuthorized, async (req, res) => {
  const { name, phone, address, city } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  user.name = name || user.name;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  user.city = city || user.city;

  await user.save();

  res.json({ success: true, message: 'Profile updated', user });
});

// Register router under base path
app.use('/api/auth', router);

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
