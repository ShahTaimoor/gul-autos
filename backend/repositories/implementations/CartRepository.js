const Cart = require('../../models/Cart');
const ICartRepository = require('../interfaces/ICartRepository');

class CartRepository extends ICartRepository {
  async findOne(query) {
    return await Cart.findOne(query);
  }

  async findOneWithPopulate(query, populateOptions) {
    const queryBuilder = Cart.findOne(query);
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
}

module.exports = CartRepository;

