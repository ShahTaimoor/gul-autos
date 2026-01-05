const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userRepository, blacklistedTokenRepository, passwordResetRequestRepository, auditLogRepository } = require('../repositories');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../errors');
const logger = require('../utils/logger');

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

  async refreshToken(refreshToken, rememberMe = false) {
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

    // Check if token is blacklisted
    const blacklisted = await blacklistedTokenRepository.findOne({ token: refreshToken });
    if (blacklisted) {
      throw new BadRequestError('Refresh token invalidated');
    }

    // TOKEN ROTATION: Blacklist the old refresh token
    try {
      await blacklistedTokenRepository.create({
        token: refreshToken,
        expiresAt: new Date(decoded.exp * 1000) // Use token's expiration time
      });
    } catch (error) {
      // Ignore duplicate key errors (token already blacklisted)
      // This can happen in race conditions
    }

    // Admin users (role 1 or 2) get 1 day token expiration
    // Regular users get 365 days
    const isAdmin = user.role === 1 || user.role === 2;
    const accessTokenExpiry = isAdmin ? '1d' : '365d';
    const refreshTokenExpiry = isAdmin ? '1d' : '365d';
    const cookieMaxAge = isAdmin ? 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
    const refreshCookieMaxAge = isAdmin ? 24 * 60 * 60 * 1000 : (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );

    // TOKEN ROTATION: Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    return { 
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      cookieMaxAge,
      refreshCookieMaxAge
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

    // Return full sanitized user object for state restoration
    return this._sanitizeUser(user);
  }

  async getAllUsers(page = 1, limit = 50) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit) || 50, 100)); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Explicitly exclude deleted users (includeDeleted = false by default, but being explicit)
    const users = await userRepository.find({}, { skip, limit: limitNum }, false);
    // Filter out any deleted users as a safety measure (shouldn't be needed, but extra safety)
    const activeUsers = users.filter(user => !user.isDeleted);
    const total = await userRepository.countDocuments({});

    return {
      users: activeUsers,
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

    // Prevent creating more than one super admin
    if (parseInt(role) === 2) {
      const existingSuperAdmin = await userRepository.findOne({ role: 2 });
      if (existingSuperAdmin && existingSuperAdmin._id.toString() !== userId) {
        throw new ForbiddenError('Only one super admin is allowed. There is already a super admin in the system.');
      }
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

  async deleteUser(userId, currentUserId, currentUserRole) {
    // Check if user exists (including deleted users) to avoid "not found" error
    const user = await userRepository.findById(userId, true); // includeDeleted = true
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If user is already deleted, return success (idempotent operation)
    if (user.isDeleted) {
      return { success: true, message: 'User already deleted' };
    }

    // Prevent deleting own account
    if (currentUserId === userId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    // Only super admin can delete users
    if (currentUserRole !== 2) {
      throw new ForbiddenError('Only super admin can delete users');
    }

    // Prevent deleting other super admins (only super admin can delete, but not other super admins)
    if (user.role === 2) {
      throw new ForbiddenError('Cannot delete super admin accounts');
    }

    await userRepository.deleteById(userId);
    return { success: true };
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

  async requestPasswordReset(adminName) {
    // Only admins (role 1) can request password reset
    const admin = await userRepository.findOne({ name: adminName.trim() });
    
    if (!admin) {
      throw new NotFoundError('Admin not found');
    }

    if (admin.role !== 1) {
      throw new ForbiddenError('Only admin users can request password reset');
    }

    // Check if there's already a pending request
    const existingRequest = await passwordResetRequestRepository.findOne({
      userId: admin._id,
      status: 'pending'
    });

    if (existingRequest) {
      throw new BadRequestError('A password reset request is already pending. Please wait for Super Admin to process it.');
    }

    // Create password reset request
    const resetRequest = await passwordResetRequestRepository.create({
      userId: admin._id,
      requestedBy: admin.name,
      status: 'pending'
    });

    // Notify Super Admin (find super admin)
    const superAdmin = await userRepository.findOne({ role: 2 });
    
    if (superAdmin) {
      // Log the request
      logger.info('Password reset requested', {
        adminId: admin._id,
        adminName: admin.name,
        superAdminId: superAdmin._id,
        requestId: resetRequest._id
      });

      // In a real application, you would send an email notification here
      // For now, we'll just log it and the Super Admin can see it in the dashboard
    }

    return {
      success: true,
      message: 'Password reset request submitted. Super Admin will be notified.',
      requestId: resetRequest._id
    };
  }

  async getPendingPasswordResetRequests() {
    const requests = await passwordResetRequestRepository.find({
      status: 'pending',
      isDeleted: { $ne: true }
    });

    return requests;
  }

  async resetAdminPassword(requestId, newPassword, superAdminId, ipAddress, userAgent) {
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }

    // Get the reset request
    const resetRequest = await passwordResetRequestRepository.findById(requestId);
    if (!resetRequest) {
      throw new NotFoundError('Password reset request not found');
    }

    if (resetRequest.status !== 'pending') {
      throw new BadRequestError('This password reset request has already been processed');
    }

    // Get the admin user
    const admin = await userRepository.findById(resetRequest.userId);
    if (!admin) {
      throw new NotFoundError('Admin user not found');
    }

    if (admin.role !== 1) {
      throw new ForbiddenError('Can only reset passwords for admin users');
    }

    // Get super admin
    const superAdmin = await userRepository.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== 2) {
      throw new ForbiddenError('Only Super Admin can reset admin passwords');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await userRepository.updateById(admin._id, { password: hashedPassword });

    // Update reset request status
    await passwordResetRequestRepository.updateById(requestId, {
      status: 'completed',
      completedAt: new Date(),
      completedBy: superAdminId
    });

    // Create audit log
    await auditLogRepository.create({
      action: 'password_reset',
      performedBy: superAdminId,
      targetUser: admin._id,
      details: {
        requestId: requestId,
        adminName: admin.name,
        superAdminName: superAdmin.name
      },
      ipAddress,
      userAgent
    });

    logger.info('Admin password reset completed', {
      adminId: admin._id,
      adminName: admin.name,
      superAdminId: superAdminId,
      requestId: requestId
    });

    return {
      success: true,
      message: 'Admin password has been reset successfully',
      admin: {
        id: admin._id,
        name: admin.name
      }
    };
  }

  async getAuditLogs(filters = {}, options = {}) {
    const logs = await auditLogRepository.find(filters, options);
    const total = await auditLogRepository.countDocuments(filters);
    
    return {
      logs,
      total
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

