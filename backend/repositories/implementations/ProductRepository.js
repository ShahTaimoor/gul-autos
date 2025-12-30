const mongoose = require('mongoose');
const Product = require('../../models/Product');
const IProductRepository = require('../interfaces/IProductRepository');

class ProductRepository extends IProductRepository {
  // Helper method to merge isDeleted filter
  _mergeQuery(query, includeDeleted = false) {
    const mergedQuery = { ...query };
    if (!includeDeleted) {
      mergedQuery.isDeleted = { $ne: true };
    }
    return mergedQuery;
  }

  async findById(id, includeDeleted = false) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    return await Product.findOne(query).lean();
  }

  async findByIdWithPopulate(id, populateOptions, includeDeleted = false) {
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    let queryBuilder = Product.findOne(query);
    if (populateOptions) {
      populateOptions.forEach(option => {
        queryBuilder = queryBuilder.populate(option);
      });
    }
    return await queryBuilder.lean();
  }

  async findOne(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Product.findOne(mergedQuery).lean();
  }

  async find(query, options = {}, includeDeleted = false) {
    const {
      select,
      populate = [],
      sort = {},
      skip = 0,
      limit = null
    } = options;

    const mergedQuery = this._mergeQuery(query, includeDeleted);
    let queryBuilder = Product.find(mergedQuery);

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

  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  async updateById(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async save(product) {
    return await product.save();
  }

  async deleteById(id) {
    // Soft delete: set isDeleted to true
    return await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  }

  async countDocuments(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Product.countDocuments(mergedQuery);
  }

  async updateMany(filter, update) {
    return await Product.updateMany(filter, update);
  }
}

module.exports = ProductRepository;

