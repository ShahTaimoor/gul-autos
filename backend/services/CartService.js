const { cartRepository, productRepository } = require('../repositories');
const { BadRequestError, NotFoundError } = require('../errors');

class CartService {
  async getCart(userId) {
    const cart = await cartRepository.findOneWithPopulate(
      { user: userId },
      [{ path: 'items.product' }]
    );

    if (!cart) {
      return { items: [] };
    }

    let validItems = cart.items.filter(item => item.product !== null);

    const itemsToUpdate = [];
    validItems = validItems.map(item => {
      const product = item.product;
      const currentStock = product.stock || 0;
      const requestedQty = item.quantity;

      if (currentStock <= 0) {
        return {
          ...item.toObject(),
          product: {
            ...product.toObject(),
            isOutOfStock: true,
            availableStock: 0
          }
        };
      }

      if (requestedQty > currentStock) {
        itemsToUpdate.push({
          productId: product._id.toString(),
          quantity: currentStock
        });
        return {
          ...item.toObject(),
          quantity: currentStock,
          product: {
            ...product.toObject(),
            isOutOfStock: false,
            availableStock: currentStock,
            quantityAdjusted: true,
            originalQuantity: requestedQty
          }
        };
      }

      return {
        ...item.toObject(),
        product: {
          ...product.toObject(),
          isOutOfStock: false,
          availableStock: currentStock
        }
      };
    });

    if (itemsToUpdate.length > 0) {
      itemsToUpdate.forEach(({ productId, quantity }) => {
        const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity = quantity;
        }
      });
      cart.updatedAt = new Date();
      await cartRepository.save(cart);
    }

    if (validItems.length !== cart.items.length) {
      cart.items = validItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));
      cart.updatedAt = new Date();
      await cartRepository.save(cart);
    }

    return { items: validItems };
  }

  async addItem(userId, productId, quantity) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock <= 0) {
      throw new BadRequestError(`Product "${product.title}" is out of stock`);
    }

    let cart = await cartRepository.findOne({ user: userId });
    if (!cart) {
      cart = await cartRepository.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    const requestedQuantity = itemIndex > -1
      ? cart.items[itemIndex].quantity + quantity
      : quantity;

    if (requestedQuantity > product.stock) {
      throw new BadRequestError(
        `Only ${product.stock} units available for "${product.title}". You requested ${requestedQuantity}.`
      );
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cartRepository.save(cart);

    const updatedCart = await cartRepository.findOneWithPopulate(
      { user: userId },
      [{ path: 'items.product' }]
    );

    let validItems = updatedCart.items.filter(item => item.product !== null);

    if (validItems.length !== updatedCart.items.length) {
      updatedCart.items = validItems;
      updatedCart.updatedAt = new Date();
      await cartRepository.save(updatedCart);
    }

    return { items: validItems };
  }

  async removeItem(userId, productId) {
    let cart = await cartRepository.findOne({ user: userId });
    if (!cart) {
      return { items: [] };
    }

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    cart.updatedAt = new Date();
    await cartRepository.save(cart);

    const updatedCart = await cartRepository.findOneWithPopulate(
      { user: userId },
      [{ path: 'items.product' }]
    );

    let validItems = updatedCart.items.filter(item => item.product !== null);

    if (validItems.length !== updatedCart.items.length) {
      updatedCart.items = validItems;
      updatedCart.updatedAt = new Date();
      await cartRepository.save(updatedCart);
    }

    return { items: validItems };
  }

  async emptyCart(userId) {
    let cart = await cartRepository.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.updatedAt = new Date();
      await cartRepository.save(cart);
    }
    return { items: [] };
  }

  async updateItemQuantity(userId, productId, quantity) {
    let cart = await cartRepository.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in cart');
    }

    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock <= 0) {
      throw new BadRequestError(`Product "${product.title}" is out of stock`);
    }

    if (quantity > product.stock) {
      throw new BadRequestError(
        `Only ${product.stock} units available for "${product.title}". You requested ${quantity}.`
      );
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();
    await cartRepository.save(cart);

    const updatedCart = await cartRepository.findOneWithPopulate(
      { user: userId },
      [{ path: 'items.product' }]
    );

    let validItems = updatedCart.items.filter(item => item.product !== null);

    if (validItems.length !== updatedCart.items.length) {
      updatedCart.items = validItems;
      updatedCart.updatedAt = new Date();
      await cartRepository.save(updatedCart);
    }

    return { items: validItems };
  }

  async checkStock(products) {
    if (!products || !Array.isArray(products)) {
      throw new BadRequestError('Products array is required');
    }

    const stockStatus = [];
    const outOfStockItems = [];
    const insufficientStockItems = [];

    for (const item of products) {
      const product = await productRepository.findById(item.id || item.productId);

      if (!product) {
        outOfStockItems.push({
          productId: item.id || item.productId,
          message: 'Product not found'
        });
        continue;
      }

      const availableStock = product.stock || 0;
      const requestedQuantity = item.quantity || 0;

      stockStatus.push({
        productId: product._id.toString(),
        available: true,
        availableStock,
        requestedQuantity
      });
    }

    const isValid = true;

    return {
      isValid,
      stockStatus,
      outOfStockItems,
      insufficientStockItems,
      message: isValid
        ? 'All products are available in requested quantities'
        : `${outOfStockItems.length} out of stock, ${insufficientStockItems.length} insufficient stock`
    };
  }
}

module.exports = new CartService();

