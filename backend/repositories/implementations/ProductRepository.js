const Product = require('../../models/Product');
const IProductRepository = require('../interfaces/IProductRepository');

class ProductRepository extends IProductRepository {
  async findById(id) {
    return await Product.findById(id).lean();
  }

  async findByIdWithPopulate(id, populateOptions) {
    const query = Product.findById(id);
    if (populateOptions) {
      populateOptions.forEach(option => {
        query.populate(option);
      });
    }
    return await query.lean();
  }

  async findOne(query) {
    return await Product.findOne(query).lean();
  }

  async find(query, options = {}) {
    const {
      select,
      populate = [],
      sort = {},
      skip = 0,
      limit = null
    } = options;

    let queryBuilder = Product.find(query);

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
    return await Product.findByIdAndDelete(id).lean();
  }

  async countDocuments(query) {
    return await Product.countDocuments(query);
  }

  async updateMany(filter, update) {
    return await Product.updateMany(filter, update);
  }
}

module.exports = ProductRepository;

