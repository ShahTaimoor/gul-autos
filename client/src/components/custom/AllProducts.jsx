import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

import {
  Trash2,
  Edit,
  Search,
  PackageSearch,
  Plus,
  X,
  Filter,
  Grid3X3,
  List,
  Eye,
  EyeOff
} from 'lucide-react';

import { toast } from 'sonner';
import { AddProduct, deleteSingleProduct, fetchProducts } from '@/redux/slices/products/productSlice';
import { AllCategory, AddCategory, deleteCategory } from '@/redux/slices/categories/categoriesSlice';

const AllProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, status, currentPage, totalPages, totalItems } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gridView, setGridView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPageLocal, setCurrentPageLocal] = useState(1);

  // Debounced search to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Form sta
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: ''
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch products and categories on component mount
  useEffect(() => {
    dispatch(fetchProducts({ category: 'all', searchTerm: '', page: 1, limit: 12 }));
    dispatch(AllCategory());
  }, [dispatch]);

  // Fetch products with debounced search
  useEffect(() => {
    dispatch(fetchProducts({ 
      category: selectedCategory, 
      searchTerm: debouncedSearchTerm, 
      page: currentPageLocal, 
      limit: 12,
      stockFilter 
    }));
  }, [dispatch, selectedCategory, debouncedSearchTerm, currentPageLocal, stockFilter]);

  // Use products directly since filtering is now done on the backend
  const filteredProducts = products || [];

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

      setFormData({ title: '', description: '', price: '', category: '', stock: '' });
    } catch (error) {
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, formData, isSubmitting]);

  // Handle category form submission
  const handleCategorySubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await dispatch(AddCategory(categoryFormData)).unwrap();
      toast.success('Category created successfully!');
      setShowCategoryForm(false);

      setCategoryFormData({ name: '', description: '' });
    } catch (error) {
      toast.error(error.message || 'Something went wrong!');
    }
  }, [dispatch, categoryFormData]);

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

  // Handle category deletion
  const handleCategoryDelete = useCallback(async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
        toast.success('Category deleted successfully!');
      } catch (error) {
        toast.error(error.message || 'Something went wrong!');
      }
    }
  }, [dispatch]);

  // Handle edit product
  const handleEdit = useCallback((product) => {
    navigate(`/admin/dashboard/update/${product._id}`);
  }, [navigate]);

  // Handle edit category
  const handleCategoryEdit = useCallback((category) => {
    setSelectedProduct(category);
    setCategoryFormData({
      name: category.name,
      description: category.description
    });
    setShowCategoryForm(true);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPageLocal(page);
  }, []);

  // Handle search with debounce
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPageLocal(1); // Reset to first page when searching
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              {status === 'loading' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="transition-all duration-200 hover:border-blue-500">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category._id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Filter */}
          <div className="w-full lg:w-48">
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

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={gridView === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridView('grid')}
              className="transition-all duration-200"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridView('list')}
              className="transition-all duration-200"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={`grid gap-6 ${
        gridView === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      } ${status === 'loading' && products.length > 0 ? 'opacity-75 pointer-events-none' : ''}`}>
        {filteredProducts.map((product) => (
          <Card 
            key={product._id} 
            className={`p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              gridView === 'list' ? 'flex flex-row items-center gap-4' : ''
            }`}
          >
            {/* Product Image */}
            <div className={`relative aspect-square bg-gray-50 overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 ${
              gridView === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full'
            }`}>
              <LazyImage
                src={product.image || product.picture?.secure_url}
                alt={product.title}
                className="w-full h-full"
                fallback="/placeholder-product.jpg"
                quality={85}
              />
              
              {/* Stock Badge */}
              <div className="absolute top-2 right-2">
                <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>
            </div>

            {/* Product Info */}
            <div className={`mt-4 ${gridView === 'list' ? 'flex-1' : ''}`}>
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                {product.title}
              </h3>
              
              {/* Category Badge */}
              {product.category && (
                <div className="mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {(product.category.name || product.category)
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ')
                    }
                  </Badge>
                </div>
              )}
              
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
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPageLocal - 1)}
            disabled={currentPageLocal === 1}
            className="transition-all duration-200"
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPageLocal <= 3) {
                pageNum = i + 1;
              } else if (currentPageLocal >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPageLocal - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPageLocal === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="transition-all duration-200"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPageLocal + 1)}
            disabled={currentPageLocal === totalPages}
            className="transition-all duration-200"
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-500 mt-4">
        {status === 'loading' && products.length > 0 ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            Searching...
          </span>
        ) : (
          <>
            Showing {filteredProducts.length} of {totalItems} products
            {totalPages > 1 && ` (Page ${currentPageLocal} of ${totalPages})`}
          </>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <PackageSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Get started by adding your first product'}
          </p>
          {!searchTerm && selectedCategory === 'all' && stockFilter === 'all' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
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
                  setFormData({ title: '', description: '', price: '', category: '', stock: '' });
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

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Create Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Category</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCategoryForm(false);
                  setCategoryFormData({ name: '', description: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Name</Label>
                <Input
                  id="categoryName"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full transition-all duration-200 hover:scale-105">
                Create Category
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AllProducts);