import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePagination } from '@/hooks/use-pagination';
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
import Pagination from './Pagination';

import {
  Trash2,
  Edit,
  Search,
  PackageSearch,
  Plus,
  X,
  Eye,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  MoreVertical,
  Star,
  TrendingUp,
  BarChart3,
  CheckSquare,
  Square,
  Upload as UploadIcon,
  Loader2,
  Download
} from 'lucide-react';

import { AddProduct, deleteSingleProduct, fetchProducts, updateProductStock, getSingleProduct, updateSingleProduct, bulkUpdateFeatured, searchProducts, clearSearchResults, importProductsFromExcel } from '@/redux/slices/products/productSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { useToast } from '@/hooks/use-toast';
import SearchSuggestions from './SearchSuggestions';

const AllProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, status, totalItems, searchResults, searchStatus, searchQuery: reduxSearchQuery } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const toast = useToast();

  // Get page number from URL params if available
  const searchParams = new URLSearchParams(location.search);
  const urlPage = searchParams.get('page');
  const initialPage = urlPage ? parseInt(urlPage, 10) : 1;

  // Local state for filters
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('az'); // Default to alphabetical (A-Z) sorting, same as user side
  const [limit, setLimit] = useState(24);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Use pagination hook
  const pagination = usePagination({
    initialPage: initialPage,
    initialLimit: limit,
    totalItems,
    onPageChange: (page) => {
      setCurrentPage(page);
    }
  });

  const pageSizeOptions = [24, 48, 72, 100];

  // Local state for UI-specific functionality
  const [categorySearch, setCategorySearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    picture: '',
    isFeatured: false,
  });
  const [editPreviewImage, setEditPreviewImage] = useState('');
  const [editCategorySearch, setEditCategorySearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProductFromSearch, setSelectedProductFromSearch] = useState(null);

  // Debounce category search to avoid too many API calls
  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedEditCategorySearch = useDebounce(editCategorySearch, 300);

  // Memoized combined categories - backend handles filtering, so we just combine with "All"
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(categories || [])
  ], [categories]);

  // Categories are now filtered by backend - no client-side filtering needed
  const filteredCategories = combinedCategories;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: ''
  });

  // Fetch categories - initial load
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);

  // Fetch categories from backend when search term changes (debounced)
  useEffect(() => {
    dispatch(AllCategory(debouncedCategorySearch));
  }, [dispatch, debouncedCategorySearch]);

  // Fetch categories for edit modal when search term changes (debounced)
  useEffect(() => {
    if (showEditModal) {
      dispatch(AllCategory(debouncedEditCategorySearch));
    }
  }, [dispatch, debouncedEditCategorySearch, showEditModal]);

  // Fetch products when filters change
  useEffect(() => {
    dispatch(fetchProducts({ category, page: currentPage, limit, stockFilter, sortBy }));
  }, [dispatch, category, currentPage, limit, stockFilter, sortBy]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Products are fully filtered and sorted on the backend
  // Show search results if searching, otherwise show regular products
  const sortedProducts = useMemo(() => {
    let productList = [];
    
    // If a specific product was selected from search suggestions, show only that product
    if (selectedProductFromSearch) {
      productList = [selectedProductFromSearch].filter(product => product && product._id);
    } else if (hasSearched && searchResults && searchResults.length > 0) {
      productList = searchResults.filter(product => product && product._id);
    } else {
      productList = products.filter(product => product && product._id);
    }
    
    // Remove duplicates by _id to prevent React key warnings
    const uniqueProducts = [];
    const seenIds = new Set();
    
    for (const product of productList) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueProducts.push(product);
      }
    }
    
    return uniqueProducts;
  }, [products, searchResults, hasSearched, selectedProductFromSearch]);

  // Get deduplicated search results count for accurate display
  const uniqueSearchResultsCount = useMemo(() => {
    if (!hasSearched || !searchResults || searchResults.length === 0) return 0;
    
    const seenIds = new Set();
    let count = 0;
    
    for (const product of searchResults) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        count++;
      }
    }
    
    return count;
  }, [searchResults, hasSearched]);

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
      setShowCreateForm(false);

      setFormData({ title: '', description: '', price: '', stock: '' });
    } catch (error) {
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
        toast.error(error || 'Failed to delete product. Please try again.');
      }
    }
  }, [dispatch, toast]);

  // Handle edit product - open modal instead of navigating
  const handleEdit = useCallback(async (product) => {
    try {
      setSelectedProduct(product);
      setShowEditModal(true);
      // Fetch full product details
      const result = await dispatch(getSingleProduct(product._id)).unwrap();
      if (result?.product) {
        const prod = result.product;
        setEditFormData({
          title: prod.title || '',
          description: prod.description || '',
          price: prod.price || '',
          stock: prod.stock || '',
          category: prod.category?._id || '',
          picture: '',
          isFeatured: prod.isFeatured || false,
        });
        setEditPreviewImage(prod.picture?.secure_url || prod.image || '');
      }
    } catch (error) {
    }
  }, [dispatch]);

  // Handle edit form submission
  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isUpdating || !selectedProduct) return;
    
    setIsUpdating(true);
    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      Object.keys(editFormData).forEach(key => {
        if (key === 'picture') {
          // Only append if it's a File object (new image uploaded)
          if (editFormData[key] instanceof File) {
            formDataObj.append(key, editFormData[key]);
          }
        } else if (key === 'isFeatured') {
          formDataObj.append(key, editFormData[key]);
        } else if (editFormData[key] !== '' && editFormData[key] !== null && editFormData[key] !== undefined) {
          formDataObj.append(key, editFormData[key]);
        }
      });

      const result = await dispatch(updateSingleProduct({ 
        id: selectedProduct._id, 
        inputValues: formDataObj 
      })).unwrap();
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditFormData({
        title: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        picture: '',
        isFeatured: false,
      });
      setEditPreviewImage('');
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, editFormData, isUpdating, selectedProduct, currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery]);

  // Handle edit form change
  const handleEditChange = useCallback((e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const file = files[0];
      setEditFormData((prev) => ({ ...prev, [name]: file }));
      setEditPreviewImage(URL.createObjectURL(file));
    } else if (type === 'checkbox') {
      setEditFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle edit category change
  const handleEditCategoryChange = useCallback((value) => {
    setEditFormData((prev) => ({ ...prev, category: value }));
    setEditCategorySearch('');
  }, []);

  // Handle stock toggle
  const handleStockToggle = useCallback(async (product) => {
    try {
      const newStock = product.stock > 0 ? 0 : 1;
      await dispatch(updateProductStock({ 
        id: product._id, 
        stock: newStock 
      })).unwrap();
      toast.success(`Product stock updated to ${newStock}`);
    } catch (error) {
      toast.error(error || 'Failed to update product stock');
    }
  }, [dispatch, toast]);


  // Handle page change using pagination hook
  const handlePageChange = useCallback((page) => {
    pagination.setCurrentPage(page);
  }, [pagination]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    // Clear category search
    setCategorySearch('');
    
    // Clear search results and search query when category changes
    dispatch(clearSearchResults());
    setSearchQuery('');
    setHasSearched(false);
    
    // Update category and reset page
    setCategory(categoryId);
    setCurrentPage(1);
  }, [dispatch]);


  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback((productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === sortedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(sortedProducts.map(p => p._id));
    }
  }, [selectedProducts.length, sortedProducts]);


  // Handle bulk mark as featured
  const handleBulkMarkFeatured = useCallback(async (isFeatured) => {
    if (selectedProducts.length === 0) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      await dispatch(bulkUpdateFeatured({ 
        productIds: selectedProducts, 
        isFeatured 
      })).unwrap();
      
      setSelectedProducts([]);
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter, 
        sortBy 
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`${selectedProducts.length} product(s) ${isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully!`);
    } catch (error) {
      toast.error(error || 'Failed to update products');
    } finally {
      setIsBulkUpdating(false);
    }
  }, [dispatch, selectedProducts, pagination.currentPage, category, limit, stockFilter, sortBy, toast, hasSearched, searchQuery]);

  const handleBulkStockUpdate = useCallback(async (stockValue) => {
    if (selectedProducts.length === 0) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedProducts.map((productId) =>
          dispatch(updateProductStock({ id: productId, stock: stockValue })).unwrap()
        )
      );

      setSelectedProducts([]);

      const currentPage = pagination.currentPage;
      
      // Refetch products
      await dispatch(fetchProducts({
        category,
        page: currentPage, 
        limit,
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`Stock updated for ${selectedProducts.length} product(s)!`);
    } catch (error) {
      toast.error(error || 'Failed to update stock');
    } finally {
      setIsBulkUpdating(false);
    }
  }, [dispatch, pagination.currentPage, selectedProducts, category, limit, stockFilter, sortBy, toast, hasSearched, searchQuery]);

  // Get category display name
  const getCategoryDisplayName = useCallback(() => {
    if (category === 'all') return 'All';
    const selectedCategory = categories?.find(cat => cat._id === category);
    return selectedCategory?.name || 'Category';
  }, [category, categories]);

  // Get sort display name
  const getSortDisplayName = useCallback(() => {
    const sortLabels = {
      'az': 'Name A-Z',
      'za': 'Name Z-A',
      'price-low': 'Price Low-High',
      'price-high': 'Price High-Low',
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'stock-high': 'Stock High-Low',
      'stock-low': 'Stock Low-High'
    };
    return sortLabels[sortBy] || 'Sort';
  }, [sortBy]);

  // Get stock filter display name
  const getStockDisplayName = useCallback(() => {
    if (stockFilter === 'all') return 'All Products';
    if (stockFilter === 'active') return 'In Stock';
    return 'Out of Stock';
  }, [stockFilter]);

  // Handle export products to CSV
  const handleExportProducts = useCallback(() => {
    try {
      // Get products to export - use sortedProducts which includes search results if in search mode
      let productsToExport = [];
      
      if (hasSearched && searchResults && searchResults.length > 0) {
        productsToExport = searchResults.filter(product => product && product._id);
      } else {
        productsToExport = products.filter(product => product && product._id);
      }

      if (productsToExport.length === 0) {
        toast.error('No products to export');
        return;
      }

      // Create CSV headers
      const headers = ['Title', 'Description', 'Price', 'Stock', 'Category', 'Featured', 'Image URL'];
      
      // Create CSV rows
      const csvRows = productsToExport.map(product => {
        const row = [
          product.title || '',
          (product.description || '').replace(/"/g, '""'), // Escape quotes in CSV
          product.price || '0',
          product.stock || '0',
          product.category?.name || '',
          product.isFeatured ? 'Yes' : 'No',
          product.picture?.secure_url || product.image || ''
        ];
        // Wrap each field in quotes and join with commas
        return row.map(field => `"${field}"`).join(',');
      });

      // Combine headers and rows
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...csvRows
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${productsToExport.length} product(s) successfully!`);
    } catch (error) {
      toast.error('Failed to export products. Please try again.');
    }
  }, [products, searchResults, hasSearched, toast]);

  // Handle import products from Excel
  const handleExcelImport = useCallback(async (file) => {
    if (!file) {
      toast.error('Please select an Excel file to import');
      return;
    }

    setImportLoading(true);
    try {
      const result = await dispatch(importProductsFromExcel(file)).unwrap();
      
      if (result.success) {
        setExcelFile(null);
        // Reset file input
        const fileInput = document.getElementById('excelFileImport');
        if (fileInput) fileInput.value = '';
        
        // Refresh products list
        const currentPage = pagination.currentPage;
        await dispatch(fetchProducts({ 
          category, 
          page: currentPage, 
          limit, 
          stockFilter,
          sortBy
        }));

        toast.success(`Successfully imported ${result.count || 0} product(s) from Excel`);
      }
    } catch (error) {
      toast.error(error || 'Failed to import products from Excel');
    } finally {
      setImportLoading(false);
    }
  }, [dispatch, pagination.currentPage, category, limit, stockFilter, sortBy, toast]);

  // Handle file selection for import
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      // Automatically trigger import when file is selected
      handleExcelImport(file);
    }
  }, [handleExcelImport]);

  // Handle inline price edit
  const handleStartEditPrice = useCallback((product) => {
    setEditingPriceId(product._id);
    setEditingPriceValue(product.price?.toString() || '');
  }, []);

  const handleCancelEditPrice = useCallback(() => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  }, []);

  const handleSavePrice = useCallback(async (productId) => {
    if (!editingPriceValue || isNaN(editingPriceValue) || parseFloat(editingPriceValue) < 0) {
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('price', editingPriceValue);

      await dispatch(updateSingleProduct({ 
        id: productId, 
        inputValues: formDataObj 
      })).unwrap();
      
      setEditingPriceId(null);
      setEditingPriceValue('');
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }
    } catch (error) {
    } finally {
      setIsUpdatingPrice(false);
    }
  }, [dispatch, editingPriceValue, pagination.currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery]);

  // Handle inline stock edit
  const handleStartEditStock = useCallback((product) => {
    setEditingStockId(product._id);
    setEditingStockValue(product.stock?.toString() || '');
  }, []);

  const handleCancelEditStock = useCallback(() => {
    setEditingStockId(null);
    setEditingStockValue('');
  }, []);

  const handleSaveStock = useCallback(async (productId) => {
    if (
      editingStockValue === '' ||
      isNaN(editingStockValue) ||
      parseInt(editingStockValue, 10) < 0
    ) {
      return;
    }

    setIsUpdatingStock(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('stock', editingStockValue);

      await dispatch(
        updateSingleProduct({
          id: productId,
          inputValues: formDataObj,
        })
      ).unwrap();

      setEditingStockId(null);
      setEditingStockValue('');

      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({
        category,
        page: currentPage, 
        limit,
        stockFilter,
        sortBy,
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }
    } catch (error) {
    } finally {
      setIsUpdatingStock(false);
    }
  }, [dispatch, editingStockValue, currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery]);

  // Handle toggle featured status
  const handleToggleFeatured = useCallback(async (product) => {
    setIsUpdatingFeatured(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('isFeatured', !product.isFeatured);

      await dispatch(updateSingleProduct({ 
        id: product._id, 
        inputValues: formDataObj 
      })).unwrap();
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`Product ${!product.isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully!`);
    } catch (error) {
      toast.error(error || 'Failed to update featured status');
    } finally {
      setIsUpdatingFeatured(false);
    }
  }, [dispatch, pagination.currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery, toast]);

  const handleLimitChange = useCallback((value) => {
    const newLimit = parseInt(value, 10);
    if (!Number.isNaN(newLimit)) {
      setLimit(newLimit);
      setCurrentPage(1);
    }
  }, []);

  // Search handlers
  const handleSearch = useCallback((query) => {
    const trimmedQuery = query ? query.trim() : searchQuery.trim();
    if (trimmedQuery.length === 0) {
      setHasSearched(false);
      return;
    }
    setSearchQuery(trimmedQuery);
    setHasSearched(true);
    dispatch(searchProducts({ query: trimmedQuery, limit: 100 }));
  }, [searchQuery, dispatch]);

  const handleSearchSelect = useCallback((product) => {
    setSearchQuery(product.title);
    setHasSearched(true);
    setSelectedProductFromSearch(product); // Set the selected product to show only this one
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setSearchQuery(value);
    // Clear selected product and search state when value is empty
    if (!value || value.trim() === '') {
      setSelectedProductFromSearch(null);
      setHasSearched(false);
      dispatch(clearSearchResults());
    } else if (selectedProductFromSearch) {
      setSelectedProductFromSearch(null);
    }
  }, [selectedProductFromSearch, dispatch]);
  
  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    setSelectedProductFromSearch(null);
    dispatch(clearSearchResults());
    // Also trigger onChange to update SearchSuggestions component
    if (handleSearchChange) {
      handleSearchChange({ target: { value: '' } });
    }
  }, [dispatch, handleSearchChange]);

  const handleSearchTrigger = useCallback((query) => {
    setHasSearched(true);
    setSelectedProductFromSearch(null); // Clear selected product when doing a new search
    dispatch(searchProducts({ query, limit: 100 }));
  }, [dispatch]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Product Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage your catalog and inventory</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  id="excelFileImport"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={importLoading}
                />
                <Button
                  onClick={() => {
                    const fileInput = document.getElementById('excelFileImport');
                    if (fileInput && !importLoading) {
                      fileInput.click();
                    }
                  }}
                  variant="outline"
                  className="h-8 sm:h-9 px-2 sm:px-3 border-gray-300 hover:bg-gray-100 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                  disabled={importLoading}
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="hidden sm:inline">Importing...</span>
                      <span className="sm:hidden">Importing</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Import</span>
                      <span className="sm:hidden">Import</span>
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={handleExportProducts}
                variant="outline"
                className="h-8 sm:h-9 px-2 sm:px-3 border-gray-300 hover:bg-gray-100 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <PackageSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{totalItems}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">Total Products</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {products.filter(p => p.stock > 0).length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">In Stock</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {products.filter(p => p.stock === 0).length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">Out of Stock</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{categories?.length || 0}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">Categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded border border-gray-200 p-2 sm:p-3 mb-4 sm:mb-6">
          {/* Mobile Layout: Search + Grid in one row, Filters in another row */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            {/* Search Input with Grid Toggles (Mobile) / Search Button (Desktop) */}
            <div className="relative flex-1 min-w-0 flex items-center gap-2">
              <div className="relative flex-1 min-w-0 [&>div>div>div>svg[class*='left']]:hidden">
                <SearchSuggestions
                  placeholder="Search products..."
                  onSelectProduct={handleSearchSelect}
                  onSearch={handleSearchTrigger}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  showButton={false}
                  inputClassName="h-8 sm:h-9 text-xs sm:text-sm pl-3 pr-10 border-gray-300 rounded"
                  className="w-full"
                />
              </div>
              {/* Grid Type Toggle - Show on Mobile */}
              <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGridType('grid2')}
                  className={`h-8 w-8 p-0 rounded ${
                    gridType === 'grid2' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGridType('grid3')}
                  className={`h-8 w-8 p-0 rounded ${
                    gridType === 'grid3' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Search Button - Show on Desktop */}
              <Button
                onClick={() => handleSearchTrigger(searchQuery)}
                className="hidden sm:flex h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded whitespace-nowrap text-sm flex-shrink-0"
              >
                Search
              </Button>
            </div>
            
            {/* Grid Type Toggle - Show on Desktop */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridType('grid2')}
                className={`h-9 w-9 p-0 rounded ${
                  gridType === 'grid2' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridType('grid3')}
                className={`h-9 w-9 p-0 rounded ${
                  gridType === 'grid3' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filter Dropdowns - One row on mobile, inline on desktop */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Filter Dropdown */}
              <Select value={category} onValueChange={handleCategorySelect}>
                <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[120px] overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <SelectValue className="flex-1 min-w-0">
                      <span className="truncate block">{getCategoryDisplayName()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="mb-2 h-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id} className="text-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Stock Filter Dropdown */}
              <Select value={stockFilter} onValueChange={(value) => { setStockFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[140px] overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <SelectValue className="flex-1 min-w-0">
                      <span className="truncate block">{getStockDisplayName()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="active">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[140px] overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <SortAsc className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <SelectValue className="flex-1 min-w-0">
                      <span className="truncate block">{getSortDisplayName()}</span>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">Name A-Z</SelectItem>
                  <SelectItem value="za">Name Z-A</SelectItem>
                  <SelectItem value="price-low">Price Low-High</SelectItem>
                  <SelectItem value="price-high">Price High-Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="stock-high">Stock High-Low</SelectItem>
                  <SelectItem value="stock-low">Stock Low-High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Search Results Info */}
          {hasSearched && searchQuery && (
            <div className="mt-2 text-[10px] sm:text-xs text-gray-600">
              {searchStatus === 'loading' ? (
                'Searching...'
              ) : uniqueSearchResultsCount > 0 ? (
                `Found ${uniqueSearchResultsCount} result${uniqueSearchResultsCount !== 1 ? 's' : ''} for "${searchQuery}"`
              ) : (
                `No results found for "${searchQuery}"`
              )}
            </div>
          )}
        </div>
      
        {/* Products Grid */}
        <div className="space-y-4">
          
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={handleSelectAll}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                title={selectedProducts.length === sortedProducts.length ? 'Deselect all' : 'Select all'}
              >
                {selectedProducts.length === sortedProducts.length && sortedProducts.length > 0 ? (
                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                ) : (
                  <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                )}
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Products ({sortedProducts.length})
              </h2>
              {selectedProducts.length > 0 && (
                <Badge variant="default" className="px-1.5 sm:px-2 py-0.5 bg-blue-600 text-[10px] sm:text-xs">
                  {selectedProducts.length} selected
                </Badge>
              )}
            </div>
            
            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStockUpdate(0)}
                  disabled={isBulkUpdating}
                  className="border-gray-300 text-red-600 hover:bg-red-50 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Mark Out of Stock</span>
                  <span className="sm:hidden">Out Stock</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStockUpdate(1)}
                  disabled={isBulkUpdating}
                  className="border-gray-300 text-green-600 hover:bg-green-50 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Mark In Stock</span>
                  <span className="sm:hidden">In Stock</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleBulkMarkFeatured(true)}
                  disabled={isBulkUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
                >
                  <Star className="h-3 w-3 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Featured</span>
                  <span className="sm:hidden">Star</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkMarkFeatured(false)}
                  disabled={isBulkUpdating}
                  className="border-gray-300 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Remove Featured</span>
                  <span className="sm:hidden">Remove</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="text-gray-600 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className={`grid gap-3 ${
            gridType === 'grid2' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {sortedProducts.map((product, index) => (
              <Card 
                key={product._id || `product-${index}`} 
                className={`group relative overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-colors ${
                  selectedProducts.includes(product._id) ? 'ring-2 ring-blue-500' : ''
                } ${
                  gridType === 'grid3' ? 'flex flex-row items-center gap-4 p-3' : 'p-0'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductSelect(product._id);
                    }}
                    className="p-1 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                    title={selectedProducts.includes(product._id) ? 'Deselect' : 'Select'}
                  >
                    {selectedProducts.includes(product._id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="p-1.5  rounded-full shadow-sm">
                      <Star className="h-4 w-4 text-red-500 fill-red-500" />
                    </div>
                  </div>
                )}

                {/* Product Image */}
                <div className={`relative overflow-hidden bg-gray-100 cursor-pointer ${
                  gridType === 'grid3' 
                    ? 'w-20 h-20 flex-shrink-0 rounded border border-gray-200' 
                    : 'aspect-square w-full border-b border-gray-200'
                }`}
                onClick={() => handlePreviewImage(product.image || product.picture?.secure_url)}
                >
                  <LazyImage
                    src={product.image || product.picture?.secure_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    fallback="/logo.jpeg"
                    quality={90}
                    loading="eager"
                  />
                  
                  {/* Stock Badge */}
                  {!product.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <Badge 
                        className={`px-1.5 py-0.5 text-xs font-medium border-0 ${
                          product.stock > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                      <Eye className="h-4 w-4 text-gray-900" />
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className={`${gridType === 'grid3' ? 'flex-1 space-y-1.5' : 'p-3 sm:p-4 space-y-2 sm:space-y-3'}`}>
                  <div className="space-y-1">
                    <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <p className="text-gray-600 text-[10px] sm:text-xs line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      {editingPriceId === product._id ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 relative z-0">
                          <Input
                            type="number"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSavePrice(product._id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditPrice();
                              }
                            }}
                            className="h-7 sm:h-8 text-xs sm:text-sm font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-20 sm:w-24"
                            autoFocus
                            disabled={isUpdatingPrice}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSavePrice(product._id);
                            }}
                            disabled={isUpdatingPrice}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-green-600 hover:bg-green-700"
                            type="button"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEditPrice();
                            }}
                            disabled={isUpdatingPrice}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            type="button"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                            PKR {product.price?.toLocaleString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditPrice(product);
                            }}
                            className="p-0.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Edit price"
                          >
                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 hover:text-blue-600" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {editingStockId === product._id ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Input
                              type="number"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveStock(product._id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditStock();
                                }
                              }}
                              className="h-7 sm:h-8 text-[10px] sm:text-xs font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-16 sm:w-20"
                              autoFocus
                              disabled={isUpdatingStock}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveStock(product._id);
                              }}
                              disabled={isUpdatingStock}
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-green-600 hover:bg-green-700"
                              type="button"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEditStock();
                              }}
                              disabled={isUpdatingStock}
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                              type="button"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                              Stock: {product.stock}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditStock(product);
                              }}
                              className="p-0.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                              title="Edit stock"
                            >
                              <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 hover:text-blue-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Featured Star */}
                    <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFeatured(product);
                        }}
                        disabled={isUpdatingFeatured}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={product.isFeatured ? 'Unmark as featured' : 'Mark as featured'}
                      >
                        <Star className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                          product.isFeatured 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-400 hover:text-red-400'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs border-gray-300 hover:bg-gray-100"
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product._id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStockToggle(product)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
                          product.stock > 0 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={product.stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
                      >
                         <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white rounded border border-gray-200 p-3 sm:p-4 mt-4 sm:mt-6">
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{pagination.startItem}</span> to{' '}
              <span className="font-medium text-gray-900">{pagination.endItem}</span> of{' '}
              <span className="font-medium text-gray-900">{totalItems}</span> products
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Rows:</span>
                <Select value={String(limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-[80px] sm:w-[100px] h-8 sm:h-9 border-gray-200 rounded-lg text-xs sm:text-sm">
                    <SelectValue placeholder="24 items" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="h-8 w-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {stockFilter !== 'all' 
                  ? 'No matching products' 
                  : 'No products found'
                }
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                {stockFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Get started by creating your first product.'
                }
              </p>
              
              <div className="flex justify-center gap-2">
                {stockFilter !== 'all' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStockFilter('all');
                        setCurrentPage(1);
                      }}
                      className="px-4 border-gray-300 hover:bg-gray-100"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Professional Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setPreviewImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Product image preview"
          >
            <div
              className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
                <img
                  src={previewImage}
                  alt="Product Preview"
                  className="object-contain w-full h-auto max-h-[85vh]"
                  loading="eager"
                />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition-colors shadow-lg"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Professional Create Product Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create New Product</h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Add a new product to your catalog</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ title: '', description: '', price: '', stock: '' });
                  }}
                  className="text-gray-500 hover:text-gray-900 rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                        Product Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter product title"
                        required
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                        Price (PKR) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your product..."
                      required
                      rows={4}
                      className="border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg resize-none min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-semibold text-gray-700">
                      Stock Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="Enter stock quantity"
                      required
                      className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormData({ title: '', description: '', price: '', stock: '' });
                      }}
                      className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Product
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Professional Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Product</h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Update product details</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setEditFormData({
                      title: '',
                      description: '',
                      price: '',
                      stock: '',
                      category: '',
                      picture: '',
                      isFeatured: false,
                    });
                    setEditPreviewImage('');
                  }}
                  className="text-gray-500 hover:text-gray-900 rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">
                        Product Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-title"
                        name="title"
                        value={editFormData.title}
                        onChange={handleEditChange}
                        placeholder="Enter product title"
                        required
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-price" className="text-sm font-semibold text-gray-700">
                        Price (PKR) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-price"
                        name="price"
                        type="number"
                        value={editFormData.price}
                        onChange={handleEditChange}
                        placeholder="0.00"
                        required
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select value={editFormData.category} onValueChange={handleEditCategoryChange}>
                      <SelectTrigger className="h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search categories..."
                            value={editCategorySearch}
                            onChange={(e) => setEditCategorySearch(e.target.value)}
                            className="mb-2 h-8 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id} className="py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      placeholder="Describe your product..."
                      required
                      rows={4}
                      className="border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg resize-none min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-stock" className="text-sm font-semibold text-gray-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-stock"
                        name="stock"
                        type="number"
                        value={editFormData.stock}
                        onChange={handleEditChange}
                        placeholder="Enter stock quantity"
                        required
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-picture" className="text-sm font-semibold text-gray-700">
                        Product Image
                      </Label>
                      <label
                        htmlFor="edit-picture"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition duration-200 group"
                      >
                        <div className="flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
                           <UploadIcon className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                           <span className="text-gray-500 text-xs font-medium group-hover:text-blue-600">Click to upload</span>
                        </div>
                        <Input
                          type="file"
                          id="edit-picture"
                          name="picture"
                          accept="image/*"
                          onChange={handleEditChange}
                          className="hidden"
                        />
                      </label>
                      {editPreviewImage && (
                        <div className="relative mt-2 w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={editPreviewImage}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditPreviewImage('');
                              setEditFormData((prev) => ({ ...prev, picture: '' }));
                            }}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-1.5 shadow-sm transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured Checkbox */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <input
                      type="checkbox"
                      id="edit-isFeatured"
                      name="isFeatured"
                      checked={editFormData.isFeatured || false}
                      onChange={handleEditChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <Label htmlFor="edit-isFeatured" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                      <Star className={`h-4 w-4 ${editFormData.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      <span>Mark as Featured Product</span>
                    </Label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedProduct(null);
                        setEditFormData({
                          title: '',
                          description: '',
                          price: '',
                          stock: '',
                          category: '',
                          picture: '',
                          isFeatured: false,
                        });
                        setEditPreviewImage('');
                      }}
                      className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Update Product
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default React.memo(AllProducts);