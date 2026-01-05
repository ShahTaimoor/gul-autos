const User = require('../../models/User');
const IUserRepository = require('../interfaces/IUserRepository');

class UserRepository extends IUserRepository {
  // Helper method to merge isDeleted filter
  _mergeQuery(query, includeDeleted = false) {
    const mergedQuery = { ...query };
    if (!includeDeleted) {
      // Filter out deleted users: exclude where isDeleted is true
      // This works for both false and undefined (field doesn't exist)
      mergedQuery.isDeleted = { $ne: true };
    }
    return mergedQuery;
  }

  async findById(id, includeDeleted = false) {
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    return await User.findOne(query).lean();
  }

  async findByIdWithPassword(id, includeDeleted = false) {
    const query = this._mergeQuery({ _id: id }, includeDeleted);
    return await User.findOne(query).select('+password');
  }

  async findOne(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await User.findOne(mergedQuery).lean();
  }

  async findOneWithPassword(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await User.findOne(mergedQuery).select('+password');
  }

  async find(query = {}, options = {}, includeDeleted = false) {
    // Handle backward compatibility: if second param is boolean, it's includeDeleted
    if (typeof options === 'boolean') {
      includeDeleted = options;
      options = {};
    }

    const {
      sort = {},
      skip = 0,
      limit = null
    } = options;

    const mergedQuery = this._mergeQuery(query, includeDeleted);
    let queryBuilder = User.find(mergedQuery).select('-password');

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

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async save(user) {
    return await user.save();
  }

  async deleteById(id) {
    // Soft delete: set isDeleted to true
    return await User.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  }

  async countDocuments(query = {}, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await User.countDocuments(mergedQuery);
  }
}

module.exports = UserRepository;

