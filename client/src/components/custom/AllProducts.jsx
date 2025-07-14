import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import {
 
  Trash2,
  Edit,
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  PackageX,
  Save,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts, deleteSingleProduct, updateSingleProduct } from '@/redux/slices/products/productSlice';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

const capitalizeAllWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AllProducts = () => {
  const [category, setCategory] = useState('all');
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(24);

  // Dialog states
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToMarkOutOfStock, setProductToMarkOutOfStock] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: null
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories } = useSelector((s) => s.categories);
  const { products, status, totalPages, currentPage, totalItems } = useSelector((s) => s.products);

  const loading = status === 'loading';
  const noProducts = status === 'succeeded' && products.length === 0;

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm, page, limit, stockFilter }));
  }, [category, searchTerm, page, limit, stockFilter, dispatch]);

  // Add this new useEffect to ensure page resets when stock filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [stockFilter]);

  const handleDelete = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    dispatch(deleteSingleProduct(productToDelete._id))
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          toast.success('Product deleted successfully');
        } else {
          toast.error('Failed to delete product');
        }
      })
      .finally(() => {
        setProductToDelete(null);
      });
  };

  const handleOutOfStock = (product) => {
    setProductToMarkOutOfStock(product);
  };

  const confirmMarkOutOfStock = () => {
    if (!productToMarkOutOfStock) return;

    const formData = new FormData();
    formData.append('stock', '0');

    dispatch(updateSingleProduct({
      id: productToMarkOutOfStock._id,
      inputValues: formData
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Product marked as out of stock');
        
        if (stockFilter === 'out-of-stock') {
          dispatch(fetchProducts({ 
            category, 
            searchTerm, 
            page, 
            limit, 
            stockFilter: 'out-of-stock'
          }));
        }
      } else {
        toast.error('Failed to update product');
        dispatch(fetchProducts({ 
          category, 
          searchTerm, 
          page, 
          limit, 
          stockFilter 
        }));
      }
    }).finally(() => {
      setProductToMarkOutOfStock(null);
    });
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category?._id || '',
      image: null
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

   

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('title', editFormData.title);
      formData.append('description', editFormData.description);
      formData.append('price', editFormData.price);
      formData.append('stock', editFormData.stock);
      formData.append('category', editFormData.category);
      
      if (editFormData.image) {
        formData.append('image', editFormData.image);
      }

      const result = await dispatch(updateSingleProduct({
        id: selectedProduct._id,
        inputValues: formData
      })).unwrap();

      if (result.success) {
        toast.success('Product updated successfully');
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        setEditFormData({
          title: '',
          description: '',
          price: '',
          stock: '',
          category: '',
          image: null
        });
        // Refresh the products list
        dispatch(fetchProducts({ category, searchTerm, page, limit, stockFilter }));
      } else {
        toast.error(result.message || 'Failed to update product');
      }
    } catch (error) {
      toast.error(error || 'Failed to update product');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const filteredProducts =
    stockFilter === 'active'
      ? products.filter((p) => p.stock > 0)
      : stockFilter === 'out-of-stock'
      ? products.filter((p) => p.stock <= 0)
      : products;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const hoverEffect = {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
    >
      <motion.h1
        className='text-2xl mb-5'
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.1 }}
      >
        All Products ({totalItems})
      </motion.h1>

      {/* Filter Section */}
      <motion.div
        className="bg-white rounded-lg shadow-sm p-4 mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <motion.div
            className="relative flex-1"
            whileHover={{ scale: 1.01 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name..."
              className="pl-9"
            />
          </motion.div>

          {/* Category Dropdown */}
          <div className="relative w-[180px]">
            <Input
              placeholder="Search category"
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setShowCategoryDropdown(true);
              }}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
              className="w-full"
            />
            <AnimatePresence>
              {showCategoryDropdown && (
                <motion.ul
                  className="absolute z-50 w-full mt-1 bg-white text-black shadow-lg rounded-md border max-h-60 overflow-y-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <li
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => {
                      setCategory('all');
                      setCategoryInput('');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    All Categorie
                  </li>
                  {filteredCategories.map((cat) => (
                    <li
                      key={cat._id}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      onClick={() => {
                        setCategory(cat._id);
                        setCategoryInput(cat.name);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {cat.name}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stock Filter Tabs */}
        <motion.div
          className="flex gap-3 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {['all', 'active', 'out-of-stock'].map((tab) => (
            <motion.div key={tab} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={stockFilter === tab ? 'default' : 'outline'}
                onClick={() => {
                  setPage(1);
                  setStockFilter(tab);
                }}
                size="sm"
              >
                {tab === 'all' ? 'All' : tab === 'active' ? 'In Stock' : 'Out of Stock'}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Loading Skeleton */}
      {loading && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div key={i} variants={item}>
              <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* No Products Found */}
      <AnimatePresence>
        {noProducts && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-16 gap-4 text-center"
          >
            <PackageSearch className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search or filter'
                : 'Add a new product to get started'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      {!loading && filteredProducts.length > 0 && (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredProducts.map((p) => (
              <motion.div key={p._id} variants={item} whileHover={hoverEffect}>
                <Card className="group transition-all duration-300 border hover:shadow-xl rounded-2xl overflow-hidden flex flex-col h-full">
                  <motion.div className="relative aspect-square bg-gray-50 overflow-hidden" whileHover={{ scale: 1.05 }}>
                    <img
                      src={p.image || '/placeholder-product.jpg'}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                    />
                    {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Badge variant="destructive" className="text-xs py-1 px-2 rounded-full">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </motion.div>

                  <div className="flex flex-col p-4 flex-1">
                    <div className="space-y-1 mb-2">
                      <h2 className="text-base font-semibold line-clamp-2">
                        {capitalizeAllWords(p.title)}
                      </h2>
                    </div>
                    <div className="mt-auto pt-2">
                      <div className="flex justify-between gap-3.5 items-center">
                        <Badge variant="outline">Rs {p.price}</Badge>
                        {p.category?.name && (
                          <span className="text-sm text-muted-foreground">
                            {capitalizeAllWords(p.category.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${p.stock > 10
                              ? 'bg-green-500'
                              : p.stock > 0
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(p)}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                onClick={() => handleDelete(p)}
                                variant="destructive"
                                size="sm"
                                className="flex-1 gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>"{capitalizeAllWords(p.title)}"</strong>? 
                                  This action will:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Permanently remove the product from the system</li>
                                    <li>Delete the product image</li>
                                    <li>This action cannot be undone</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={confirmDelete}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Product
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              onClick={() => handleOutOfStock(p)}
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              disabled={p.stock <= 0}
                            >
                              <PackageX className="w-4 h-4" />
                              {p.stock <= 0 ? 'Already Out of Stock' : 'Mark Out of Stock'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark Out of Stock</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark <strong>"{capitalizeAllWords(p.title)}"</strong> as out of stock? 
                                This will:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Set the product stock to 0</li>
                                  <li>Hide the product from active stock filters</li>
                                  <li>You can re-enable it later by updating the stock</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={confirmMarkOutOfStock}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Mark Out of Stock
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              className="mt-8 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Always show first page */}
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                )}

                {/* Show ellipsis if current page is more than 2 pages away from start */}
                {page > 3 && <span className="px-2">...</span>}

                {/* Show previous page if not first page */}
                {page > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                  >
                    {page - 1}
                  </Button>
                )}

                {/* Current page */}
                <Button
                  variant="default"
                  size="sm"
                >
                  {page}
                </Button>

                {/* Show next page if not last page */}
                {page < totalPages - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {page + 1}
                  </Button>
                )}

                {/* Show ellipsis if current page is more than 2 pages away from end */}
                {page < totalPages - 2 && <span className="px-2">...</span>}

                {/* Always show last page if not first page */}
                {page < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details for "{selectedProduct?.title}"
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Current Product Preview */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={selectedProduct.image || '/placeholder-product.jpg'}
                  alt={selectedProduct.title}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold">{capitalizeAllWords(selectedProduct.title)}</h3>
                  <p className="text-sm text-gray-600">Rs {selectedProduct.price}</p>
                  <p className="text-sm text-gray-600">{selectedProduct.stock} in stock</p>
                  <p className="text-sm text-gray-600">{selectedProduct.category?.name}</p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="title">Product Name </Label>
                  <Input
                    id="title"
                    value={editFormData.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Rs) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => handleEditFormChange('price', e.target.value)}
                    placeholder="Enter price"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editFormData.stock}
                    onChange={(e) => handleEditFormChange('stock', e.target.value)}
                    placeholder="Enter stock quantity"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category </Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => handleEditFormChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image">Product Image</Label>
                  <div className="flex items-center gap-4">
                    <img
                      src={editFormData.image ? URL.createObjectURL(editFormData.image) : (selectedProduct.image || '/placeholder-product.jpg')}
                      alt="Product preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <div className="flex-1">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to keep current image
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AllProducts;