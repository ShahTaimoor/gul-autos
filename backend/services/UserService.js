const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userRepository, blacklistedTokenRepository } = require('../repositories');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../errors');

class UserService {
  async signupOrLogin(shopName, password, phone, address, city, username, rememberMe) {
    const trimmedShopName = shopName.trim();
    
    const existingUser = await userRepository.findOneWithPassword({ name: trimmedShopName });
    
    if (existingUser) {
      if (existingUser.role === 1 || existingUser.role === 2) {
        throw new ForbiddenError('Account already exists. Please login instead.');
      }

      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        throw new BadRequestError('Invalid shop name or password');
      }
      
      return {
        user: this._sanitizeUser(existingUser),
        isNewUser: false
      };
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userData = {
        name: trimmedShopName,
        password: hashedPassword,
        role: 0
      };
      
      if (phone && phone.trim()) userData.phone = phone.trim();
      if (address && address.trim()) userData.address = address.trim();
      if (city && city.trim()) userData.city = city.trim();
      if (username && username.trim()) userData.username = username.trim();
      
      const newUser = await userRepository.create(userData);
      return {
        user: this._sanitizeUser(newUser),
        isNewUser: true
      };
    }
  }

  async signup(name, password, phone, address, city, username) {
    const trimmedName = name.trim();
    
    const existingUser = await userRepository.findOne({ name: trimmedName });
    if (existingUser) {
      throw new BadRequestError('User with this shop name already exists. Please choose another name.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name: trimmedName,
      password: hashedPassword,
      role: 0
    };
    
    if (phone && phone.trim()) userData.phone = phone.trim();
    if (address && address.trim()) userData.address = address.trim();
    if (city && city.trim()) userData.city = city.trim();
    if (username && username.trim()) userData.username = username.trim();
    
    const user = await userRepository.create(userData);
    return this._sanitizeUser(user);
  }

  async login(name, password) {
    const trimmedName = name.trim();
    
    const user = await userRepository.findOneWithPassword({ name: trimmedName });
    if (!user) {
      throw new BadRequestError('Invalid username or password');
    }

    if (user.role === 1 || user.role === 2) {
      throw new ForbiddenError('Account already exists. Please login instead.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestError('Invalid username or password');
    }

    return this._sanitizeUser(user);
  }

  async adminLogin(name, password) {
    const trimmedName = name.trim();
    
    const user = await userRepository.findOneWithPassword({ name: trimmedName });
    if (!user) {
      throw new BadRequestError('Invalid credentials');
    }

    if (user.role !== 1 && user.role !== 2) {
      throw new ForbiddenError('Access denied. Admin access required.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    return this._sanitizeUser(user);
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token not provided');
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      throw new BadRequestError('Invalid token type');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const blacklisted = await blacklistedTokenRepository.findOne({ token: refreshToken });
    if (blacklisted) {
      throw new BadRequestError('Refresh token invalidated');
    }

    // Admin users (role 1 or 2) get 1 day token expiration
    // Regular users get 365 days
    const isAdmin = user.role === 1 || user.role === 2;
    const accessTokenExpiry = isAdmin ? '1d' : '365d';
    const cookieMaxAge = isAdmin ? 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );

    return { 
      accessToken: newAccessToken,
      cookieMaxAge 
    };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      try {
        await blacklistedTokenRepository.create({
          token: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
        });
      } catch (error) {
        // Ignore duplicate key errors
      }
    }
  }

  async verifyToken(accessToken) {
    if (!accessToken) {
      throw new BadRequestError('No access token provided');
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    if (decoded.type === 'refresh') {
      throw new BadRequestError('Invalid token type');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      role: user.role
    };
  }

  async getAllUsers(page = 1, limit = 50) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit) || 50, 100)); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const users = await userRepository.find({}, { skip, limit: limitNum });
    const total = await userRepository.countDocuments({});

    return {
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  async updateProfile(userId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await userRepository.updateById(userId, updateData);
    return this._sanitizeUser(updatedUser);
  }

  async updateUserRole(userId, role, currentUserId, currentUserRole) {
    if (role === undefined || role === null) {
      throw new BadRequestError('Role is required');
    }

    if (![0, 1, 2].includes(parseInt(role))) {
      throw new BadRequestError('Invalid role value. Must be 0 (User), 1 (Admin), or 2 (Super Admin)');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (currentUserId === userId && currentUserRole === 2) {
      throw new ForbiddenError('Super admin cannot change their own role');
    }

    const updatedUser = await userRepository.updateById(userId, { role: parseInt(role) });
    return this._sanitizeUser(updatedUser);
  }

  async changePassword(userId, oldPassword, newPassword, confirmPassword) {
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new BadRequestError('All password fields are required');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestError('New password and confirm password do not match');
    }

    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters long');
    }

    const user = await userRepository.findOneWithPassword({ _id: userId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestError('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updateById(userId, { password: hashedNewPassword });
  }

  async updateUsername(userId, newUsername) {
    if (!newUsername || newUsername.trim().length === 0) {
      throw new BadRequestError('Username is required');
    }

    const existingUser = await userRepository.findOne({ name: newUsername.trim() });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new BadRequestError('Username already exists');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await userRepository.updateById(userId, { name: newUsername.trim() });
    return this._sanitizeUser(updatedUser);
  }

  generateTokens(user, rememberMe = false) {
    // Admin users (role 1 or 2) get 1 day token expiration
    // Regular users get 365 days
    const isAdmin = user.role === 1 || user.role === 2;
    const accessTokenExpiry = isAdmin ? '1d' : '365d';
    const refreshTokenExpiry = isAdmin ? '1d' : '365d';
    const cookieMaxAge = isAdmin ? 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
    const refreshCookieMaxAge = isAdmin ? 24 * 60 * 60 * 1000 : (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;

    const accessToken = jwt.sign(
      { id: user._id || user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: user._id || user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: cookieMaxAge,
      },
      refreshCookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: refreshCookieMaxAge,
      }
    };
  }

  _sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : (user instanceof Object ? { ...user } : user);
    if (userObj && typeof userObj === 'object') {
      delete userObj.password;
    }
    return userObj;
  }
}

module.exports = new UserService();

