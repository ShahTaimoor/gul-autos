const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid username or password' });

    user.password = undefined;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP || '24h',
    });

    return res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours instead of 365 days
    }).status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during login');
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Verify the existing token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP || '24h',
    });

    // Set new cookie
    return res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }).status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      user,
      token: newToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  return res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    expires: new Date(0),
  }).status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Add POST logout route for consistency
router.post('/logout', (req, res) => {
  return res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    expires: new Date(0),
  }).status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Validate token endpoint
router.get('/validate-token', isAuthorized, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        city: req.user.city,
      },
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
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

// Update user role (Admin only)
router.put('/update-user-role/:userId', isAuthorized, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (role === undefined || role === null) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
      },
    });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change Password - Admin only
router.put('/change-password', isAuthorized, isAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

module.exports = router;
