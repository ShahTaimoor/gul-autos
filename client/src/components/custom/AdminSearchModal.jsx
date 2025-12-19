import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, X, Loader2, PackageSearch, Edit, TrendingUp } from 'lucide-react';
import { searchProducts, updateSingleProduct, updateProductStock } from '../../redux/slices/products/productSlice';
import LazyImage from '../ui/LazyImage';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

const AdminSearchModal = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { searchResults, searchStatus, searchQuery } = useSelector((state) => state.products);
  
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  
  // Edit states
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setHasSearched(false);
    }
  }, [open]);

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return;
    }
    setHasSearched(true);
    dispatch(searchProducts({ query: trimmedQuery, limit: 50 }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleProductClick = (productId) => {
    // Navigate to edit product page
    navigate(`/admin/dashboard/update-product/${productId}`);
    onOpenChange(false);
  };

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
      
      // Refresh search results
      if (query.trim()) {
        dispatch(searchProducts({ query: query.trim(), limit: 50 }));
      }
      
      toast.success('Price updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update price');
    } finally {
      setIsUpdatingPrice(false);
    }
  }, [dispatch, editingPriceValue, query, toast]);

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

      // Refresh search results
      if (query.trim()) {
        dispatch(searchProducts({ query: query.trim(), limit: 50 }));
      }
      
      toast.success('Stock updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  }, [dispatch, editingStockValue, query, toast]);

  // Handle stock toggle
  const handleStockToggle = useCallback(async (product) => {
    try {
      const newStock = product.stock > 0 ? 0 : 1;
      await dispatch(updateProductStock({ 
        id: product._id, 
        stock: newStock 
      })).unwrap();
      
      // Refresh search results
      if (query.trim()) {
        dispatch(searchProducts({ query: query.trim(), limit: 50 }));
      }
      
      toast.success(`Product stock updated to ${newStock}`);
    } catch (error) {
      toast.error(error || 'Failed to update product stock');
    }
  }, [dispatch, query, toast]);

  const isLoading = searchStatus === 'loading';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl lg:max-w-6xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <PackageSearch className="h-5 w-5" />
            Search Products
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products by title, description, or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10 h-12 text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="h-12 px-6 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Start searching for products</p>
              <p className="text-sm mt-2">Type your search query and press Enter or click Search</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Searching products...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-2">Try different keywords or check spelling</p>
            </div>
          ) : (
            <>
              <div className="py-3 text-sm text-gray-600">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => {
                  const image = product.image || product.picture?.secure_url || '/logo.jpeg';
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white"
                    >
                      <div className="relative aspect-square overflow-hidden group">
                        {product.isFeatured && (
                          <Badge className="absolute top-2 left-2 z-10 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-lg">
                            Featured
                          </Badge>
                        )}
                        <LazyImage
                          src={image}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          fallback="/logo.jpeg"
                          quality={85}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                          {product.title}
                        </h3>
                        <div className="space-y-2 text-xs">
                          {/* Price Section */}
                          <div className="flex items-center justify-between">
                            {editingPriceId === product._id ? (
                              <div className="flex items-center gap-2 flex-1">
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
                                  className="h-7 text-xs font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-24"
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
                                  className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
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
                                  className="h-7 w-7 p-0"
                                  type="button"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  PKR {product.price?.toLocaleString()}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditPrice(product);
                                  }}
                                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                  title="Edit price"
                                >
                                  <Edit className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                                </button>
                              </div>
                            )}
                            <Badge 
                              variant={product.stock > 0 ? 'default' : 'destructive'}
                              className={`text-[10px] ${
                                product.stock > 0 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                          
                          {/* Stock Section */}
                          <div className="flex items-center justify-between">
                            {editingStockId === product._id ? (
                              <div className="flex items-center gap-2 flex-1">
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
                                  className="h-7 text-xs font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
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
                                  className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
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
                                  className="h-7 w-7 p-0"
                                  type="button"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">
                                  Stock: {product.stock}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditStock(product);
                                  }}
                                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                  title="Edit stock"
                                >
                                  <Edit className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {product.category && (
                            <div className="text-gray-500">
                              Category: {product.category.name || product.category}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product._id);
                            }}
                            className="flex-1 h-8 text-xs font-medium border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStockToggle(product);
                            }}
                            className={`h-8 px-2 text-xs transition-all duration-200 ${
                              product.stock > 0 
                                ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700' 
                                : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                            }`}
                            title={product.stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
                          >
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSearchModal;

