import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import OneLoader from '../ui/OneLoader';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import LazyImage from '../ui/LazyImage';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { trackSearch } from '@/utils/searchAnalytics';
import { getPopularSearches } from '@/utils/searchAnalytics';

import {
  Trash2,
  Edit,
  Search,
  PackageSearch,
  Plus,
  X,
  Eye
} from 'lucide-react';

import { toast } from 'sonner';
import { AddProduct, deleteSingleProduct, fetchProducts, updateProductStock } from '@/redux/slices/products/productSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';

const AllProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, status, currentPage, totalPages, totalItems } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // For actual search
  const [selectedProductId, setSelectedProductId] = useState(null); // For specific product from suggestion
  const [stockFilter, setStockFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gridType, setGridType] = useState('grid2'); // Changed from gridView to gridType to match ProductList
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPageLocal, setCurrentPageLocal] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  // State for all products (for suggestions)
  const [allProducts, setAllProducts] = useState([]);

  // Search history and popular searches
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([
    'toyota corolla grill',
    'honda civic bumper',
    'nissan altima headlight',
    'mazda 3 taillight',
    'hyundai elantra mirror'
  ]);

  // Memoized combined categories
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(categories || [])
  ], [categories]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return combinedCategories;
    return combinedCategories.filter(cat => 
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [combinedCategories, categorySearch]);

  // Debounced search to reduce API calls - reduced delay for better responsiveness
  const debouncedSearchTerm = useDebounce(activeSearchTerm, 150);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: ''
  });



  // Load search history and popular searches from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
        setSearchHistory([]);
      }
    }
    
    // Load popular searches from analytics
    const analyticsPopularSearches = getPopularSearches();
    if (analyticsPopularSearches.length > 0) {
      setPopularSearches(analyticsPopularSearches);
    }
  }, []);

  // Update active search term when user types
  useEffect(() => {
    setActiveSearchTerm(searchTerm);
  }, [searchTerm]);

  // Fetch categories
  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  // Fetch products on component mount
  useEffect(() => {
    dispatch(fetchProducts({ category: 'all', searchTerm: '', page: 1, limit: 12, stockFilter: 'all' }));
  }, [dispatch]);

  // Fetch products with debounced search
  useEffect(() => {
    // Reset to page 1 when search term changes
    if (debouncedSearchTerm !== activeSearchTerm && currentPageLocal > 1) {
      setCurrentPageLocal(1);
      return;
    }
    
    dispatch(fetchProducts({ 
      category: category, 
      searchTerm: debouncedSearchTerm, 
      page: currentPageLocal, 
      limit: 12,
      stockFilter: stockFilter,
      sortBy: 'az'
    })).then((res) => {
      // Go back one page if current page has no results
      if (res.payload?.data?.length === 0 && currentPageLocal > 1) {
        setCurrentPageLocal((prev) => prev - 1);
      }
    }).catch((error) => {
      console.error('Error fetching products:', error);
    });
  }, [dispatch, debouncedSearchTerm, currentPageLocal, stockFilter, activeSearchTerm, category]);

  // Fetch products for suggestions (only once on mount) - increased limit for better suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/get-products?limit=2000&stockFilter=all&sortBy=az`);
        const data = await response.json();
        if (data?.data) {
          setAllProducts(data.data);
        }
      } catch (error) {
        console.error('Error fetching products for suggestions:', error);
      }
    };
    fetchSuggestions();
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageLocal]);

  // Products are now sorted on the backend, so we use them directly
  const sortedProducts = useMemo(() => {
    let filtered = products.filter((product) => product && product._id);
    
    // If a specific product was selected from suggestions, show only that product
    if (selectedProductId) {
      filtered = filtered.filter(product => product._id === selectedProductId);
      return filtered;
    }
    
    // Additional filtering for search precision
    if (searchTerm && searchTerm.trim()) {
      const searchWords = searchTerm.toLowerCase().split(/\s+/);
      
      // Apply comprehensive search filtering for all search terms
      filtered = filtered.filter(product => {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        // Check if all search words are present in either title or description
        return searchWords.every(word => {
          const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(\\b|^)' + wordEscaped, 'i');
          return regex.test(title) || regex.test(description);
        });
      });
    }
    
    return filtered;
  }, [products, searchTerm, selectedProductId]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataObj.append(key, formData[key]);
        }
      });

      await dispatch(AddProduct(formDataObj)).unwrap();
      toast.success('Product added successfully!');
      setShowCreateForm(false);

      setFormData({ title: '', description: '', price: '', stock: '' });
    } catch (error) {
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, formData, isSubmitting]);

  // Handle product deletion
  const handleDelete = useCallback(async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteSingleProduct(productId)).unwrap();
        toast.success('Product deleted successfully!');
      } catch (error) {
        toast.error(error.message || 'Something went wrong!');
      }
    }
  }, [dispatch]);

  // Handle edit product
  const handleEdit = useCallback((product) => {
    navigate(`/admin/dashboard/update/${product._id}`);
  }, [navigate]);

  // Handle stock toggle
  const handleStockToggle = useCallback(async (product) => {
    try {
      const newStock = product.stock > 0 ? 0 : 1;
      await dispatch(updateProductStock({ 
        id: product._id, 
        stock: newStock 
      })).unwrap();
      
      toast.success(`Product ${newStock > 0 ? 'restocked' : 'marked as out of stock'}`);
    } catch (error) {
      toast.error(error || 'Failed to update stock status');
    }
  }, [dispatch]);


  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPageLocal(page);
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    setCategory(categoryId);
    setCategorySearch(''); // Clear category search
    setSearchTerm(''); // Clear search when selecting category
    setActiveSearchTerm(''); // Clear active search
    setSelectedProductId(null); // Clear selected product
    setCurrentPageLocal(1); // Reset to first page when changing category
  }, []);

  // Enhanced handlers for search and interactions
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setSelectedProductId(null); // Clear selected product when typing manually
    setCurrentPageLocal(1); // Reset to first page when searching
  }, []);

  const handleSearchSubmit = useCallback((term, productId = null) => {
    setActiveSearchTerm(term);
    setSelectedProductId(productId); // Set specific product ID if provided (null for Enter key)
    setCurrentPageLocal(1); // Reset to first page when searching
    
    // Track search for analytics
    if (term.trim()) {
      trackSearch(term);
      
      // Add to search history
      if (!searchHistory.includes(term.trim())) {
        const newHistory = [term.trim(), ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
    }
  }, [searchHistory]);


  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  // Only show main loader for initial loading, not for search/filter operations
  if (status === 'loading' && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <OneLoader size="large" text="Loading Products..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
       
      </div>
      
      {/* Enhanced Search and Filters - All in One Line */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          {/* Enhanced Search Bar */}
          <div className="flex-1">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              gridType={gridType}
              onGridTypeChange={handleGridTypeChange}
              searchHistory={searchHistory}
              popularSearches={popularSearches}
              products={allProducts}
            />
          </div>
          {/* Category Filter - Searchable Select */}
          <div className="w-full lg:w-20">
            <Select value={category} onValueChange={handleCategorySelect}>
              <SelectTrigger className="transition-all duration-200 hover:border-blue-500">
                <SelectValue placeholder="Search or select category" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No categories found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stock Filter */}
          <div className="w-full lg:w-40">
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="transition-all duration-200 hover:border-blue-500">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="active">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Enhanced Products Grid */}
      <div className={`grid gap-4 ${
        gridType === 'grid2' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {sortedProducts.map((product) => (
          <Card 
            key={product._id} 
            className={`p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              gridType === 'grid3' ? 'flex flex-row items-center gap-4' : ''
            }`}
          >
            {/* Product Image */}
            <div className={`relative aspect-square bg-gray-50 overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer ${
              gridType === 'grid3' ? 'w-24 h-24 flex-shrink-0' : 'w-full'
            }`}
            onClick={() => handlePreviewImage(product.image || product.picture?.secure_url)}
            >
              <LazyImage
                src={product.image || product.picture?.secure_url}
                alt={product.title}
                className="w-full h-full object-cover"
                fallback="/logo.jpeg"
                quality={85}
              />
              
              {/* Stock Badge */}
              <div className="absolute top-2 right-2">
                <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>

              {/* Hover overlay for image preview */}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Eye className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Product Info */}
            <div className={`mt-4 ${gridType === 'grid3' ? 'flex-1' : ''}`}>
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                {product.title}
              </h3>
              
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  PKR {product.price}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product._id)}
                    className="transition-all duration-200 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Out of Stock Button */}
                <Button
                  variant={product.stock > 0 ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleStockToggle(product)}
                  className={`w-full transition-all duration-200 ${
                    product.stock > 0 
                      ? 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600' 
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {product.stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Enhanced Pagination */}
      <Pagination
        currentPage={currentPageLocal}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Results Info */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Showing {sortedProducts.length} of {totalItems} products
        {totalPages > 1 && ` (Page ${currentPageLocal} of ${totalPages})`}
      </div>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <PackageSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || stockFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Get started by adding your first product'}
          </p>
          {!searchTerm && stockFilter === 'all' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-lg shadow-lg object-contain w-full h-auto max-h-[90vh]"
              loading="eager"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 lg:right-24 xl:right-24 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 px-2 text-sm md:text-base"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Product</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', description: '', price: '', stock: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>


              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Create Product'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default React.memo(AllProducts);