const express = require('express');
const categoryController = require('../controllers/CategoryController');
const { isAuthorized, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
const validate = require('../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  getAllCategoriesQuerySchema
} = require('../validators/categoryValidators');

const router = express.Router();

router.post(
  '/create-category',
  upload.single('picture'),
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/update-category/:slug',
  upload.single('picture'),
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/delete-category/:slug',
  isAuthorized,
  isAdminOrSuperAdmin,
  categoryController.deleteCategory
);

router.get(
  '/all-category',
  validate(getAllCategoriesQuerySchema, 'query'),
  categoryController.getAllCategories
);

router.get(
  '/single-category/:slug',
  categoryController.getSingleCategory
);

router.patch(
  '/toggle-category-active/:slug',
  isAuthorized,
  isAdminOrSuperAdmin,
  categoryController.toggleCategoryActive
);

module.exports = router;
