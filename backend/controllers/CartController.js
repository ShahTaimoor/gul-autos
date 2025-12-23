const cartService = require('../services/CartService');

class CartController {
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await cartService.getCart(userId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;
      const result = await cartService.addItem(userId, productId, quantity);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.body;
      const result = await cartService.removeItem(userId, productId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async emptyCart(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await cartService.emptyCart(userId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateItemQuantity(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;
      const result = await cartService.updateItemQuantity(userId, productId, quantity);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkStock(req, res, next) {
    try {
      const { products } = req.body;
      const result = await cartService.checkStock(products);
      return res.json({
        success: result.isValid,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();

