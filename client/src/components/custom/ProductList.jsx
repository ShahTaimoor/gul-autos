import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/input';
import { addToCart } from '@/redux/slices/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { Loader2 } from 'lucide-react';

const ProductList = () => {
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector(s => s.categories);
  const { products, status } = useSelector(s => s.products);
  const { user } = useSelector((state) => state.auth);

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const combinedCategories = [
    {
      _id: 'all',
      name: 'All',
      image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg',
    },
    ...categories,
  ];
  const categoryChunks = chunkArray(combinedCategories, 8);

  useEffect(() => {
    if (products.length > 0) {
      const initialQuantities = {};
      products.forEach(product => {
        initialQuantities[product._id] = 0;
      });
      setQuantities(initialQuantities);
    }
  }, [products]);

  const handleQuantityChange = (productId, value, stock) => {
    let newValue = parseInt(value) || 0;
    newValue = Math.max(0, Math.min(newValue, stock));
    setQuantities(prev => ({
      ...prev,
      [productId]: newValue,
    }));
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.warning('You must login first');
      navigate('/login');
      return;
    }

    if (quantities[product._id] <= 0) {
      toast.warning('Please select at least 1 item');
      return;
    }

    setIsAddingToCart(true);

    dispatch(
      addToCart({
        _id: product._id,
        name: product.title,
        price: product.price,
        stock: product.stock,
        quantity: quantities[product._id],
        image: product.image,
      })
    );

    setIsAddingToCart(false);
    toast.success('Product added to cart');
    setQuantities(prev => ({ ...prev, [product._id]: 0 }));
  };

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm }));
  }, [category, searchTerm, dispatch]);

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Category Swiper */}
      <Swiper
        pagination={true}
        modules={[Pagination]}
        className="mySwiper"
        spaceBetween={10}
      >
        {categoryChunks.map((chunk, index) => (
          <SwiperSlide key={index}>
            <div className="grid grid-cols-4 gap-4 pb-4 mb-6">
              {chunk.map(cat => (
                <div
                  key={cat._id}
                  className={`cursor-pointer flex flex-col items-center w-24 text-center p-2 ${category === cat._id ? 'border-b' : 'bg-white'}`}
                  onClick={() => setCategory(cat._id)}
                >
                  <div className="flex justify-center">
                    <img
                      src={cat.image || '/fallback.jpg'}
                      alt={cat.name}
                      className="w-12 rounded-full h-12 object-cover"
                    />
                  </div>
                  <p className="text-sm mt-1 text-center w-full">{cat.name}</p>
                </div>
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Search Input */}
      <Input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search products…"
        className="flex-1 mb-5"
      />

      {/* Loading Spinner */}
      {loadingProducts && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={32} />
        </div>
      )}

      {/* No Products Found Message */}
      {products.length === 0 && (
        <p className="text-center text-lg text-gray-500 mb-10">
          {category === 'all' && searchTerm === ''
            ? 'No products found.'
            : category !== 'all' && searchTerm === ''
              ? 'No products found in this category.'
              : 'No products match your search.'}
        </p>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {products.map(product => (
          <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <img
              width={1600}
              height={1600}
              src={product.image || '/fallback.jpg'}
              alt={product.title}
              className="w-full object-cover"
            />
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-semibold text-lg line-clamp-2">{product.title}</h3> {/* Updated Title */}
              <div className="flex gap-2">
                <p className="text-sm text-gray-600 mb-2">Category:</p>
                <p className="text-sm text-black mb-2">{product.category?.name}</p>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="mt-4">
                <div className="flex gap-7">
                  <p>Quantity</p>
                  <input
                    type="number"
                    min="0"
                    max={product.stock}
                    value={quantities[product._id] || 0}
                    onChange={(e) => handleQuantityChange(product._id, e.target.value, product.stock)}
                    className={`w-full text-center border rounded-md text-sm p-1 mb-2 ${product.stock === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={product.stock === 0}
                  />
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={loadingProducts || isAddingToCart || quantities[product._id] <= 0 || product.stock === 0}
                  className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${loadingProducts || isAddingToCart || quantities[product._id] <= 0 || product.stock === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
                    } text-white`}
                >
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
