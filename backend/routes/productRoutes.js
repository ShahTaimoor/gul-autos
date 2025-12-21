const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const router = express.Router();
const upload = require('../middleware/multer')
const { deleteImageOnCloudinary, uploadImageOnCloudinary } = require('../utils/cloudinary');
const { isAuthorized, isAdmin, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');


// @route POST /api/products/create-produ
// @desc Create a new Product
// @access Private/Admin

router.post('/create-product', isAuthorized, isAdminOrSuperAdmin, upload.single('picture'), async (req, res) => {
  try {
    const { title, description, price, category, stock, isFeatured } = req.body;


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

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ 
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') } 
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    const { secure_url, public_id } = await uploadImageOnCloudinary(req.file.buffer, 'products');

    if (!secure_url || !public_id) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary upload failed'
      });
    }

    const product = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      user: req.user._id,
      picture: { secure_url, public_id }
    });

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

// @route POST /api/products/import-excel
// @desc Import products from Excel file
// @access Private/Admin
router.post('/import-excel', isAuthorized, isAdminOrSuperAdmin, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required'
      });
    }

    // Parse Excel file with different options
    const workbook = XLSX.read(req.file.buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Try different parsing methods
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use first row as header
      defval: '' // Default value for empty cells
    });


    // If we get array of arrays, convert to objects
    if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
      const headers = jsonData[0];
      
      // Map headers to standard names
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
      
      
      // If no headers were mapped, try to detect from data
      if (Object.keys(headerMap).length === 0) {
        // Look for patterns in the first few rows
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
      
      // Convert to objects
      jsonData = jsonData.slice(1).map(row => {
        const obj = {};
        Object.keys(headerMap).forEach(index => {
          obj[headerMap[index]] = row[index];
        });
        return obj;
      });
    } else {
      // Try standard parsing
      jsonData = XLSX.utils.sheet_to_json(worksheet);
    }

    // If still no data, try alternative parsing
    if (jsonData.length === 0 || (jsonData[0] && Object.keys(jsonData[0]).length === 0)) {
      jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '',
        blankrows: false
      });
      
      // If we get __EMPTY columns, map them properly
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
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format'
      });
    }


    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because Excel starts from 1 and we skip header

      try {
        // Handle both standard column names and __EMPTY column names
        let name, stock, price;
        
        if (row.name && row.stock && row.price) {
          // Standard column names
          ({ name, stock, price } = row);
        } else {
          // Handle __EMPTY column names
          name = row.__EMPTY || row.name;
          stock = row.__EMPTY_1 || row.stock;
          price = row.__EMPTY_2 || row.price;
        }
        
       

        // Skip header row (contains column names)
        if (name === 'name' && stock === 'stock' && price === 'price') {
         
          continue;
        }
        
        // Skip empty rows
        if (!name && !stock && !price) {
        
          continue;
        }

        // Use default values for missing fields
        const productName = name ? name.trim() : `Product ${rowNumber}`;
        
        // Handle comma-separated numbers for stock and price
        const cleanStock = stock ? stock.toString().replace(/,/g, '') : '0';
        const cleanPrice = price ? price.toString().replace(/,/g, '') : '0';
        
        const productStock = parseInt(cleanStock) || 0;
        const productPrice = parseFloat(cleanPrice) || 0;
        
       

        // Find or create default category
        let categoryId;
       
        const existingCategory = await Category.findOne({ 
          name: 'General' 
        });

        if (existingCategory) {
          categoryId = existingCategory._id;
        } else {
          // Create default category if it doesn't exist
          const newCategory = await Category.create({
            name: 'General',
            slug: 'general',
            picture: {
              secure_url: '/logos.png', // Default image
              public_id: 'default-category-image'
            }
          });
          categoryId = newCategory._id;
        }

        // Create product
        const product = await Product.create({
          title: productName,
          description: `Imported from Excel - Row ${rowNumber}`,
          price: productPrice,
          category: categoryId,
          stock: productStock,
          user: req.user._id,
          picture: {
            secure_url: '/logos.png', // Default image
            public_id: 'default-product-image'
          }
        });

        results.success++;
      } catch (error) {
        console.error(`Error creating product for row ${rowNumber}:`, error);
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Import completed. ${results.success} products created, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Error importing Excel file:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while importing Excel file',
      error: error.message
    });
  }
});

// @rout PUT /api/products/update-product/:id
// @desc Update an existing product ID
// @access Private/Admin
router.put('/update-product/:id', isAuthorized, isAdminOrSuperAdmin, upload.single('picture'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, stock, isFeatured } = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check for duplicate product name (excluding current product)
    if (title && title.trim() !== product.title) {
      const existingProduct = await Product.findOne({ 
        title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }
    }

    // Update text fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;

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

// @route PUT /api/products/update-product-stock/:id
// @desc Update product stock status
// @access Private/Admin
router.put('/update-product-stock/:id', isAuthorized, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock value is required' 
      });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    product.stock = parseInt(stock);
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating product stock' 
    });
  }
});

// @route PUT /api/products/bulk-update-featured
// @desc Bulk update featured status for multiple products
// @access Private/Admin
router.put('/bulk-update-featured', isAuthorized, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { productIds, isFeatured } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product IDs array is required' 
      });
    }

    if (isFeatured === undefined || isFeatured === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'isFeatured value is required' 
      });
    }

    const featuredValue = isFeatured === 'true' || isFeatured === true;

    // Update all products
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isFeatured: featuredValue } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully ${featuredValue ? 'marked' : 'unmarked'} ${result.modifiedCount} product(s) as featured`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating featured status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating featured status' 
    });
  }
});

// @route DELETE /api/products/delete-product/:id
// @desc Delete a product by ID
// @access Private/Admin
router.delete('/delete-product/:id', isAuthorized, isAdminOrSuperAdmin,  async (req, res) => {

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
    let { category, page = 1, limit = 24, stockFilter = 'active', sortBy = 'az' } = req.query;

    if (limit === 'all') {
      limit = 0; 
    } else {
      limit = parseInt(limit);
    }
    page = parseInt(page);
    
    // Ensure page and limit are valid positive numbers
    if (page < 1) page = 1;
    if (limit < 0) limit = 24; // Default limit if negative

    const query = {};
    if (stockFilter === 'active') {
      query.stock = { $gt: 0 };
    } else if (stockFilter === 'out-of-stock') {
      query.stock = { $lte: 0 };
    } else if (stockFilter === 'low-stock') {
      query.stock = { $gt: 0, $lt: 150 }; // Show only stock from 1 to 149 (exclude 0 and negative)
    }


    // Handle category filter - support both slug and ID for backward compatibility
    if (category && category.trim().toLowerCase() !== 'all') {
      const trimmedCategory = category.trim().toLowerCase();
      const isValidObjectId = mongoose.Types.ObjectId.isValid(trimmedCategory);

      if (isValidObjectId) {
        // If it's a valid ObjectId, use it directly (backward compatibility)
        query.category = trimmedCategory;
      } else {
        // Try to find by slug first (preferred method)
        let matchedCategory = await Category.findOne({
          slug: trimmedCategory,
        });

        // If not found by slug, try by name (for backward compatibility)
        if (!matchedCategory) {
          matchedCategory = await Category.findOne({
            name: new RegExp(`^${trimmedCategory}$`, 'i'),
          });
        }

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


    const totalProducts = await Product.countDocuments(query);

    // Build sort object based on sortBy parameter
    let sortObject = {};
    switch (sortBy) {
      case 'az':
        sortObject = { isFeatured: -1, title: 1 }; // Featured first, then alphabetical
        break;
      case 'za':
        sortObject = { isFeatured: -1, title: -1 }; // Featured first, then reverse alphabetical
        break;
      case 'price-low':
        sortObject = { isFeatured: -1, price: 1 }; // Featured first, then price low to high
        break;
      case 'price-high':
        sortObject = { isFeatured: -1, price: -1 }; // Featured first, then price high to low
        break;
      case 'newest':
        sortObject = { isFeatured: -1, createdAt: -1 }; // Featured first, then newest
        break;
      case 'oldest':
        sortObject = { isFeatured: -1, createdAt: 1 }; // Featured first, then oldest
        break;
      case 'stock-high':
        sortObject = { isFeatured: -1, stock: -1 }; // Featured first, then stock high to low
        break;
      case 'stock-low':
        sortObject = { isFeatured: -1, stock: 1 }; // Featured first, then stock low to high
        break;
      case 'relevance':
        // Featured products first, sorted by newest (relevance)
        // Then non-featured products, also sorted by newest (relevance)
        sortObject = { isFeatured: -1, createdAt: -1 };
        break;
      default:
        sortObject = { isFeatured: -1, title: 1 }; // Featured first, then alphabetical
    }

    const products = await Product.find(query)
      .select('title picture price description stock isFeatured createdAt')
      .populate('user', 'name')
      .populate('category', 'name')
      .sort(sortObject)
      .skip(limit === 0 ? 0 : (page - 1) * limit)
      .limit(limit || undefined);

    const newProductArray = products.map((product, index) => {
      const productObj = product.toObject ? product.toObject() : product;
      // Keep both image and picture fields for compatibility
      productObj.image = productObj.picture?.secure_url || null;
      // Don't delete picture field, keep it for backward compatibility
      return productObj;
    });

    const message =
      products.length === 0
        ? 'No products found in this category.'
        : 'Products fetched successfully';

    return res.status(200).json({
      success: true,
      message,
      data: newProductArray,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(totalProducts / limit) : 1,
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


// REMOVED: Search functionality removed
// Helper function to calculate Levenshtein distance (edit distance) for fuzzy matching
/* REMOVED
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    const matrix = [];
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                );
            }
        }
    }
    
    return matrix[len1][len2];
}

// Helper function to calculate fuzzy relevance score
function calculateFuzzyScore(product, searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    const titleLower = (product.title || '').toLowerCase().trim();
    const descriptionLower = (product.description || '').toLowerCase().trim();
    
    let score = 0;
    
    // Exact match in title (highest score)
    if (titleLower === searchLower) {
        return 1000;
    }
    
    // Title starts with search term
    if (titleLower.startsWith(searchLower)) {
        score += 900;
    }
    // Title contains search term as phrase
    else if (titleLower.includes(searchLower)) {
        score += 800;
    }
    // Word-level matching
    else {
        const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
        const titleWords = titleLower.split(/\s+/);
        let allWordsFound = true;
        
        for (const searchWord of searchWords) {
            let wordFound = false;
            for (const titleWord of titleWords) {
                if (titleWord === searchWord) {
                    score += 100;
                    wordFound = true;
                    break;
                } else if (titleWord.includes(searchWord) || searchWord.includes(titleWord)) {
                    score += 50;
                    wordFound = true;
                    break;
                } else if (searchWord.length >= 4 && titleWord.length >= 4) {
                    const distance = levenshteinDistance(searchWord, titleWord);
                    const maxLen = Math.max(searchWord.length, titleWord.length);
                    const similarity = 1 - (distance / maxLen);
                    if (similarity >= 0.75) {
                        score += similarity * 30;
                        wordFound = true;
                        break;
                    }
                }
            }
            if (!wordFound) {
                allWordsFound = false;
            }
        }
        
        if (allWordsFound && searchWords.length > 0) {
            score += 200;
        }
    }
    
    // Description matches (lower weight)
    if (descriptionLower.includes(searchLower)) {
        score += 100;
    }
    
    return score;
}
REMOVED */

// REMOVED: Search route removed
/* REMOVED
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        // Validate search query
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = q.trim();
        const searchLimit = Math.min(parseInt(limit) || 20, 100); // Cap at 100 for safety
        const MAX_FUZZY_DATASET = 400; // Cap fuzzy search dataset
        
        // Base query: Only in-stock products
        const baseQuery = { stock: { $gt: 0 } };
        
        // Field projection for performance (only return needed fields)
        const projection = 'title picture price description stock isFeatured createdAt category';
        
        let results = [];
        let searchStrategy = 'none';

        // ============================================
        // TIER 1: MongoDB $text Search (Primary - Fastest & Most Relevant)
        // ============================================
        try {
            const textSearchResults = await Product.find(
                {
                    $text: { $search: searchTerm },
                    ...baseQuery
                },
                { 
                    score: { $meta: "textScore" }
                }
            )
            .select(projection)
            .populate('category', 'name')
            .sort({ 
                score: { $meta: "textScore" },
                isFeatured: -1,
                createdAt: -1
            })
            .limit(searchLimit * 2) // Get more for secondary sorting
            .lean();

            if (textSearchResults && textSearchResults.length > 0) {
                results = textSearchResults;
                searchStrategy = 'text';
            }
        } catch (textError) {
            // Text index might not exist or query failed - continue to fallback
            console.log('MongoDB text search not available, using fallback:', textError.message);
        }

        // ============================================
        // TIER 2: Regex-based Partial Matching (Secondary)
        // ============================================
        if (results.length < searchLimit) {
            try {
                // Escape special regex characters in search term
                const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regexPattern = new RegExp(escapedSearch, 'i');
                
                const regexQuery = {
                    ...baseQuery,
                    $or: [
                        { title: regexPattern },
                        { description: regexPattern }
                    ]
                };

                const regexResults = await Product.find(regexQuery)
                    .select(projection)
                    .populate('category', 'name')
                    .sort({ 
                        isFeatured: -1,
                        createdAt: -1
                    })
                    .limit(searchLimit * 2)
                    .lean();

                // Merge with text search results, avoiding duplicates
                if (regexResults && regexResults.length > 0) {
                    const existingIds = new Set(results.map(p => p._id.toString()));
                    const newResults = regexResults.filter(p => !existingIds.has(p._id.toString()));
                    results = [...results, ...newResults];
                    
                    if (searchStrategy === 'none') {
                        searchStrategy = 'regex';
                    }
                }
            } catch (regexError) {
                console.log('Regex search error:', regexError.message);
            }
        }

        // ============================================
        // TIER 3: Limited Fuzzy Search (Tertiary - Capped Dataset)
        // ============================================
        if (results.length < searchLimit) {
            try {
                // Get a limited dataset for fuzzy search (capped for performance)
                const fuzzyDataset = await Product.find(baseQuery)
                    .select(projection)
                    .populate('category', 'name')
                    .sort({ isFeatured: -1, createdAt: -1 })
                    .limit(MAX_FUZZY_DATASET)
                    .lean();

                if (fuzzyDataset && fuzzyDataset.length > 0) {
                    // Calculate fuzzy scores
                    const productsWithScores = fuzzyDataset.map(product => ({
                        ...product,
                        fuzzyScore: calculateFuzzyScore(product, searchTerm)
                    }));

                    // Filter products with minimum relevance (score > 50)
                    const relevantProducts = productsWithScores
                        .filter(p => p.fuzzyScore > 50)
                        .sort((a, b) => b.fuzzyScore - a.fuzzyScore);

                    // Merge with existing results, avoiding duplicates
                    const existingIds = new Set(results.map(p => p._id.toString()));
                    const newResults = relevantProducts
                        .filter(p => !existingIds.has(p._id.toString()))
                        .slice(0, searchLimit - results.length);

                    results = [...results, ...newResults];
                    
                    if (searchStrategy === 'none') {
                        searchStrategy = 'fuzzy';
                    }
                }
            } catch (fuzzyError) {
                console.log('Fuzzy search error:', fuzzyError.message);
            }
        }

        // ============================================
        // Final Sorting: Relevance -> Featured -> Newest
        // ============================================
        results = results
            .slice(0, searchLimit) // Strict limit
            .map(product => ({
                ...product,
                image: product.picture?.secure_url || null
            }))
            .sort((a, b) => {
                // 1. Featured products first
                if (b.isFeatured !== a.isFeatured) {
                    return b.isFeatured ? 1 : -1;
                }
                // 2. Then by newest (createdAt)
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

        // Remove internal scoring fields from response
        results = results.map(({ fuzzyScore, score, ...product }) => product);

        return res.status(200).json({
            success: true,
            message: results.length > 0 
                ? `Found ${results.length} product(s)` 
                : 'No products found',
            data: results,
            query: searchTerm,
            strategy: searchStrategy,
            count: results.length
        });
    } catch (error) {
        console.error('Error while searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
REMOVED */

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

// @route GET /api/products/low-stock-count
// @desc Get count of products with stock less than 150
// @access Public
router.get('/low-stock-count', async (req, res) => {
  try {
    const count = await Product.countDocuments({
      stock: { $gt: 0, $lt: 150 } // Show only stock from 1 to 149 (exclude 0 and negative)
    });

    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching low stock count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock count'
    });
  }
});

module.exports = router;