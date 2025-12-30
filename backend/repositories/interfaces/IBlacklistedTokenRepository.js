class IBlacklistedTokenRepository {
  async findOne(query) {
    throw new Error('Method not implemented');
  }

  async create(tokenData) {
    throw new Error('Method not implemented');
  }

  async countDocuments(query) {
    throw new Error('Method not implemented');
  }
}

module.exports = IBlacklistedTokenRepository;

