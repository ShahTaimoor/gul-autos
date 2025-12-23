class ICategoryRepository {
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findOne(query) {
    throw new Error('Method findOne must be implemented');
  }

  async find(query, options = {}) {
    throw new Error('Method find must be implemented');
  }

  async create(categoryData) {
    throw new Error('Method create must be implemented');
  }

  async updateOne(query, updateData) {
    throw new Error('Method updateOne must be implemented');
  }

  async deleteOne(query) {
    throw new Error('Method deleteOne must be implemented');
  }

  async countDocuments(query) {
    throw new Error('Method countDocuments must be implemented');
  }
}

module.exports = ICategoryRepository;

