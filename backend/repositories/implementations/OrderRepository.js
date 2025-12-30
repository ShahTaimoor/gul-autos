const Order = require('../../models/Order');
const IOrderRepository = require('../interfaces/IOrderRepository');

class OrderRepository extends IOrderRepository {
  // Helper method to merge isDeleted filter
  _mergeQuery(query, includeDeleted = false) {
    const mergedQuery = { ...query };
    if (!includeDeleted) {
      mergedQuery.isDeleted = { $ne: true };
    }
    return mergedQuery;
  }

  async findById(id, includeDeleted = false) {
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    return await Order.findOne(query).lean();
  }

  async findByIdWithPopulate(id, populateOptions, includeDeleted = false) {
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    let queryBuilder = Order.findOne(query);
    if (populateOptions) {
      populateOptions.forEach(option => {
        queryBuilder = queryBuilder.populate(option);
      });
    }
    return await queryBuilder.lean();
  }

  async findOne(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Order.findOne(mergedQuery).lean();
  }

  async find(query, options = {}, includeDeleted = false) {
    const {
      populate = [],
      select,
      sort = {},
      skip = 0,
      limit = null
    } = options;

    const mergedQuery = this._mergeQuery(query, includeDeleted);
    let queryBuilder = Order.find(mergedQuery);

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
    // Soft delete: set isDeleted to true
    return await Order.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  }

  async deleteMany(filter) {
    // Soft delete: set isDeleted to true for all matching documents
    return await Order.updateMany(filter, { isDeleted: true });
  }

  async countDocuments(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Order.countDocuments(mergedQuery);
  }
}

module.exports = OrderRepository;

