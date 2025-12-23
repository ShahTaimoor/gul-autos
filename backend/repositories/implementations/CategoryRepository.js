const Category = require('../../models/Category');
const ICategoryRepository = require('../interfaces/ICategoryRepository');

class CategoryRepository extends ICategoryRepository {
  async findById(id) {
    return await Category.findById(id).lean();
  }

  async findOne(query) {
    return await Category.findOne(query).lean();
  }

  async find(query, options = {}) {
    const { sort = {}, limit = null } = options;

    let queryBuilder = Category.find(query);

    if (Object.keys(sort).length > 0) {
      queryBuilder = queryBuilder.sort(sort);
    }

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    return await queryBuilder.lean();
  }

  async create(categoryData) {
    const category = new Category(categoryData);
    return await category.save();
  }

  async updateOne(query, updateData) {
    return await Category.findOneAndUpdate(query, updateData, { new: true }).lean();
  }

  async save(category) {
    return await category.save();
  }

  async deleteOne(query) {
    return await Category.findOneAndDelete(query).lean();
  }

  async countDocuments(query) {
    return await Category.countDocuments(query);
  }
}

module.exports = CategoryRepository;

