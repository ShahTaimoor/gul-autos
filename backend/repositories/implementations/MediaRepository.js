const Media = require('../../models/Media');
const IMediaRepository = require('../interfaces/IMediaRepository');

class MediaRepository extends IMediaRepository {
  async findById(id) {
    return await Media.findById(id).lean();
  }

  async find(query, options = {}) {
    const {
      populate = [],
      select,
      sort = {},
      skip = 0,
      limit = null
    } = options;

    let queryBuilder = Media.find(query);

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
    return await Media.findByIdAndDelete(id).lean();
  }

  async deleteMany(filter) {
    return await Media.deleteMany(filter);
  }

  async countDocuments(query) {
    return await Media.countDocuments(query);
  }
}

module.exports = MediaRepository;

