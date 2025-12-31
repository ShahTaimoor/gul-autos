const userService = require('../services/UserService');
const { BadRequestError } = require('../errors');

class UserController {
  async signupOrLogin(req, res, next) {
    try {
      const { shopName, password, phone, address, city, username, rememberMe } = req.body;
      const result = await userService.signupOrLogin(
        shopName,
        password,
        phone,
        address,
        city,
        username,
        rememberMe
      );

      const tokens = userService.generateTokens(result.user, rememberMe);

      return res
        .cookie('accessToken', tokens.accessToken, tokens.cookieOptions)
        .cookie('refreshToken', tokens.refreshToken, tokens.refreshCookieOptions)
        .status(200)
        .json({
          success: true,
          user: result.user,
          accessToken: tokens.accessToken,
          isNewUser: result.isNewUser,
          message: result.isNewUser
            ? 'Account created and logged in successfully'
            : 'Logged in successfully'
        });
    } catch (error) {
      next(error);
    }
  }

  async signup(req, res, next) {
    try {
      const { name, password, phone, address, city, username } = req.body;
      const user = await userService.signup(name, password, phone, address, city, username);

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { name, password, rememberMe } = req.body;
      const user = await userService.login(name, password);

      const tokens = userService.generateTokens(user, rememberMe);

      return res
        .cookie('accessToken', tokens.accessToken, tokens.cookieOptions)
        .cookie('refreshToken', tokens.refreshToken, tokens.refreshCookieOptions)
        .status(200)
        .json({
          success: true,
          user,
          accessToken: tokens.accessToken
        });
    } catch (error) {
      next(error);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const { name, password, rememberMe } = req.body;
      const user = await userService.adminLogin(name, password);

      const tokens = userService.generateTokens(user, rememberMe);

      return res
        .cookie('accessToken', tokens.accessToken, tokens.cookieOptions)
        .cookie('refreshToken', tokens.refreshToken, tokens.refreshCookieOptions)
        .status(200)
        .json({
          success: true,
          user,
          accessToken: tokens.accessToken,
          message: 'Admin login successful'
        });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const { rememberMe } = req.body || {};
      const result = await userService.refreshToken(refreshToken, rememberMe);

      // Cookie options for access token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: result.cookieMaxAge || 365 * 24 * 60 * 60 * 1000
      };

      // Cookie options for refresh token (TOKEN ROTATION)
      const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: result.refreshCookieMaxAge || (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
      };

      return res
        .cookie('accessToken', result.accessToken, cookieOptions)
        .cookie('refreshToken', result.refreshToken, refreshCookieOptions) // TOKEN ROTATION: Set new refresh token
        .status(200)
        .json({
          success: true,
          accessToken: result.accessToken,
          message: 'Token refreshed successfully'
        });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies || {};
      await userService.logout(refreshToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 0,
        path: '/'
      };

      return res
        .cookie('accessToken', '', cookieOptions)
        .cookie('refreshToken', '', cookieOptions)
        .status(200)
        .json({
          success: true,
          message: 'Logged out successfully'
        });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      const { accessToken } = req.cookies;
      const user = await userService.verifyToken(accessToken);

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getAllUsers(page, limit);

      return res.status(200).json({
        success: true,
        users: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, phone, address, city, username } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (username !== undefined) updateData.username = username;

      const user = await userService.updateProfile(userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          username: user.username
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;

      const user = await userService.updateUserRole(userId, role, currentUserId, currentUserRole);

      return res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          city: user.city
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      await userService.changePassword(userId, oldPassword, newPassword, confirmPassword);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUsername(req, res, next) {
    try {
      const userId = req.user.id;
      const { newUsername } = req.body;

      const user = await userService.updateUsername(userId, newUsername);

      return res.status(200).json({
        success: true,
        message: 'Username updated successfully',
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          city: user.city,
          username: user.username
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

