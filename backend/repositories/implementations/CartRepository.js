const Cart = require('../../models/Cart');
const ICartRepository = require('../interfaces/ICartRepository');

class CartRepository extends ICartRepository {
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
    return await Cart.findOne(mergedQuery);
  }

  async findOneWithPopulate(query, populateOptions, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    const queryBuilder = Cart.findOne(mergedQuery);
    if (populateOptions) {
      populateOptions.forEach(option => {
        queryBuilder.populate(option);
      });
    }
    return await queryBuilder;
  }

  async create(cartData) {
    const cart = new Cart(cartData);
    return await cart.save();
  }

  async save(cart) {
    return await cart.save();
  }

  async updateOne(query, updateData) {
    return await Cart.findOneAndUpdate(query, updateData, { new: true });
  }

  async deleteOne(query) {
    // Soft delete: set isDeleted to true
    return await Cart.findOneAndUpdate(query, { isDeleted: true }, { new: true });
  }
}

module.exports = CartRepository;

