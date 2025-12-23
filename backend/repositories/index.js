const UserRepository = require('./implementations/UserRepository');
const ProductRepository = require('./implementations/ProductRepository');
const OrderRepository = require('./implementations/OrderRepository');
const CategoryRepository = require('./implementations/CategoryRepository');
const CartRepository = require('./implementations/CartRepository');
const MediaRepository = require('./implementations/MediaRepository');

module.exports = {
  userRepository: new UserRepository(),
  productRepository: new ProductRepository(),
  orderRepository: new OrderRepository(),
  categoryRepository: new CategoryRepository(),
  cartRepository: new CartRepository(),
  mediaRepository: new MediaRepository(),
};

