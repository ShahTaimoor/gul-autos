const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { isAuthorized, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { name, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during registration');
  }
});

// Logi
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: 'Shop name or password is incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Shop name or password is incorrect' });

    user.password = undefined;
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    });

    res
      .cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 15 * 60 * 1000,
      })
      .json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});


// Logout
router.get('/logout', (req, res) => {
  return res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    expires: new Date(0),
  }).status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// All users

router.get('/all-users', isAuthorized, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error while fetching users');
  }
});

// Update profile
router.put('/update-profile', isAuthorized, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
