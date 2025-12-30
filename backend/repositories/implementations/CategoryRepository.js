const Category = require('../../models/Category');
const ICategoryRepository = require('../interfaces/ICategoryRepository');

class CategoryRepository extends ICategoryRepository {
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
    return await Category.findOne(query).lean();
  }

  async findOne(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Category.findOne(mergedQuery).lean();
  }

  async find(query, options = {}, includeDeleted = false) {
    const { sort = {}, limit = null } = options;
    const mergedQuery = this._mergeQuery(query, includeDeleted);

    let queryBuilder = Category.find(mergedQuery);

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
    // Soft delete: set isDeleted to true
    return await Category.findOneAndUpdate(query, { isDeleted: true }, { new: true }).lean();
  }

  async countDocuments(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Category.countDocuments(mergedQuery);
  }
}

module.exports = CategoryRepository;

