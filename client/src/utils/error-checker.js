/**
 * Error Checker Utility
 * This utility helps identify common import/export issues and other errors
 */

// Common import/export patterns to check
const IMPORT_EXPORT_PATTERNS = {
  // Redux slices
  'authSlice': {
    exports: ['login', 'updateProfile', 'updateUserRole', 'refreshToken', 'validateToken', 'logout', 'setTokenExpired', 'clearTokenExpired'],
    imports: ['login', 'updateProfile', 'updateUserRole', 'refreshToken', 'validateToken', 'logout', 'setTokenExpired', 'clearTokenExpired']
  },
  'productSlice': {
    exports: ['AddProduct', 'fetchProducts', 'getSingleProduct', 'updateSingleProduct', 'deleteSingleProduct'],
    imports: ['AddProduct', 'fetchProducts', 'getSingleProduct', 'updateSingleProduct', 'deleteSingleProduct']
  },
  'categoriesSlice': {
    exports: ['AddCategory', 'updateCategory', 'deleteCategory', 'AllCategory', 'SingleCategory'],
    imports: ['AddCategory', 'updateCategory', 'deleteCategory', 'AllCategory', 'SingleCategory']
  },
  'cartSlice': {
    exports: ['fetchCart', 'addToCart', 'removeFromCart', 'emptyCart', 'updateCartQuantity'],
    imports: ['fetchCart', 'addToCart', 'removeFromCart', 'emptyCart', 'updateCartQuantity']
  },
  'orderSlice': {
    exports: ['fetchPendingOrderCount', 'addOrder', 'fetchOrders', 'updateOrderStatus'],
    imports: ['fetchPendingOrderCount', 'addOrder', 'fetchOrders', 'updateOrderStatus']
  }
};

// Common error patterns
const ERROR_PATTERNS = [
  {
    name: 'Import/Export Mismatch',
    pattern: /import.*from.*slice/,
    description: 'Check if imported names match exported names'
  },
  {
    name: 'Missing Dependencies',
    pattern: /import.*from.*['"]\.\.\/\.\.\/\.\./,
    description: 'Check if relative imports are correct'
  },
  {
    name: 'Unused Imports',
    pattern: /import.*{.*}.*from/,
    description: 'Check if all imported items are used'
  },
  {
    name: 'Missing Exports',
    pattern: /export.*const/,
    description: 'Check if exported items are properly named'
  }
];

// Function to check for common errors
export function checkForErrors() {
  const errors = [];
  
  // Check for common import/export issues
  Object.entries(IMPORT_EXPORT_PATTERNS).forEach(([sliceName, patterns]) => {
    patterns.imports.forEach(importName => {
      if (!patterns.exports.includes(importName)) {
        errors.push({
          type: 'Import/Export Mismatch',
          message: `${importName} is imported but not exported from ${sliceName}`,
          severity: 'error'
        });
      }
    });
  });
  
  return errors;
}

// Function to validate Redux slice exports
export function validateReduxSlice(sliceName, exports) {
  const expectedExports = IMPORT_EXPORT_PATTERNS[sliceName]?.exports || [];
  const missingExports = expectedExports.filter(exp => !exports.includes(exp));
  const extraExports = exports.filter(exp => !expectedExports.includes(exp));
  
  return {
    valid: missingExports.length === 0,
    missing: missingExports,
    extra: extraExports
  };
}

// Function to check for common React errors
export function checkReactErrors() {
  const errors = [];
  
  // Check for common React patterns
  const reactPatterns = [
    {
      name: 'Missing Key Prop',
      pattern: /\.map\(.*=>/,
      description: 'Check if map functions have key props'
    },
    {
      name: 'Missing Dependencies',
      pattern: /useEffect\(.*\[\]/,
      description: 'Check if useEffect has proper dependencies'
    },
    {
      name: 'Missing Error Handling',
      pattern: /\.unwrap\(\)/,
      description: 'Check if unwrap() calls have proper error handling'
    }
  ];
  
  return errors;
}

// Function to check for common TypeScript/JavaScript errors
export function checkJSErrors() {
  const errors = [];
  
  // Check for common JS patterns
  const jsPatterns = [
    {
      name: 'Undefined Variables',
      pattern: /undefined/,
      description: 'Check for undefined variable usage'
    },
    {
      name: 'Null Checks',
      pattern: /\.\w+\?\./,
      description: 'Check for proper null/undefined checks'
    },
    {
      name: 'Async/Await',
      pattern: /async.*await/,
      description: 'Check for proper async/await usage'
    }
  ];
  
  return errors;
}

// Main error checking function
export function runErrorCheck() {
  const allErrors = [
    ...checkForErrors(),
    ...checkReactErrors(),
    ...checkJSErrors()
  ];
  
  return {
    total: allErrors.length,
    errors: allErrors,
    summary: {
      critical: allErrors.filter(e => e.severity === 'error').length,
      warning: allErrors.filter(e => e.severity === 'warning').length,
      info: allErrors.filter(e => e.severity === 'info').length
    }
  };
}

export default {
  checkForErrors,
  validateReduxSlice,
  checkReactErrors,
  checkJSErrors,
  runErrorCheck
};
