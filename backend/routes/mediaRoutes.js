const express = require('express');
const multer = require('multer');
const mediaController = require('../controllers/MediaController');
const { isAuthorized, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/security');
const validate = require('../middleware/validate');
const {
  getAllMediaQuerySchema,
  bulkDeleteMediaSchema
} = require('../validators/mediaValidators');

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported image format. Please use JPEG, PNG, or WebP'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
});

router.get('/media/test', (req, res) => {
  res.json({ success: true, message: 'Media routes are working' });
});

router.post(
  '/media/upload',
  uploadLimiter,
  isAuthorized,
  isAdminOrSuperAdmin,
  upload.array('images', 10),
  mediaController.uploadImages
);

router.get(
  '/media',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(getAllMediaQuerySchema, 'query'),
  mediaController.getAllMedia
);

router.delete(
  '/media/bulk',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(bulkDeleteMediaSchema),
  mediaController.bulkDeleteMedia
);

router.delete(
  '/media/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  mediaController.deleteMedia
);

module.exports = router;
