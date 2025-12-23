const secureUserService = require('../services/SecureUserService');

class SecureUserController {
  async signup(req, res, next) {
    try {
      const userData = req.body;
      const user = await secureUserService.signup(userData);

      const token = secureUserService.generateToken(user);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { name, password } = req.body;
      const user = await secureUserService.login(name, password);

      const token = secureUserService.generateToken(user);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          username: user.username,
          address: user.address,
          city: user.city
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      const user = await secureUserService.updateProfile(userId, updateData);

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          username: user.username,
          address: user.address,
          city: user.city
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await secureUserService.getProfile(userId);

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          username: user.username,
          address: user.address,
          city: user.city,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SecureUserController();

