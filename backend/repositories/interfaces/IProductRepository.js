class IProductRepository {
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findOne(query) {
    throw new Error('Method findOne must be implemented');
  }

  async find(query, options = {}) {
    throw new Error('Method find must be implemented');
  }

  async create(productData) {
    throw new Error('Method create must be implemented');
  }

  async updateById(id, updateData) {
    throw new Error('Method updateById must be implemented');
  }

  async deleteById(id) {
    throw new Error('Method deleteById must be implemented');
  }

  async countDocuments(query) {
    throw new Error('Method countDocuments must be implemented');
  }

  async updateMany(filter, update) {
    throw new Error('Method updateMany must be implemented');
  }
}

module.exports = IProductRepository;

