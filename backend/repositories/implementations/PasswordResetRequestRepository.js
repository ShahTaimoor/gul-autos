const PasswordResetRequest = require('../../models/PasswordResetRequest');

class PasswordResetRequestRepository {
  async create(data) {
    const request = new PasswordResetRequest(data);
    return await request.save();
  }

  async findById(id) {
    return await PasswordResetRequest.findById(id).lean();
  }

  async findOne(query) {
    return await PasswordResetRequest.findOne(query).lean();
  }

  async find(query = {}) {
    return await PasswordResetRequest.find(query)
      .populate('userId', 'name role username email')
      .populate('completedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateById(id, updateData) {
    return await PasswordResetRequest.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async countDocuments(query = {}) {
    return await PasswordResetRequest.countDocuments(query);
  }
}

module.exports = PasswordResetRequestRepository;

