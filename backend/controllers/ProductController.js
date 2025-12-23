const productService = require('../services/ProductService');
const productSearchService = require('../services/ProductSearchService');

class ProductController {
  async createProduct(req, res, next) {
    try {
      const productData = req.body;
      const userId = req.user.id;
      const file = req.file;

      const product = await productService.createProduct(productData, userId, file);

      return res.status(201).json({
        success: true,
        message: 'Product Added Successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  async importExcel(req, res, next) {
    try {
      const file = req.file;
      const userId = req.user.id;

      const results = await productService.importExcel(file.buffer, userId);

      return res.status(200).json({
        success: true,
        message: `Import completed. ${results.success} products created, ${results.failed} failed.`,
        results
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const file = req.file;

      const product = await productService.updateProduct(id, updateData, file);

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductStock(req, res, next) {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const product = await productService.updateProductStock(id, stock);

      return res.status(200).json({
        success: true,
        message: 'Product stock updated successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateFeatured(req, res, next) {
    try {
      const { productIds, isFeatured } = req.body;

      const result = await productService.bulkUpdateFeatured(productIds, isFeatured);

      return res.status(200).json({
        success: true,
        message: `Successfully ${result.featuredValue ? 'marked' : 'unmarked'} ${result.modifiedCount} product(s) as featured`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.deleteProduct(id);

      return res.status(200).json({
        success: true,
        message: 'Product Deleted Successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req, res, next) {
    try {
      const filters = req.query;

      const result = await productService.getProducts(filters);

      const message = result.data.length === 0
        ? 'No products found in this category.'
        : 'Products fetched successfully';

      return res.status(200).json({
        success: true,
        message,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req, res, next) {
    try {
      const { q, limit, page } = req.query;

      const result = await productSearchService.searchProducts(q, limit, page);

      const message = result.pagination.total > 0
        ? `Found ${result.pagination.total} product(s) matching all keywords`
        : 'No products found matching all keywords';

      return res.status(200).json({
        success: true,
        message,
        data: result.data,
        query: result.query,
        keywords: result.keywords,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getSearchSuggestions(req, res, next) {
    try {
      const { q, limit } = req.query;

      const result = await productSearchService.getSearchSuggestions(q, limit);

      return res.status(200).json({
        success: true,
        data: result.data,
        query: result.query,
        keywords: result.keywords
      });
    } catch (error) {
      next(error);
    }
  }

  async getSingleProduct(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.getSingleProduct(id);

      return res.status(200).json({
        success: true,
        message: 'Single product fetched successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockCount(req, res, next) {
    try {
      const count = await productService.getLowStockCount();

      return res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();

