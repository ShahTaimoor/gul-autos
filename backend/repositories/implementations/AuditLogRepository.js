const AuditLog = require('../../models/AuditLog');

class AuditLogRepository {
  async create(data) {
    const log = new AuditLog(data);
    return await log.save();
  }

  async find(query = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
    return await AuditLog.find(query)
      .populate('performedBy', 'name role')
      .populate('targetUser', 'name role')
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();
  }

  async countDocuments(query = {}) {
    return await AuditLog.countDocuments(query);
  }
}

module.exports = AuditLogRepository;

