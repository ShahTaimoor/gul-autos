const Order = require('../../models/Order');
const IOrderRepository = require('../interfaces/IOrderRepository');

class OrderRepository extends IOrderRepository {
  async findById(id) {
    return await Order.findById(id).lean();
  }

  async findByIdWithPopulate(id, populateOptions) {
    const query = Order.findById(id);
    if (populateOptions) {
      populateOptions.forEach(option => {
        query.populate(option);
      });
    }
    return await query.lean();
  }

  async findOne(query) {
    return await Order.findOne(query).lean();
  }

  async find(query, options = {}) {
    const {
      populate = [],
      select,
      sort = {},
      skip = 0,
      limit = null
    } = options;

    let queryBuilder = Order.find(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    populate.forEach(option => {
      queryBuilder = queryBuilder.populate(option);
    });

    if (Object.keys(sort).length > 0) {
      queryBuilder = queryBuilder.sort(sort);
    }

    if (skip > 0) {
      queryBuilder = queryBuilder.skip(skip);
    }

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    return await queryBuilder.lean();
  }

  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  async updateById(id, updateData) {
    return await Order.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async deleteById(id) {
    return await Order.findByIdAndDelete(id).lean();
  }

  async deleteMany(filter) {
    return await Order.deleteMany(filter);
  }

  async countDocuments(query) {
    return await Order.countDocuments(query);
  }
}

module.exports = OrderRepository;

