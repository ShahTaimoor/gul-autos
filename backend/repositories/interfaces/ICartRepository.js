class ICartRepository {
  async findOne(query) {
    throw new Error('Method findOne must be implemented');
  }

  async create(cartData) {
    throw new Error('Method create must be implemented');
  }

  async save(cart) {
    throw new Error('Method save must be implemented');
  }

  async updateOne(query, updateData) {
    throw new Error('Method updateOne must be implemented');
  }
}

module.exports = ICartRepository;

