const categoryService = require('../services/CategoryService');

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const { name } = req.body;
      const file = req.file;

      const category = await categoryService.createCategory(name, file);

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { slug } = req.params;
      const updateData = req.body;
      const file = req.file;

      const category = await categoryService.updateCategory(slug, updateData, file);

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { slug } = req.params;

      const category = await categoryService.deleteCategory(slug);

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res, next) {
    try {
      const { search } = req.query;

      const categories = await categoryService.getAllCategories(search);

      return res.status(200).json({
        success: true,
        message: categories.length > 0 ? 'Categories fetched successfully' : 'No categories found',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  async getSingleCategory(req, res, next) {
    try {
      const { slug } = req.params;

      const category = await categoryService.getSingleCategory(slug);

      return res.status(200).json({
        success: true,
        message: 'Single category fetched successfully',
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleCategoryActive(req, res, next) {
    try {
      const { slug } = req.params;

      const category = await categoryService.toggleCategoryActive(slug);

      return res.status(200).json({
        success: true,
        message: `Category ${category.active ? 'activated' : 'deactivated'} successfully`,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();

