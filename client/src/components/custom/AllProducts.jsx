import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import {
  Loader2,
  Trash2,
  Edit,
  Search,
  Pencil,
  PackageSearch,
} from 'lucide-react';

import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import {
  fetchProducts,
  deleteSingleProduct,
} from '@/redux/slices/products/productSlice';

const capitalizeAllWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AllProducts = () => {
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories } = useSelector((s) => s.categories);
  const { products, status } = useSelector((s) => s.products);

  const loading = status === 'loading';
  const noProducts = status === 'succeeded' && products.length === 0;

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm }));
  }, [category, searchTerm, dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteSingleProduct(id));
    }
  };

  

  // Filter based on selected tab
  let filteredProducts = products;
  if (stockFilter === 'active') {
    filteredProducts = products.filter((p) => p.stock > 0);
  } else if (stockFilter === 'out-of-stock') {
    filteredProducts = products.filter((p) => p.stock <= 0);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className='text-2xl mb-5'>All Products</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name..."
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock Filter Tabs */}
        <div className="flex gap-3 mt-4">
          {['all', 'active', 'out-of-stock'].map((tab) => (
            <Button
              key={tab}
              variant={stockFilter === tab ? 'default' : 'outline'}
              onClick={() => setStockFilter(tab)}
              size="sm"
            >
              {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Out of Stock'}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
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
          ))}
        </div>
      )}

      {/* No Products Found */}
      {noProducts && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? 'Try adjusting your search or filter'
              : 'Add a new product to get started'}
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <Card
              key={p._id}
              className="group transition-all duration-300 border hover:shadow-xl rounded-2xl overflow-hidden flex flex-col h-full"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <img
                  src={p.image || '/placeholder-product.jpg'}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.jpg';
                  }}
                />
                {p.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <Badge variant="destructive" className="text-xs py-1 px-2 rounded-full">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col p-4">
                <div className="space-y-1 mb-2">
                  <h2 className="text-base font-semibold line-clamp-2">
                    {capitalizeAllWords(p.title)}
                  </h2>
                  <div className="flex justify-between items-center">
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
                </div>

                {/* Action Buttons */}
                <div className="mt-auto pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProducts;
