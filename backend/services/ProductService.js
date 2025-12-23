const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { productRepository, categoryRepository } = require('../repositories');
const { uploadImageOnCloudinary, deleteImageOnCloudinary } = require('../utils/cloudinary');
const { BadRequestError, NotFoundError } = require('../errors');

class ProductService {
  async createProduct(productData, userId, file) {
    const { title, description, price, category, stock, isFeatured } = productData;

    if (!title || !price || !category || !stock || !file) {
      throw new BadRequestError('All fields are required including image');
    }

    const existingProduct = await productRepository.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
    });

    if (existingProduct) {
      throw new BadRequestError('Product with this name already exists');
    }

    const { secure_url, public_id } = await uploadImageOnCloudinary(file.buffer, 'products');

    if (!secure_url || !public_id) {
      throw new BadRequestError('Cloudinary upload failed');
    }

    return await productRepository.create({
      title,
      description,
      price,
      category,
      stock,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      user: userId,
      picture: { secure_url, public_id }
    });
  }

  async importExcel(fileBuffer, userId) {
    if (!fileBuffer) {
      throw new BadRequestError('Excel file is required');
    }

    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ''
    });

    if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
      const headers = jsonData[0];
      const headerMap = {};

      headers.forEach((header, index) => {
        if (header) {
          const cleanHeader = header.toString().toLowerCase().trim();
          if (cleanHeader.includes('name') || cleanHeader === 'name') {
            headerMap[index] = 'name';
          } else if (cleanHeader.includes('stock') || cleanHeader === 'stock') {
            headerMap[index] = 'stock';
          } else if (cleanHeader.includes('price') || cleanHeader === 'price') {
            headerMap[index] = 'price';
          }
        }
      });

      if (Object.keys(headerMap).length === 0) {
        for (let i = 0; i < Math.min(3, jsonData.length); i++) {
          const row = jsonData[i];
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell && typeof cell === 'string') {
              const cleanCell = cell.toLowerCase().trim();
              if (cleanCell.includes('steering') || cleanCell.includes('lock') || cleanCell.includes('product')) {
                if (!headerMap[j]) headerMap[j] = 'name';
              } else if (!isNaN(parseFloat(cell)) && parseFloat(cell) > 1000) {
                if (!headerMap[j]) headerMap[j] = 'stock';
              } else if (!isNaN(parseFloat(cell)) && parseFloat(cell) < 10000) {
                if (!headerMap[j]) headerMap[j] = 'price';
              }
            }
          }
        }
      }

      jsonData = jsonData.slice(1).map(row => {
        const obj = {};
        Object.keys(headerMap).forEach(index => {
          obj[headerMap[index]] = row[index];
        });
        return obj;
      });
    } else {
      jsonData = XLSX.utils.sheet_to_json(worksheet);
    }

    if (jsonData.length === 0 || (jsonData[0] && Object.keys(jsonData[0]).length === 0)) {
      jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
        blankrows: false
      });

      if (jsonData.length > 0 && jsonData[0].__EMPTY) {
        jsonData = jsonData.map(row => {
          const obj = {};
          if (row.__EMPTY) obj.name = row.__EMPTY;
          if (row.__EMPTY_1) obj.stock = row.__EMPTY_1;
          if (row.__EMPTY_2) obj.price = row.__EMPTY_2;
          return obj;
        });
      }
    }

    if (jsonData.length === 0) {
      throw new BadRequestError('Excel file is empty or invalid format');
    }

    const results = { success: 0, failed: 0, errors: [] };
    let defaultCategoryId = null;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2;

      try {
        let name, stock, price;

        if (row.name && row.stock && row.price) {
          ({ name, stock, price } = row);
        } else {
          name = row.__EMPTY || row.name;
          stock = row.__EMPTY_1 || row.stock;
          price = row.__EMPTY_2 || row.price;
        }

        if (name === 'name' && stock === 'stock' && price === 'price') {
          continue;
        }

        if (!name && !stock && !price) {
          continue;
        }

        const productName = name ? name.trim() : `Product ${rowNumber}`;
        const cleanStock = stock ? stock.toString().replace(/,/g, '') : '0';
        const cleanPrice = price ? price.toString().replace(/,/g, '') : '0';
        const productStock = parseInt(cleanStock) || 0;
        const productPrice = parseFloat(cleanPrice) || 0;

        if (!defaultCategoryId) {
          const existingCategory = await categoryRepository.findOne({ name: 'General' });
          if (existingCategory) {
            defaultCategoryId = existingCategory._id;
          } else {
            const newCategory = await categoryRepository.create({
              name: 'General',
              slug: 'general',
              picture: {
                secure_url: '/logos.png',
                public_id: 'default-category-image'
              }
            });
            defaultCategoryId = newCategory._id;
          }
        }

        await productRepository.create({
          title: productName,
          description: `Imported from Excel - Row ${rowNumber}`,
          price: productPrice,
          category: defaultCategoryId,
          stock: productStock,
          user: userId,
          picture: {
            secure_url: '/logos.png',
            public_id: 'default-product-image'
          }
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    return results;
  }

  async updateProduct(productId, updateData, file) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { title } = updateData;

    if (title && title.trim() !== product.title) {
      const existingProduct = await productRepository.findOne({
        title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
        _id: { $ne: productId }
      });

      if (existingProduct) {
        throw new BadRequestError('Product with this name already exists');
      }
    }

    const updateFields = {};
    if (title) updateFields.title = title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.price !== undefined) updateFields.price = updateData.price;
    if (updateData.category !== undefined) updateFields.category = updateData.category;
    if (updateData.stock !== undefined) updateFields.stock = updateData.stock;
    if (updateData.isFeatured !== undefined) {
      updateFields.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    }

    if (file) {
      const { secure_url, public_id } = await uploadImageOnCloudinary(file.buffer, 'products');

      if (product.picture && product.picture.public_id) {
        await deleteImageOnCloudinary(product.picture.public_id);
      }

      updateFields.picture = { secure_url, public_id };
    }

    return await productRepository.updateById(productId, updateFields);
  }

  async updateProductStock(productId, stock) {
    if (stock === undefined || stock === null) {
      throw new BadRequestError('Stock value is required');
    }

    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await productRepository.updateById(productId, { stock: parseInt(stock) });
  }

  async bulkUpdateFeatured(productIds, isFeatured) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestError('Product IDs array is required');
    }

    if (isFeatured === undefined || isFeatured === null) {
      throw new BadRequestError('isFeatured value is required');
    }

    const featuredValue = isFeatured === 'true' || isFeatured === true;
    const result = await productRepository.updateMany(
      { _id: { $in: productIds } },
      { $set: { isFeatured: featuredValue } }
    );

    return {
      modifiedCount: result.modifiedCount,
      featuredValue
    };
  }

  async deleteProduct(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.picture && product.picture.public_id) {
      await deleteImageOnCloudinary(product.picture.public_id);
    }

    await productRepository.deleteById(productId);
    return product;
  }

  async getProducts(filters) {
    let { category, page = 1, limit = 24, stockFilter = 'active', sortBy = 'az' } = filters;

    if (limit === 'all') {
      limit = 0;
    } else {
      limit = parseInt(limit);
    }
    page = parseInt(page);

    if (page < 1) page = 1;
    if (limit < 0) limit = 24;

    const query = {};
    if (stockFilter === 'active') {
      query.stock = { $gt: 0 };
    } else if (stockFilter === 'out-of-stock') {
      query.stock = { $lte: 0 };
    } else if (stockFilter === 'low-stock') {
      query.stock = { $gt: 0, $lt: 150 };
    }

    if (category && category.trim().toLowerCase() !== 'all') {
      const trimmedCategory = category.trim().toLowerCase();
      const isValidObjectId = mongoose.Types.ObjectId.isValid(trimmedCategory);

      if (isValidObjectId) {
        query.category = trimmedCategory;
      } else {
        let matchedCategory = await categoryRepository.findOne({
          slug: trimmedCategory
        });

        if (!matchedCategory) {
          matchedCategory = await categoryRepository.findOne({
            name: new RegExp(`^${trimmedCategory}$`, 'i')
          });
        }

        if (matchedCategory) {
          query.category = matchedCategory._id;
        } else {
          return {
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0
            }
          };
        }
      }
    }

    const totalProducts = await productRepository.countDocuments(query);

    const sortObject = this._getSortObject(sortBy);

    const products = await productRepository.find(query, {
      select: 'title picture price description stock isFeatured createdAt',
      populate: [
        { path: 'user', select: 'name' },
        { path: 'category', select: 'name' }
      ],
      sort: sortObject,
      skip: limit === 0 ? 0 : (page - 1) * limit,
      limit: limit || undefined
    });

    const formattedProducts = products.map(product => {
      const productObj = { ...product };
      productObj.image = productObj.picture?.secure_url || null;
      return productObj;
    });

    return {
      data: formattedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(totalProducts / limit) : 1
      }
    };
  }

  async getSingleProduct(productId) {
    const product = await productRepository.findByIdWithPopulate(productId, [
      { path: 'user', select: 'name' },
      { path: 'category', select: 'name' }
    ]);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async getLowStockCount() {
    return await productRepository.countDocuments({
      stock: { $gt: 0, $lt: 150 }
    });
  }

  _getSortObject(sortBy) {
    const sortMap = {
      'az': { isFeatured: -1, title: 1 },
      'za': { isFeatured: -1, title: -1 },
      'price-low': { isFeatured: -1, price: 1 },
      'price-high': { isFeatured: -1, price: -1 },
      'newest': { isFeatured: -1, createdAt: -1 },
      'oldest': { isFeatured: -1, createdAt: 1 },
      'stock-high': { isFeatured: -1, stock: -1 },
      'stock-low': { isFeatured: -1, stock: 1 },
      'relevance': { isFeatured: -1, createdAt: -1 }
    };

    return sortMap[sortBy] || { isFeatured: -1, title: 1 };
  }
}

module.exports = new ProductService();

