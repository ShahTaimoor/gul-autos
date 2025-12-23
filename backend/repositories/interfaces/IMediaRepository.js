class IMediaRepository {
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async find(query, options = {}) {
    throw new Error('Method find must be implemented');
  }

  async create(mediaData) {
    throw new Error('Method create must be implemented');
  }

  async deleteById(id) {
    throw new Error('Method deleteById must be implemented');
  }

  async deleteMany(filter) {
    throw new Error('Method deleteMany must be implemented');
  }

  async countDocuments(query) {
    throw new Error('Method countDocuments must be implemented');
  }
}

module.exports = IMediaRepository;

