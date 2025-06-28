import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import {
  Loader2,
  Trash2,
  Edit,
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts, deleteSingleProduct } from '@/redux/slices/products/productSlice';

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

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories } = useSelector((s) => s.categories);
  const { products, status, totalPages } = useSelector((s) => s.products);

  const loading = status === 'loading';
  const noProducts = status === 'succeeded' && products.length === 0;

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm, page, limit }));
  }, [category, searchTerm, page, limit, dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteSingleProduct(id));
    }
  };

  const filteredProducts =
    stockFilter === 'active'
      ? products.filter((p) => p.stock > 0)
      : stockFilter === 'out-of-stock'
      ? products.filter((p) => p.stock <= 0)
      : products;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categoryInput.toLowerCase())
  );

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
        All Products
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
                    All Categories
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
                  setStockFilter(tab);
                  setPage(1);
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
                          className={`inline-block w-2 h-2 rounded-full ${
                            p.stock > 10
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
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => navigate(`/admin/dashboard/update/${p._id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(p._id)}
                          variant="destructive"
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
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

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = totalPages <= 5
                    ? i + 1
                    : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
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
    </motion.div>
  );
};

export default AllProducts;
