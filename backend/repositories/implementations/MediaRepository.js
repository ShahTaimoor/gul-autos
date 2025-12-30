const Media = require('../../models/Media');
const IMediaRepository = require('../interfaces/IMediaRepository');

class MediaRepository extends IMediaRepository {
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
    return await Media.findOne(query).lean();
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
    let queryBuilder = Media.find(mergedQuery);

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

  async create(mediaData) {
    const media = new Media(mediaData);
    return await media.save();
  }

  async deleteById(id) {
    // Soft delete: set isDeleted to true
    return await Media.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  }

  async deleteMany(filter) {
    // Soft delete: set isDeleted to true for all matching documents
    return await Media.updateMany(filter, { isDeleted: true });
  }

  async countDocuments(query, includeDeleted = false) {
    const mergedQuery = this._mergeQuery(query, includeDeleted);
    return await Media.countDocuments(mergedQuery);
  }
}

module.exports = MediaRepository;

