import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/input';
import { addToCart } from '@/redux/slices/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { Loader2, LayoutPanelLeft, Grid2x2, Grid3x3 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { flyToCart } from './FlyToCart';
import CartDrawer from './CartDrawer';




const ProductCard = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAddingToCart,
  isInCart,
  gridType,
  cartRef
}) => {
  const imgRef = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  const clickAudioRef = useRef(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/sounds/click.mp3');
  }, []);
  const handleAddClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0; // Reset to start
      clickAudioRef.current.play();
    }

    onAddToCart(product);
    flyToCart(imgRef, cartRef);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${gridType === 'grid3' ? 'sm:flex-col flex-row items-stretch' : ''
        }`}
    >
      <div className={`relative aspect-square overflow-hidden ${gridType === 'grid3' ? 'w-1/3 sm:w-full' : ''}`}>
        <img
          ref={imgRef}
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => (e.currentTarget.src = '/placeholder-product.jpg')}
        />
      </div>

      <div className={`p-4 flex flex-col flex-grow ${gridType === 'grid3' ? 'w-2/3 sm:w-full' : ''}`}>
        <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
        <div className="flex-grow" />

        <div className="flex flex-col lg:flex-row gap-2 mt-4">
          <div className="flex sm:flex-row items-center gap-2 justify-between">
            <div className="flex w-full lg:w-28 justify-between bg-white/40 backdrop-blur-md shadow-md border border-white/30 rounded-full overflow-hidden">
              <button
                onClick={() =>
                  onQuantityChange(product._id, (parseInt(quantity) || 1) - 1, product.stock)
                }
                className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
                disabled={(parseInt(quantity) || 1) <= 1}
              >
                −
              </button>

              <input
                type="number"
                max={product.stock}
                value={quantity === '' ? '' : quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onQuantityChange(product._id, '', product.stock);
                  } else {
                    const parsed = parseInt(val);
                    if (!isNaN(parsed)) {
                      onQuantityChange(product._id, parsed, product.stock);
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-10 text-center bg-transparent focus:outline-none text-sm py-1 appearance-none text-black [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                inputMode="numeric"
              />

              <button
                onClick={() =>
                  onQuantityChange(product._id, (parseInt(quantity) || 1) + 1, product.stock)
                }
                className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
                disabled={(parseInt(quantity) || 1) >= product.stock}
              >
                +
              </button>
            </div>

          </div>

          <button
            onClick={handleAddClick}
            disabled={isAddingToCart || (parseInt(quantity) || 0) <= 0}
            className={`text-sm mt-2 lg:mt-0 lg:w-32 cursor-pointer px-4 md:px-5 py-1.5 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/30 bg-black/80 hover:bg-black/90 ${isInCart
              ? 'bg-green-600 hover:bg-green-700'
              : isAddingToCart || (parseInt(quantity) || 0) <= 0
                ? 'bg-red-700 cursor-not-allowed'
                : 'hover:shadow-2xl'
              } text-white`}
          >
            {isInCart ? 'Added to Cart' : isAddingToCart ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


const ProductList = () => {
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [gridType, setGridType] = useState('grid2');
  const [sortOrder, setSortOrder] = useState('az');
  const cartRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories } = useSelector((s) => s.categories);
  const { products, status } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { cartItems } = useSelector((s) => s.cart);

  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const combinedCategories = [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...categories,
  ];
  const categoryChunks = chunkArray(combinedCategories, 8);

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm }));
  }, [category, searchTerm, dispatch]);

  useEffect(() => {
    if (products.length > 0) {
      const initialQuantities = {};
      products.forEach((product) => {
        initialQuantities[product._id] = product.stock > 0 ? 1 : 0;
      });
      setQuantities(initialQuantities);
    }
  }, [products]);

  const handleQuantityChange = (productId, value, stock) => {
    if (value === '') return setQuantities((prev) => ({ ...prev, [productId]: '' }));
    let newValue = Math.max(Math.min(parseInt(value), stock), 1);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  };

  const handleAddToCart = (product) => {
    if (!user) {
      toast.warning('You must login first');
      navigate('/login');
      return;
    }
    const qty = parseInt(quantities[product._id]);
    if (!qty || qty <= 0) {
      toast.warning('Please select at least 1 item');
      return;
    }

    setIsAddingToCart(true);
    dispatch(addToCart({ _id: product._id, name: product.title, price: product.price, stock: product.stock, quantity: qty, image: product.image }));
    setIsAddingToCart(false);
    toast.success('Product added to cart');
    setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
  };

  const sortedProducts = [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) =>
      sortOrder === 'az'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-4 py-6">
      <Swiper pagination modules={[Pagination]} className="mySwiper" spaceBetween={10}>
        {categoryChunks.map((chunk, index) => (
          <SwiperSlide key={index}>
            <div className="grid grid-cols-4 md:grid-cols-8 mt-18 pb-6 gap-3">
              {chunk.map((cat) => (
                <div
                  key={cat._id}
                  className={`flex flex-col items-center rounded-xl p-1 ${category === cat._id ? 'border border-[#FED700]' : ''
                    } cursor-pointer text-center`}
                  onClick={() => setCategory(cat._id)}
                >
                  <div className="rounded-full p-1">
                    <img src={cat.image || '/fallback.jpg'} alt={cat.name} className="w-16 h-16 object-cover rounded-full" />
                  </div>
                  <p className="text-xs mt-2">{cat.name}</p>
                </div>
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mb-6">
        {/* Flex row layout for desktop, column on mobile */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
          {/* Search Input (with floating grid buttons on mobile) */}
          <div className="relative flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-[#FED700] px-4 py-2 pr-32 text-sm shadow-md backdrop-blur-md bg-white/30 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FED700] transition"
            />

            {/* Mobile-only Grid Controls (inside input area) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 lg:hidden bg-white/60 shadow-sm backdrop-blur-sm px-1.5 py-1 rounded-full transition">
              <button
                onClick={() => setGridType('grid1')}
                className={`p-1 rounded-full transition hover:bg-yellow-100 ${gridType === 'grid1' ? 'bg-[#FED700] text-white' : ''
                  }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridType('grid2')}
                className={`p-1 rounded-full transition hover:bg-yellow-100 ${gridType === 'grid2' ? 'bg-[#FED700] text-white' : ''
                  }`}
              >
                <Grid2x2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridType('grid3')}
                className={`p-1 rounded-full transition hover:bg-yellow-100 ${gridType === 'grid3' ? 'bg-[#FED700] text-white' : ''
                  }`}
              >
                <LayoutPanelLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Sort Dropdown */}
          <div className="mt-3 lg:mt-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="hidden lg:flex text-sm border rounded-xl border-[#FED700] bg-white/50 shadow-md backdrop-blur-md px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
            >
              <option value="az">Sort: A–Z</option>
              <option value="za">Sort: Z–A</option>
            </select>
          </div>
        </div>

      </div>


      {loadingProducts ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32} /></div>
      ) : sortedProducts.length === 0 ? (
        <p className="text-center text-lg text-gray-500 mb-10">No products found.</p>
      ) : (
        <div className={`grid lg:grid-cols-4 gap-6 ${gridType === 'grid1' ? 'grid-cols-1' :
          gridType === 'grid2' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2' :
            'grid-cols-1'}`}>
          {sortedProducts.map((product) => {
            const isInCart = cartItems.some((item) => item._id === product._id);
            return (
              <ProductCard
                key={product._id}
                product={product}
                quantity={quantities[product._id]}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
                isInCart={isInCart}
                gridType={gridType}
                cartRef={cartRef}
              />
            );
          })}
        </div>
      )}


      <div className="fixed top-4 right-16 z-50">
        <div ref={cartRef} className="relative">
          <CartDrawer />
        </div>
      </div>

      <div className="fixed bottom-3 lg:bottom-5 right-0 lg:right-2 z-50">
        <Link to='https://wa.me/923130922988?text=  Hi How Are you ?' target='_blank'>
          <img className='w-14 h-14' src="/WhatsApp.svg.webp" alt="" />
        </Link>
      </div>
    </div>
  );
};

export default ProductList;
