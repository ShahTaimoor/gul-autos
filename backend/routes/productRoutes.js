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
    let { category, page = 1, limit = 24, stockFilter = 'active', sortBy = 'relevance' } = req.query;

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


// Helper function to calculate Levenshtein distance (edit distance)
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + 1   // substitution
                );
            }
        }
    }

    return matrix[len1][len2];
}

// Helper function to extract numbers from string
function extractNumbers(str) {
    return str.match(/\d+/g) || [];
}

// Helper function to calculate numeric similarity
function numericSimilarity(num1, num2) {
    if (num1 === num2) return 1;
    const diff = Math.abs(num1 - num2);
    const max = Math.max(num1, num2);
    if (max === 0) return 1;
    // For years, allow up to 20 years difference with decreasing similarity
    if (diff <= 20) {
        return 1 - (diff / 20) * 0.5; // 50% penalty max for 20 year difference
    }
    return 0.1; // Very low similarity for large differences
}

// Helper function to calculate fuzzy match score
function calculateRelevanceScore(product, searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    const titleLower = (product.title || '').toLowerCase().trim();
    const descriptionLower = (product.description || '').toLowerCase().trim();
    
    let score = 0;
    const maxScore = 1000; // Increased max score for better granularity

    // PRIORITY 1: Exact match in title (highest priority - 1000 points)
    if (titleLower === searchLower) {
        return maxScore; // Exact match gets maximum score
    }

    // PRIORITY 2: Title starts with search term (900 points)
    if (titleLower.startsWith(searchLower)) {
        score += 900;
    }
    // PRIORITY 3: Title contains search term as whole phrase (800 points)
    else if (titleLower.includes(searchLower)) {
        score += 800;
    }
    // PRIORITY 4: All search words found in title (700 points)
    else {
        const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
        const titleWords = titleLower.split(/\s+/);
        let allWordsFound = true;
        let wordsFoundCount = 0;
        
        for (const searchWord of searchWords) {
            let wordFound = false;
            for (const titleWord of titleWords) {
                if (titleWord === searchWord) {
                    wordsFoundCount++;
                    wordFound = true;
                    break;
                }
            }
            if (!wordFound) {
                allWordsFound = false;
            }
        }
        
        if (allWordsFound && searchWords.length > 0) {
            score += 700 + (wordsFoundCount * 10);
        }
    }

    // Count matching words first
    const titleWords = titleLower.split(/\s+/);
    const searchWords = searchLower.split(/\s+/).filter(w => w.length >= 2);
    const searchNumbers = extractNumbers(searchTerm);
    const nonNumericSearchWords = searchWords.filter(w => !/^\d+$/.test(w));
    
    let matchingWordCount = 0;
    let matchingNonNumericCount = 0;
    
    // PRIORITY 5: Individual word matches in title (600-650 points)
    for (const searchWord of searchWords) {
        let wordMatched = false;
        for (const titleWord of titleWords) {
            // Exact word match
            if (titleWord === searchWord) {
                score += 50;
                wordMatched = true;
                matchingWordCount++;
                if (!/^\d+$/.test(searchWord)) {
                    matchingNonNumericCount++;
                }
                break;
            }
            // Word starts with search term or vice versa
            else if (titleWord.startsWith(searchWord) || searchWord.startsWith(titleWord)) {
                score += 30;
                wordMatched = true;
                matchingWordCount++;
                if (!/^\d+$/.test(searchWord)) {
                    matchingNonNumericCount++;
                }
                break;
            }
            // Word contains search term
            else if (titleWord.includes(searchWord) || searchWord.includes(titleWord)) {
                score += 20;
                wordMatched = true;
                matchingWordCount++;
                if (!/^\d+$/.test(searchWord)) {
                    matchingNonNumericCount++;
                }
                break;
            }
            // Fuzzy match with typo tolerance (only for words >= 4 chars)
            else if (searchWord.length >= 4 && titleWord.length >= 4) {
                const distance = levenshteinDistance(searchWord, titleWord);
                const maxLen = Math.max(searchWord.length, titleWord.length);
                const similarity = 1 - (distance / maxLen);
                
                // Accept matches with up to 25% character difference
                if (similarity >= 0.75) {
                    score += similarity * 15;
                    wordMatched = true;
                    matchingWordCount++;
                    if (!/^\d+$/.test(searchWord)) {
                        matchingNonNumericCount++;
                    }
                    break;
                }
            }
        }
    }

    // PRIORITY 6: Numeric similarity for year/model numbers (400-500 points)
    // BUT: Penalize if only numeric words match when non-numeric words are also in search
    const titleNumbers = extractNumbers(product.title || '');
    
    if (searchNumbers.length > 0 && titleNumbers.length > 0) {
        let numericMatchFound = false;
        for (const searchNum of searchNumbers) {
            for (const titleNum of titleNumbers) {
                const numSimilarity = numericSimilarity(parseInt(searchNum), parseInt(titleNum));
                if (numSimilarity > 0.1) {
                    numericMatchFound = true;
                    // If non-numeric words exist in search but none matched, heavily penalize
                    if (nonNumericSearchWords.length > 0 && matchingNonNumericCount === 0) {
                        // Only give 20 points instead of 100 for numeric-only matches
                        score += numSimilarity * 20;
                    } else {
                        score += numSimilarity * 100;
                    }
                }
            }
        }
    }
    
    // PENALTY: If search has multiple words but product only matches few
    if (searchWords.length > 1) {
        const matchRatio = matchingWordCount / searchWords.length;
        // If less than 70% of words match, heavily penalize
        if (matchRatio < 0.7) {
            score = score * 0.3; // Reduce score by 70%
        }
        // If non-numeric words exist but none matched, heavily penalize
        if (nonNumericSearchWords.length > 0 && matchingNonNumericCount === 0) {
            score = score * 0.2; // Reduce score by 80%
        }
    }

    // PRIORITY 7: Description contains search term (100-200 points)
    if (descriptionLower.includes(searchLower)) {
        score += 200;
    } else {
        // Check if any search words are in description
        for (const searchWord of searchWords) {
            if (descriptionLower.includes(searchWord)) {
                score += 20;
            }
        }
    }

    // PRIORITY 8: Partial substring matches (50-100 points)
    const searchWordsLower = searchLower.split(/\s+/).filter(w => w.length >= 3);
    const combinedText = `${titleLower} ${descriptionLower}`;
    
    for (const word of searchWordsLower) {
        if (combinedText.includes(word)) {
            score += 10;
        }
    }

    return Math.min(score, maxScore);
}

// @route GET /api/products/search
// @desc Search products with fuzzy matching
// @access Public
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = q.trim();
        const searchLimit = parseInt(limit) || 20;
        const searchLower = searchTerm.toLowerCase();

        // First, try MongoDB text search for exact/partial matches (faster and more accurate)
        let initialProducts = [];
        try {
            // Use MongoDB text search if available
            initialProducts = await Product.find(
                { 
                    $text: { $search: searchTerm },
                    stock: { $gt: 0 }
                },
                { score: { $meta: "textScore" } }
            )
            .select('title picture price description stock isFeatured createdAt')
            .populate('user', 'name')
            .populate('category', 'name')
            .sort({ score: { $meta: "textScore" } })
            .limit(searchLimit * 2) // Get more for filtering
            .lean();
        } catch (textSearchError) {
            // If text search fails (index might not exist), fall back to regular search
            console.log('Text search not available, using regular search');
        }

        // If text search didn't return enough results or failed, get all active products
        if (initialProducts.length < searchLimit) {
            const allProducts = await Product.find({ stock: { $gt: 0 } })
                .select('title picture price description stock isFeatured createdAt')
                .populate('user', 'name')
                .populate('category', 'name')
                .lean();
            
            // Combine with text search results, avoiding duplicates
            const existingIds = new Set(initialProducts.map(p => p._id.toString()));
            const additionalProducts = allProducts.filter(p => !existingIds.has(p._id.toString()));
            initialProducts = [...initialProducts, ...additionalProducts];
        }

        // Calculate relevance scores for each product
        const productsWithScores = initialProducts.map(product => {
            const score = calculateRelevanceScore(product, searchTerm);
            return {
                ...product,
                relevanceScore: score,
                image: product.picture?.secure_url || null
            };
        });

        // Separate products into categories for better ranking
        const exactMatches = [];      // Exact title match (100% match)
        const startsWithMatches = []; // Title starts with search
        const containsMatches = [];   // Title contains search
        const wordMatches = [];      // Individual words match
        const fuzzyMatches = [];      // Fuzzy/typo matches
        
        productsWithScores.forEach(product => {
            const titleLower = (product.title || '').toLowerCase().trim();
            const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
            
            // Count how many search words match in the title
            const matchingWords = searchWords.filter(word => titleLower.includes(word));
            const matchCount = matchingWords.length;
            const matchRatio = searchWords.length > 0 ? matchCount / searchWords.length : 0;
            
            // Separate numeric and non-numeric words
            const numericWords = searchWords.filter(w => /^\d+$/.test(w));
            const nonNumericWords = searchWords.filter(w => !/^\d+$/.test(w));
            
            // Extract all numbers from title for exact numeric matching
            const titleNumbers = (product.title || '').match(/\d+/g) || [];
            
            // Check exact numeric matches (years must match exactly, not just substring)
            let allNumericMatch = true;
            let matchingNumericCount = 0;
            if (numericWords.length > 0) {
                for (const numericWord of numericWords) {
                    const numValue = parseInt(numericWord);
                    // Check if this exact number appears in the title
                    const exactMatch = titleNumbers.some(tn => parseInt(tn) === numValue);
                    if (exactMatch) {
                        matchingNumericCount++;
                    } else {
                        allNumericMatch = false;
                    }
                }
            }
            
            const matchingNonNumeric = nonNumericWords.filter(w => titleLower.includes(w)).length;
            
            // PRIORITY 1: Exact match (100% - always show these first)
            if (titleLower === searchLower) {
                exactMatches.push(product);
            }
            // PRIORITY 2: Title starts with search term
            else if (titleLower.startsWith(searchLower)) {
                startsWithMatches.push(product);
            }
            // PRIORITY 3: Title contains the full search term
            else if (titleLower.includes(searchLower)) {
                containsMatches.push(product);
            }
            // PRIORITY 4: ALL search words are in title (100% word match) - STRICT REQUIREMENT
            if (searchWords.length > 0 && matchCount === searchWords.length) {
                wordMatches.push(product);
            }
            // PRIORITY 5: For searches with 2+ non-numeric words, ALL non-numeric words MUST match
            else if (nonNumericWords.length >= 2) {
                // Require ALL non-numeric words to match
                if (matchingNonNumeric === nonNumericWords.length) {
                    // If numeric words exist, ALL must match exactly
                    if (numericWords.length === 0 || allNumericMatch) {
                        wordMatches.push(product);
                    }
                    // Skip if numeric words don't match exactly
                }
                // Skip products that don't have all non-numeric words
            }
            // PRIORITY 6: For searches with 1 non-numeric word + numeric, both should match
            else if (nonNumericWords.length === 1 && numericWords.length > 0) {
                if (matchingNonNumeric === 1 && allNumericMatch) {
                    wordMatches.push(product);
                }
                // Skip if non-numeric doesn't match or numeric doesn't match exactly
            }
            // PRIORITY 7: Most words match (at least 80% of words, minimum 2 words) - only for 3+ word searches
            else if (searchWords.length >= 3 && matchRatio >= 0.8 && matchCount >= 2) {
                // Require at least one non-numeric word if non-numeric words exist
                // AND numeric words must match exactly if they exist
                if ((nonNumericWords.length === 0 || matchingNonNumeric > 0) && 
                    (numericWords.length === 0 || allNumericMatch)) {
                    fuzzyMatches.push(product);
                }
            }
            // PRIORITY 8: Single word searches - allow if it matches
            else if (searchWords.length === 1 && titleLower.includes(searchWords[0])) {
                if (product.relevanceScore > 100) {
                    fuzzyMatches.push(product);
                }
            }
        });

        // Sort function for products
        const sortProducts = (products) => {
            return products.sort((a, b) => {
                // First sort by relevance score (descending)
                if (b.relevanceScore !== a.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                // If scores are equal, prioritize featured products
                if (b.isFeatured !== a.isFeatured) {
                    return b.isFeatured ? 1 : -1;
                }
                // Then by newest
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        };

        // Additional strict filtering: Remove products that don't meet minimum requirements
        const strictFilter = (products) => {
            return products.filter(product => {
                const titleLower = (product.title || '').toLowerCase().trim();
                const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
                const numericWords = searchWords.filter(w => /^\d+$/.test(w));
                const nonNumericWords = searchWords.filter(w => !/^\d+$/.test(w));
                
                // Extract all numbers from title (for year matching)
                const titleNumbers = (product.title || '').match(/\d+/g) || [];
                
                // Check exact numeric word matches (years must match exactly)
                let allNumericMatch = true;
                if (numericWords.length > 0) {
                    for (const numericWord of numericWords) {
                        const numValue = parseInt(numericWord);
                        // Check if this exact number appears in the title
                        const exactMatch = titleNumbers.some(tn => parseInt(tn) === numValue);
                        if (!exactMatch) {
                            allNumericMatch = false;
                            break;
                        }
                    }
                }
                
                // Check non-numeric word matches
                const matchingNonNumeric = nonNumericWords.filter(w => titleLower.includes(w)).length;
                
                // STRICT RULE 1: If numeric words (years) exist, ALL must match exactly
                if (numericWords.length > 0 && !allNumericMatch) {
                    return false; // Exclude if year doesn't match exactly
                }
                
                // STRICT RULE 2: For searches with 2+ non-numeric words, ALL must match
                if (nonNumericWords.length >= 2) {
                    if (matchingNonNumeric < nonNumericWords.length) {
                        return false; // Exclude if not all non-numeric words match
                    }
                }
                
                // STRICT RULE 3: For searches with 1 non-numeric word, it must match
                if (nonNumericWords.length === 1) {
                    if (matchingNonNumeric < 1) {
                        return false; // Exclude if the non-numeric word doesn't match
                    }
                }
                
                // STRICT RULE 4: Require at least 70% of ALL words (numeric + non-numeric) to match
                const allMatchingWords = (allNumericMatch ? numericWords.length : 0) + matchingNonNumeric;
                const totalWords = searchWords.length;
                if (totalWords >= 2) {
                    const matchRatio = allMatchingWords / totalWords;
                    if (matchRatio < 0.7) {
                        return false; // Exclude if less than 70% match
                    }
                }
                
                return true;
            });
        };

        // Apply strict filtering to each category
        const filteredExact = strictFilter([...exactMatches]);
        const filteredStartsWith = strictFilter([...startsWithMatches]);
        const filteredContains = strictFilter([...containsMatches]);
        const filteredWords = strictFilter([...wordMatches]);
        const filteredFuzzy = strictFilter([...fuzzyMatches]);

        // Sort each category
        const sortedExact = sortProducts(filteredExact);
        const sortedStartsWith = sortProducts(filteredStartsWith);
        const sortedContains = sortProducts(filteredContains);
        const sortedWords = sortProducts(filteredWords);
        const sortedFuzzy = sortProducts(filteredFuzzy);

        // GUARANTEE: ALL exact matches are ALWAYS included first (100%)
        // If there are exact matches, show ALL of them, then fill remaining slots
        let relevantProducts = [];
        
        if (sortedExact.length > 0) {
            // Add ALL exact matches first (100% guarantee - never cut off)
            relevantProducts = [...sortedExact];
            
            // Calculate remaining slots after exact matches
            const remainingSlots = Math.max(0, searchLimit - sortedExact.length);
            
            // Fill remaining slots with other matches in priority order
            if (remainingSlots > 0) {
                const otherMatches = [
                    ...sortedStartsWith,
                    ...sortedContains,
                    ...sortedWords,
                    ...sortedFuzzy
                ].slice(0, remainingSlots);
                
                relevantProducts = [...relevantProducts, ...otherMatches];
            }
        } else {
            // No exact matches, use normal priority order
            relevantProducts = [
                ...sortedStartsWith,
                ...sortedContains,
                ...sortedWords,
                ...sortedFuzzy
            ].slice(0, searchLimit);
        }
        
        // Remove relevance score from response
        relevantProducts = relevantProducts.map(({ relevanceScore, ...product }) => product);

        return res.status(200).json({
            success: true,
            message: relevantProducts.length > 0 
                ? `Found ${relevantProducts.length} product(s)` 
                : 'No products found',
            data: relevantProducts,
            query: searchTerm
        });
    } catch (error) {
        console.error('Error while searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching products'
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