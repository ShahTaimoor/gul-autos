const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const router = express.Router();
const upload = require('../middleware/multer')
const { deleteImageOnCloudinary, uploadImageOnCloudinary } = require('../utils/cloudinary');
const { isAuthorized, isAdmin } = require('../middleware/authMiddleware');
const { default: mongoose } = require('mongoose');

// @route POST /api/products/create-product
// @desc Create a new Product
// @access Private/Admin

router.post('/create-product', isAuthorized, isAdmin, upload.single('picture'), async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;

    console.log('Product creation request:', { title, description, price, category, stock, hasFile: !!req.file });

    if (!title || !price || !category || !stock || !req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required including image',
        missing: {
          title: !title,
          price: !price,
          category: !category,
          stock: !stock,
          image: !req.file
        }
      });
    }

    console.log('Uploading to Cloudinary...');
    const { secure_url, public_id } = await uploadImageOnCloudinary(req.file.buffer, 'products');

    if (!secure_url || !public_id) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary upload failed'
      });
    }

    console.log('Creating product in database...');
    const product = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      user: req.user._id,
      picture: { secure_url, public_id }
    });

    console.log('Product created successfully:', product._id);
    return res.status(201).json({
      success: true,
      message: 'Product Added Successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in create Product',
      error: error.message 
    });
  }
});


// @rout PUT /api/products/update-product/:id
// @desc Update an existing product ID
// @access Private/Admin
router.put('/update-product/:id', isAuthorized, isAdmin, upload.single('picture'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, stock } = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update text fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock) product.stock = stock;

    // Handle image update
    if (req.file) {
      const { secure_url, public_id } = await uploadImageOnCloudinary(req.file.buffer, 'products');

      // Delete old image from Cloudinary if exists
      if (product.picture && product.picture.public_id) {
        await deleteImageOnCloudinary(product.picture.public_id);
      }

      product.picture = { secure_url, public_id };
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating product' });
  }
});

// @route DELETE /api/products/delete-product/:id
// @desc Delete a product by ID
// @access Private/Admin
router.delete('/delete-product/:id', isAuthorized, isAdmin,  async (req, res) => {

    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product Not Found' });
        }

        // delete cloudinary image 

        if (product.picture && product.picture.public_id) {
            await deleteImageOnCloudinary(product.picture.public_id)
        }

        return res.status(200).json({ success: true, message: 'Product Deleted Successfully', data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error in delete Product' });
    }
});

// @route GET /api/products/get-products
// @desc Get all products with optional query filters
// @access Public
router.get('/get-products', async (req, res) => {
  try {
    let { category, search, page = 1, limit = 24, stockFilter = 'all' } = req.query;

    if (limit === 'all') {
      limit = 0; 
    } else {
      limit = parseInt(limit);
    }
    page = parseInt(page);

    const query = {};
    if (stockFilter === 'active') {
      query.stock = { $gt: 0 };
    } else if (stockFilter === 'out-of-stock') {
      query.stock = { $lte: 0 };
    }

    // Handle category filter
    if (category && category.trim().toLowerCase() !== 'all') {
      const trimmedCategory = category.trim();
      const isValidObjectId = mongoose.Types.ObjectId.isValid(trimmedCategory);

      if (isValidObjectId) {
        query.category = trimmedCategory;
      } else {
        const matchedCategory = await Category.findOne({
          name: new RegExp(`^${trimmedCategory}$`, 'i'),
        });

        if (matchedCategory) {
          query.category = matchedCategory._id;
        } else {
          return res.status(200).json({
            success: true,
            message: 'No products found in this category.',
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          });
        }
      }
    }

    // Handle search filter
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .select('title picture price description stock')
      .populate('user', 'name')
      .populate('category', 'name')
      .sort({ stock: -1, name: 1 })
      .skip((page - 1) * (limit || 1))
      .limit(limit || undefined);

    const newProductArray = products.map((product, index) => {
      const productObj = product.toObject();
      // Keep both image and picture fields for compatibility
      productObj.image = productObj.picture?.secure_url || null;
      // Don't delete picture field, keep it for backward compatibility
      
      
      return productObj;
    });

    const message =
      products.length === 0
        ? search
          ? 'No products found for your search.'
          : 'No products found in this category.'
        : 'Products fetched successfully';

    return res.status(200).json({
      success: true,
      message,
      data: newProductArray,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error('Error while fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
    });
  }
});



router.get('/single-product/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id)
            .populate('user', 'name')
            .populate('category', 'name')

        return res.status(200).json({
            success: true,
            message: 'Single product fetched successfully',
            product
        });
    } catch (error) {
        console.error('Error fetching single category:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching single category' });
    }
});


module.exports = router;
