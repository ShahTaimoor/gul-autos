const User = require('../../models/User');
const IUserRepository = require('../interfaces/IUserRepository');

class UserRepository extends IUserRepository {
  async findById(id) {
    return await User.findById(id).lean();
  }

  async findByIdWithPassword(id) {
    return await User.findById(id).select('+password');
  }

  async findOne(query) {
    return await User.findOne(query).lean();
  }

  async findOneWithPassword(query) {
    return await User.findOne(query).select('+password');
  }

  async find(query = {}) {
    return await User.find(query).select('-password').lean();
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async save(user) {
    return await user.save();
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id).lean();
  }

  async countDocuments(query = {}) {
    return await User.countDocuments(query);
  }
}

module.exports = UserRepository;

