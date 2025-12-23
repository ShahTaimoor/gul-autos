const mediaService = require('../services/MediaService');

class MediaController {
  async uploadImages(req, res, next) {
    try {
      const files = req.files;
      const userId = req.user.id;

      const result = await mediaService.uploadImages(files, userId);

      return res.status(200).json({
        success: true,
        message: `Successfully uploaded ${result.uploadedImages.length} images`,
        data: result.uploadedImages,
        errors: result.errors
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMedia(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await mediaService.getAllMedia(page, limit);

      return res.status(200).json({
        success: true,
        data: result.media,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      const result = await mediaService.deleteMedia(id);

      return res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteMedia(req, res, next) {
    try {
      const { ids } = req.body;
      const result = await mediaService.bulkDeleteMedia(ids);

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} media items`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();

