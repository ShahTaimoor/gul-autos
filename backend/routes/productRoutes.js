const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const router = express.Router();
const upload = require('../middleware/multer')
const { deleteImageOnCloudinary, uploadImageOnCloudinary } = require('../utils/cloudinary');
const { isAuthorized, isAdmin, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/security');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');

// @route POST /api/products/create-produ
// @desc Create a new Product
// @access Private/Admin

router.post('/create-product', uploadLimiter, isAuthorized, isAdminOrSuperAdmin, upload.single('picture'), async (req, res) => {
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
router.post('/import-excel', uploadLimiter, isAuthorized, isAdminOrSuperAdmin, upload.single('excelFile'), async (req, res) => {
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
router.put('/update-product/:id', uploadLimiter, isAuthorized, isAdminOrSuperAdmin, upload.single('picture'), async (req, res) => {
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
    let { category, search, page = 1, limit = 24, stockFilter = 'active', sortBy = 'az', productIds } = req.query;

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

    // Handle specific product IDs (from search suggestions)
    if (productIds && productIds.trim()) {
      const ids = productIds.split(',').filter(id => id.trim());
      if (ids.length > 0) {
        // Validate ObjectIds
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length > 0) {
          query._id = { $in: validIds };
        }
      }
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

    // Handle enhanced search filter with keyword and year matching
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
      const buildWordPattern = (value) => {
        const escaped = escapeRegExp(value);
        const startsWithWord = /\w/.test(value[0] || '');
        const endsWithWord = /\w/.test(value[value.length - 1] || '');
        if (startsWithWord && endsWithWord) return `\\b${escaped}\\b`;
        if (startsWithWord) return `\\b${escaped}`;
        if (endsWithWord) return `${escaped}\\b`;
        return escaped;
      };
      
      // Extract words from brackets: (word) or {word} or [word]
      const bracketWords = [];
      const bracketPatterns = [
        /\(([^)]+)\)/g,  // (word)
        /\{([^}]+)\}/g,  // {word}
        /\[([^\]]+)\]/g  // [word]
      ];
      
      bracketPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(trimmedSearch)) !== null) {
          bracketWords.push(match[1].trim());
        }
      });
      
      // Remove bracket content from search string for normal processing
      let searchWithoutBrackets = trimmedSearch
        .replace(/\([^)]+\)/g, '')  // Remove (word)
        .replace(/\{[^}]+\}/g, '')  // Remove {word}
        .replace(/\[[^\]]+\]/g, ''); // Remove [word]
      
      // Split search into keywords and years
      const words = searchWithoutBrackets.split(/\s+/).filter(word => word.length > 0);
      const keywords = [];
      const years = [];
      
      // Separate keywords from years (4-digit numbers)
      words.forEach(word => {
        if (/^\d{4}$/.test(word)) {
          years.push(word);
        } else {
          keywords.push(word);
        }
      });
      
      // Add bracket words to keywords
      keywords.push(...bracketWords);
      
      // If searching for "grill", exclude products that are clearly not grills
      if (keywords.includes('grill') || keywords.includes('grille')) {
        const excludeTerms = ['perfume', 'air freshener', 'fragrance', 'scent'];
        excludeTerms.forEach(term => {
          query.$and = query.$and || [];
          query.$and.push({
            $and: [
              { title: { $not: { $regex: `\\b${term}\\b`, $options: 'i' } } },
              { description: { $not: { $regex: `\\b${term}\\b`, $options: 'i' } } }
            ]
          });
        });
      }
      
        // If we have both keywords and years, require ALL to match
        if (keywords.length > 0 && years.length > 0) {
          // Define product-specific keywords that must be present
          const productTypeKeywords = ['grill', 'grille', 'bumper', 'lip', 'kit', 'light', 'drl', 'led', 'hood', 'spoiler', 'mirror', 'fender', 'door', 'headlight', 'taillight', 'fog', 'perfume', 'mat', 'muffler', 'pipe', 'alarm'];
          
          // Check if search contains product-specific keywords
          const hasProductTypeKeyword = keywords.some(kw => 
            productTypeKeywords.some(pt => kw.toLowerCase().includes(pt) || pt.includes(kw.toLowerCase()))
          );
          
          // First, try to find categories matching the search term
          const categoryMatches = await Category.find({
            name: { $regex: escapeRegExp(trimmedSearch), $options: 'i' }
          }).select('_id');
          const categoryIds = categoryMatches.map(cat => cat._id);
          
          // Build AND conditions - ALL keywords must be present
          const allKeywordConditions = keywords.map(keyword => {
            const keywordPattern = buildWordPattern(keyword);
            const condition = {
              $or: [
                { title: { $regex: keywordPattern, $options: 'i' } },
                { description: { $regex: keywordPattern, $options: 'i' } }
              ]
            };
            // If category matches found, also include category search
            if (categoryIds.length > 0) {
              condition.$or.push({ category: { $in: categoryIds } });
            }
            return condition;
          });
        
        // Build AND conditions - ALL years must be present
        const allYearConditions = years.map(year => {
          const escapedYear = escapeRegExp(year);
          return {
            $or: [
              { title: { $regex: escapedYear, $options: 'i' } },
              { description: { $regex: escapedYear, $options: 'i' } }
            ]
          };
        });
        
        // If searching for a specific product type, require it to be in title (not just description)
        if (hasProductTypeKeyword) {
          const productTypeKeyword = keywords.find(kw => 
            productTypeKeywords.some(pt => kw.toLowerCase().includes(pt) || pt.includes(kw.toLowerCase()))
          );
          if (productTypeKeyword) {
            const escapedPTKeyword = buildWordPattern(productTypeKeyword);
            // Require product type keyword to be in title (more strict)
            allKeywordConditions.push({
              title: { $regex: escapedPTKeyword, $options: 'i' }
            });
          }
        }
        
        // Combine all conditions - ALL must match
        query.$and = [
          ...allKeywordConditions,
          ...allYearConditions
        ];
      }
      // If only keywords (no years), use precise keyword matching with AND logic
      else if (keywords.length > 0) {
        // Define product-specific keywords that must be present
        const productTypeKeywords = ['grill', 'grille', 'bumper', 'lip', 'kit', 'light', 'drl', 'led', 'hood', 'spoiler', 'mirror', 'fender', 'door', 'headlight', 'taillight', 'fog', 'perfume', 'mat', 'muffler', 'pipe', 'alarm'];
        
        // Check if search contains product-specific keywords
        const hasProductTypeKeyword = keywords.some(kw => 
          productTypeKeywords.some(pt => kw.toLowerCase().includes(pt) || pt.includes(kw.toLowerCase()))
        );
        
        // First, try to find categories matching the search term
        const categoryMatches = await Category.find({
          name: { $regex: escapeRegExp(trimmedSearch), $options: 'i' }
        }).select('_id');
        const categoryIds = categoryMatches.map(cat => cat._id);
        
        // Build AND conditions - ALL keywords must be present
        const allKeywordConditions = keywords.map(keyword => {
          const keywordPattern = buildWordPattern(keyword);
          const condition = {
            $or: [
              { title: { $regex: keywordPattern, $options: 'i' } },
              { description: { $regex: keywordPattern, $options: 'i' } }
            ]
          };
          // If category matches found, also include category search
          if (categoryIds.length > 0) {
            condition.$or.push({ category: { $in: categoryIds } });
          }
          return condition;
        });
        
        // If searching for a specific product type, require it to be in title (more strict)
        if (hasProductTypeKeyword && keywords.length > 1) {
          const productTypeKeyword = keywords.find(kw => 
            productTypeKeywords.some(pt => kw.toLowerCase().includes(pt) || pt.includes(kw.toLowerCase()))
          );
          if (productTypeKeyword) {
            const escapedPTKeyword = buildWordPattern(productTypeKeyword);
            // Require product type keyword to be in title (more strict)
            allKeywordConditions.push({
              title: { $regex: escapedPTKeyword, $options: 'i' }
            });
          }
        }
        
        // Use AND logic - ALL keywords must match
        if (allKeywordConditions.length > 0) {
          query.$and = allKeywordConditions;
        }
      }
      // If only years, search for any of the years
      else if (years.length > 0) {
        // Also check for category matches
        const categoryMatches = await Category.find({
          name: { $regex: escapeRegExp(trimmedSearch), $options: 'i' }
        }).select('_id');
        const categoryIds = categoryMatches.map(cat => cat._id);
        
        const yearPatterns = [];
        years.forEach(year => {
          const escapedYear = escapeRegExp(year);
          yearPatterns.push(
            { title: { $regex: escapedYear, $options: 'i' } },
            { description: { $regex: escapedYear, $options: 'i' } }
          );
        });
        // Add category search if matches found
        if (categoryIds.length > 0) {
          yearPatterns.push({ category: { $in: categoryIds } });
        }
        query.$or = yearPatterns;
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
        // For search results, prioritize exact matches and relevance
        if (search && search.trim()) {
          // Custom sorting for better relevance
          // This will be handled in the aggregation pipeline below
          sortObject = { 
            isFeatured: -1, // Featured first
            title: 1, // Exact matches first
            createdAt: -1 // Then by newest
          };
        } else {
          sortObject = { isFeatured: -1, createdAt: -1 }; // Featured first, then newest
        }
        break;
      default:
        // If searching, default to relevance-based sorting
        if (search && search.trim()) {
          sortObject = { 
            isFeatured: -1, // Featured first
            title: 1,
            createdAt: -1 
          };
        } else {
          sortObject = { isFeatured: -1, title: 1 }; // Featured first, then alphabetical
        }
    }

    // For search results, use aggregation pipeline for better relevance scoring
    let products;
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      
      // Extract words from brackets: (word) or {word} or [word]
      const bracketWords = [];
      const bracketPatterns = [
        /\(([^)]+)\)/g,  // (word)
        /\{([^}]+)\}/g,  // {word}
        /\[([^\]]+)\]/g  // [word]
      ];
      
      bracketPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(trimmedSearch)) !== null) {
          bracketWords.push(match[1].trim().toLowerCase());
        }
      });
      
      // Remove bracket content from search string for normal processing
      let searchWithoutBrackets = trimmedSearch
        .replace(/\([^)]+\)/g, '')  // Remove (word)
        .replace(/\{[^}]+\}/g, '')  // Remove {word}
        .replace(/\[[^\]]+\]/g, ''); // Remove [word]
      
      const searchWords = searchWithoutBrackets.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      // Add bracket words to search words
      searchWords.push(...bracketWords);
      
      // Define product-specific keywords for bonus scoring
      const productTypeKeywords = ['grill', 'grille', 'bumper', 'lip', 'kit', 'light', 'drl', 'led', 'hood', 'spoiler', 'mirror', 'fender', 'door', 'headlight', 'taillight', 'fog', 'perfume', 'mat', 'muffler', 'pipe', 'alarm'];
      const hasProductTypeKeyword = searchWords.some(word => 
        productTypeKeywords.some(pt => word.includes(pt) || pt.includes(word))
      );
      
      products = await Product.aggregate([
        { $match: query },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                // Title starts with exact search phrase (highest priority)
                {
                  $cond: [
                    { $regexMatch: { input: { $toLower: "$title" }, regex: `^${search.trim().toLowerCase()}` } },
                    500, 0
                  ]
                },
                // Exact phrase match anywhere in title
                {
                  $cond: [
                    { $regexMatch: { input: { $toLower: "$title" }, regex: search.trim().toLowerCase() } },
                    400, 0
                  ]
                },
                // ALL keywords in title (very high score - ensures products matching all keywords appear first)
                {
                  $cond: [
                    { 
                      $and: searchWords.map(word => ({ 
                        $regexMatch: { input: { $toLower: "$title" }, regex: `\\b${word}\\b` } 
                      }))
                    },
                    300, 0
                  ]
                },
                // Bonus for product-type keyword in title (when searching for specific product types)
                {
                  $cond: [
                    {
                      $and: [
                        { $literal: hasProductTypeKeyword },
                        {
                          $or: productTypeKeywords.map(pt => ({
                            $regexMatch: { 
                              input: { $toLower: "$title" }, 
                              regex: `\\b${pt}\\b` 
                            }
                          }))
                        }
                      ]
                    },
                    200, 0
                  ]
                },
                // First word of title matches first search word
                {
                  $cond: [
                    { $regexMatch: { input: { $toLower: "$title" }, regex: `^${searchWords[0]}\\b` } },
                    150, 0
                  ]
                },
                // ALL keywords in description (medium score)
                {
                  $cond: [
                    { 
                      $and: searchWords.map(word => ({ 
                        $regexMatch: { input: { $toLower: "$description" }, regex: `\\b${word}\\b` } 
                      }))
                    },
                    100, 0
                  ]
                },
                // Individual keyword matches in title (word boundaries) - lower weight
                {
                  $sum: searchWords.map(word => ({
                    $cond: [
                      { $regexMatch: { input: { $toLower: "$title" }, regex: `\\b${word}\\b` } },
                      10, 0
                    ]
                  }))
                },
                // Individual keyword matches in description (word boundaries) - lowest weight
                {
                  $sum: searchWords.map(word => ({
                    $cond: [
                      { $regexMatch: { input: { $toLower: "$description" }, regex: `\\b${word}\\b` } },
                      5, 0
                    ]
                  }))
                },
                // Category name matches - medium priority
                {
                  $cond: [
                    { $regexMatch: { input: { $toLower: { $ifNull: ["$category.name", ""] } }, regex: search.trim().toLowerCase() } },
                    50, 0
                  ]
                }
              ]
            }
          }
        },
        { $sort: { isFeatured: -1, relevanceScore: -1, createdAt: -1 } }, // Featured first, then by relevance
        { $skip: limit === 0 ? 0 : (page - 1) * limit },
        { $limit: limit || 1000 },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $project: {
            title: 1,
            picture: 1,
            price: 1,
            description: 1,
            stock: 1,
            isFeatured: 1,
            createdAt: 1,
            user: { $arrayElemAt: ['$user', 0] },
            category: { $arrayElemAt: ['$category', 0] }
          }
        }
      ]);
    } else {
      products = await Product.find(query)
        .select('title picture price description stock isFeatured createdAt')
        .populate('user', 'name')
        .populate('category', 'name')
        .sort(sortObject)
        .skip(limit === 0 ? 0 : (page - 1) * limit)
        .limit(limit || undefined);
    }

    const newProductArray = products.map((product, index) => {
      const productObj = product.toObject ? product.toObject() : product;
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

// @route GET /api/products/search-suggestions
// @desc Get search suggestions/autocomplete for products
// @access Public
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        message: 'Search suggestions fetched successfully',
        data: []
      });
    }

    const searchTerm = q.trim();
    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const buildWordPattern = (value) => {
      const escaped = escapeRegExp(value);
      const startsWithWord = /\w/.test(value[0] || '');
      const endsWithWord = /\w/.test(value[value.length - 1] || '');
      if (startsWithWord && endsWithWord) return `\\b${escaped}\\b`;
      if (startsWithWord) return `\\b${escaped}`;
      if (endsWithWord) return `${escaped}\\b`;
      return escaped;
    };
    const buildStartsWithPattern = (value) => {
      const escaped = escapeRegExp(value);
      const endsWithWord = /\w/.test(value[value.length - 1] || '');
      return endsWithWord ? `^${escaped}\\b` : `^${escaped}`;
    };
    const escapedSearchTerm = escapeRegExp(searchTerm.toLowerCase());
    const searchLimit = Math.min(parseInt(limit) || 10, 20); // Max 20 suggestions
    
    // Extract words from brackets: (word) or {word} or [word]
    const bracketWords = [];
    const bracketPatterns = [
      /\(([^)]+)\)/g,  // (word)
      /\{([^}]+)\}/g,  // {word}
      /\[([^\]]+)\]/g  // [word]
    ];
    
    bracketPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(searchTerm)) !== null) {
        bracketWords.push(match[1].trim());
      }
    });
    
    // Remove bracket content from search string for normal processing
    let searchWithoutBrackets = searchTerm
      .replace(/\([^)]+\)/g, '')  // Remove (word)
      .replace(/\{[^}]+\}/g, '')  // Remove {word}
      .replace(/\[[^\]]+\]/g, ''); // Remove [word]
    
    // Build search query with relevance scoring
    const searchWords = searchWithoutBrackets.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    // Add bracket words to search words
    searchWords.push(...bracketWords.map(w => w.toLowerCase()));
    
    // Create search patterns for better matching
    const keywordPatterns = searchWords.map(keyword => {
      const wordPattern = buildWordPattern(keyword);
      return {
        $or: [
          { title: { $regex: wordPattern, $options: 'i' } },
          { description: { $regex: wordPattern, $options: 'i' } }
        ]
      };
    });

    // Query for products that match all keywords
    const query = {
      stock: { $gt: 0 }, // Only show in-stock products in suggestions
      $and: keywordPatterns.length > 0 ? keywordPatterns : []
    };

    // Use aggregation pipeline for relevance-based sorting
    const suggestions = await Product.aggregate([
      { $match: query },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Title starts with exact search phrase (highest priority)
              {
                $cond: [
                  { $regexMatch: { input: { $toLower: "$title" }, regex: `^${escapedSearchTerm}` } },
                  300, 0
                ]
              },
              // Exact phrase match in title
              {
                $cond: [
                  { $regexMatch: { input: { $toLower: "$title" }, regex: escapedSearchTerm } },
                  200, 0
                ]
              },
              // First word of title matches first search word
              {
                $cond: [
                  searchWords.length ? { $regexMatch: { input: { $toLower: "$title" }, regex: buildStartsWithPattern(searchWords[0]) } } : false,
                  150, 0
                ]
              },
              // All keywords in title
              {
                $cond: [
                  { 
                    $and: searchWords.map(word => ({ 
                      $regexMatch: { input: { $toLower: "$title" }, regex: buildWordPattern(word) } 
                    }))
                  },
                  100, 0
                ]
              },
              // Individual keyword matches in title
              {
                $sum: searchWords.map(word => ({
                  $cond: [
                    { $regexMatch: { input: { $toLower: "$title" }, regex: buildWordPattern(word) } },
                    30, 0
                  ]
                }))
              },
              // Individual keyword matches in description
              {
                $sum: searchWords.map(word => ({
                  $cond: [
                    { $regexMatch: { input: { $toLower: "$description" }, regex: buildWordPattern(word) } },
                    10, 0
                  ]
                }))
              }
            ]
          }
        }
      },
      { $sort: { relevanceScore: -1, createdAt: -1 } },
      { $limit: searchLimit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          picture: 1,
          price: 1,
          stock: 1,
          description: { $substr: ["$description", 0, 100] }, // Truncate description
          category: { $arrayElemAt: ['$category', 0] } // Get first category from array
        }
      }
    ]);

    // Format suggestions for frontend
    const formattedSuggestions = suggestions.map(product => ({
      _id: product._id,
      title: product.title,
      image: product.picture?.secure_url || null,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      category: product.category ? {
        _id: product.category._id,
        name: product.category.name
      } : null
    }));

    return res.status(200).json({
      success: true,
      message: 'Search suggestions fetched successfully',
      data: formattedSuggestions,
      count: formattedSuggestions.length
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching search suggestions',
      error: error.message
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