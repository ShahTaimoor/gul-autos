const BlacklistedToken = require('../../models/BlacklistedToken');
const IBlacklistedTokenRepository = require('../interfaces/IBlacklistedTokenRepository');

class BlacklistedTokenRepository extends IBlacklistedTokenRepository {
  // Helper method to merge isDeleted filter
  _mergeQuery(query, includeDeleted = false) {
    const mergedQuery = { ...query };
    if (!includeDeleted) {
      mergedQuery.isDeleted = { $ne: true };
    }
    return mergedQuery;
  }

  async findOne(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await BlacklistedToken.findOne(mergedQuery).lean();
  }

  async create(tokenData) {
    const token = new BlacklistedToken(tokenData);
    return await token.save();
  }

  async countDocuments(query = {}, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await BlacklistedToken.countDocuments(mergedQuery);
  }
}

module.exports = BlacklistedTokenRepository;

