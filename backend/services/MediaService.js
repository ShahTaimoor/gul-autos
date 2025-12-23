const { mediaRepository } = require('../repositories');
const { uploadImageOnCloudinary } = require('../utils/cloudinary');
const { BadRequestError, NotFoundError } = require('../errors');

class MediaService {
  async uploadImages(files, userId) {
    if (!files || files.length === 0) {
      throw new BadRequestError('No images provided');
    }

    const uploadedImages = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\.[^/.]+$/, '');
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedName}_${timestamp}`;

        const { secure_url, public_id } = await uploadImageOnCloudinary(
          file.buffer,
          'media',
          {
            public_id: fileName,
            resource_type: 'image'
          }
        );

        if (secure_url && public_id) {
          const mediaDoc = await mediaRepository.create({
            name: originalName,
            originalName: file.originalname,
            url: secure_url,
            public_id: public_id,
            size: file.size,
            type: file.mimetype,
            uploadedBy: userId
          });

          uploadedImages.push({
            id: mediaDoc._id,
            name: mediaDoc.name,
            url: mediaDoc.url,
            public_id: mediaDoc.public_id,
            size: mediaDoc.size,
            type: mediaDoc.type,
            uploadedAt: mediaDoc.createdAt
          });
        } else {
          errors.push({
            fileName: file.originalname,
            error: 'Failed to upload to Cloudinary'
          });
        }
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    if (uploadedImages.length === 0) {
      throw new BadRequestError('Failed to upload any images');
    }

    return {
      uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async getAllMedia(page = 1, limit = 2000) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const media = await mediaRepository.find(
      {},
      {
        populate: [{ path: 'uploadedBy', select: 'name email' }],
        sort: { createdAt: -1 },
        skip,
        limit: limitNum
      }
    );

    const total = await mediaRepository.countDocuments({});

    return {
      media,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    };
  }

  async deleteMedia(id) {
    if (!id) {
      throw new BadRequestError('Media ID is required');
    }

    const media = await mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundError('Media not found');
    }

    await mediaRepository.deleteById(id);

    return {
      id: media._id,
      name: media.name
    };
  }

  async bulkDeleteMedia(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('Media IDs array is required');
    }

    const mediaItems = await mediaRepository.find({ _id: { $in: ids } });

    if (mediaItems.length === 0) {
      throw new NotFoundError('No media items found');
    }

    const result = await mediaRepository.deleteMany({ _id: { $in: ids } });

    return {
      deletedCount: result.deletedCount,
      requestedCount: ids.length,
      deletedIds: mediaItems.map(item => item._id)
    };
  }
}

module.exports = new MediaService();

