const express = require('express');
const productController = require('../controllers/ProductController');
const { isAuthorized, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
const validate = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  updateProductStockSchema,
  bulkUpdateFeaturedSchema,
  getProductsQuerySchema,
  searchQuerySchema,
  searchSuggestionsQuerySchema
} = require('../validators/productValidators');

const router = express.Router();

router.post(
  '/create-product',
  isAuthorized,
  isAdminOrSuperAdmin,
  upload.single('picture'),
  validate(createProductSchema),
  productController.createProduct
);

router.post(
  '/import-excel',
  isAuthorized,
  isAdminOrSuperAdmin,
  upload.single('excelFile'),
  productController.importExcel
);

router.put(
  '/update-product/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  upload.single('picture'),
  validate(updateProductSchema),
  productController.updateProduct
);

router.put(
  '/update-product-stock/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(updateProductStockSchema),
  productController.updateProductStock
);

router.put(
  '/bulk-update-featured',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(bulkUpdateFeaturedSchema),
  productController.bulkUpdateFeatured
);

router.delete(
  '/delete-product/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  productController.deleteProduct
);

router.get(
  '/get-products',
  validate(getProductsQuerySchema, 'query'),
  productController.getProducts
);

router.get(
  '/search',
  validate(searchQuerySchema, 'query'),
  productController.searchProducts
);

router.get(
  '/search-suggestions',
  validate(searchSuggestionsQuerySchema, 'query'),
  productController.getSearchSuggestions
);

router.get(
  '/single-product/:id',
  productController.getSingleProduct
);

router.get(
  '/low-stock-count',
  productController.getLowStockCount
);

module.exports = router;
