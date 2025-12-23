const slugify = require('slugify');
const { categoryRepository } = require('../repositories');
const { uploadImageOnCloudinary, deleteImageOnCloudinary } = require('../utils/cloudinary');
const { BadRequestError, NotFoundError } = require('../errors');

class CategoryService {
  async normalizePositions() {
    try {
      const categories = await categoryRepository.find({}, { sort: { position: 1, createdAt: 1 } });
      for (let i = 0; i < categories.length; i++) {
        const expectedPosition = i + 1;
        if (categories[i].position !== expectedPosition) {
          await categoryRepository.updateOne(
            { _id: categories[i]._id },
            { position: expectedPosition }
          );
        }
      }
    } catch (error) {
      console.error('Error normalizing positions:', error);
    }
  }

  async createCategory(name, file) {
    if (!name) {
      throw new BadRequestError('Category name is required');
    }

    const existingCategory = await categoryRepository.findOne({
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingCategory) {
      throw new BadRequestError('Category already exists');
    }

    if (!file) {
      throw new BadRequestError('Category image is required');
    }

    const { secure_url, public_id } = await uploadImageOnCloudinary(file.buffer, 'products');

    if (!secure_url || !public_id) {
      throw new BadRequestError('Cloudinary upload failed');
    }

    const lastCategory = await categoryRepository.find({}, { sort: { position: -1 }, limit: 1 });
    const newPosition = lastCategory.length > 0 ? lastCategory[0].position + 1 : 1;

    const category = await categoryRepository.create({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      picture: { secure_url, public_id },
      position: newPosition,
      active: true
    });

    await this.normalizePositions();

    return category;
  }

  async updateCategory(slug, updateData, file) {
    const { name, position, active } = updateData;

    if (!name) {
      throw new BadRequestError('Category name is required');
    }

    if (position !== undefined) {
      const newPosition = parseInt(position);
      const existingCategoryWithPosition = await categoryRepository.findOne({
        position: newPosition,
        slug: { $ne: slug }
      });

      const currentCategory = await categoryRepository.findOne({ slug });
      const currentPosition = currentCategory?.position;

      if (existingCategoryWithPosition) {
        await categoryRepository.updateOne(
          { _id: existingCategoryWithPosition._id },
          { position: currentPosition || newPosition + 1000 }
        );
      }
    }

    const updateFields = {
      name,
      slug: slugify(name, { lower: true, strict: true })
    };

    if (position !== undefined) {
      updateFields.position = parseInt(position);
    }

    if (active !== undefined) {
      updateFields.active = active === 'true' || active === true;
    }

    const currentCategory = await categoryRepository.findOne({ slug });
    if (!currentCategory) {
      throw new NotFoundError('Category not found');
    }

    if (file) {
      const { secure_url, public_id } = await uploadImageOnCloudinary(file.buffer, 'products');

      if (currentCategory.picture && currentCategory.picture.public_id) {
        await deleteImageOnCloudinary(currentCategory.picture.public_id);
      }

      updateFields.picture = { secure_url, public_id };
    }

    const updatedCategory = await categoryRepository.updateOne({ slug }, updateFields);

    await this.normalizePositions();

    return updatedCategory;
  }

  async deleteCategory(slug) {
    const category = await categoryRepository.findOne({ slug });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.picture && category.picture.public_id) {
      await deleteImageOnCloudinary(category.picture.public_id);
    }

    await categoryRepository.deleteOne({ slug });

    await this.normalizePositions();

    return category;
  }

  async getAllCategories(search) {
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { slug: searchRegex }
      ];
    }

    const categories = await categoryRepository.find(query, {
      sort: { position: 1, createdAt: -1 }
    });

    return categories.map(category => {
      const categoryObj = { ...category };
      categoryObj.image = categoryObj.picture?.secure_url || null;
      delete categoryObj.picture;
      return categoryObj;
    });
  }

  async getSingleCategory(slug) {
    const category = await categoryRepository.findOne({ slug });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async toggleCategoryActive(slug) {
    const category = await categoryRepository.findOne({ slug });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const updatedCategory = await categoryRepository.updateOne(
      { slug },
      { active: !category.active }
    );

    return updatedCategory;
  }
}

module.exports = new CategoryService();

