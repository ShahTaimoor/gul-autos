const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userRepository } = require('../repositories');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../errors');

class SecureUserService {
  async signup(userData) {
    const { name, password, phone, username, address, city } = userData;

    const existingUser = await userRepository.findOne({ name });
    if (existingUser) {
      throw new BadRequestError('User with this name already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      name,
      password: hashedPassword,
      phone: phone || undefined,
      username: username || undefined,
      address: address || undefined,
      city: city || undefined
    });

    return this._sanitizeUser(user);
  }

  async login(name, password) {
    const user = await userRepository.findOneWithPassword({ name });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this._sanitizeUser(user);
  }

  async updateProfile(userId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateFields = {};
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.phone) updateFields.phone = updateData.phone;
    if (updateData.username !== undefined) updateFields.username = updateData.username || undefined;
    if (updateData.address !== undefined) updateFields.address = updateData.address || undefined;
    if (updateData.city !== undefined) updateFields.city = updateData.city || undefined;

    const updatedUser = await userRepository.updateById(userId, updateFields);
    return this._sanitizeUser(updatedUser);
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this._sanitizeUser(user);
  }

  generateToken(user) {
    return jwt.sign(
      { userId: user._id || user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
  }

  _sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : (user instanceof Object ? { ...user } : user);
    if (userObj && typeof userObj === 'object') {
      delete userObj.password;
    }
    return userObj;
  }
}

module.exports = new SecureUserService();

