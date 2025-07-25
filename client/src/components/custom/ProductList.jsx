import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/input';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import { Loader2, LayoutPanelLeft, Grid2x2, Grid3x3 } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { flyToCart } from './FlyToCart';
import CartDrawer from './CartDrawer';

// Memoized ProductCard component to prevent unnecessary re-renders
const ProductCard = React.memo(({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAddingToCart,
  isInCart,
  gridType,
  cartRef,
  setPreviewImage
}) => {
  const imgRef = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  const clickAudioRef = useRef(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/sounds/click.mp3');
    return () => {
      if (clickAudioRef.current) {
        clickAudioRef.current.pause();
        clickAudioRef.current = null;
      }
    };
  }, []);

  const handleAddClick = useCallback(() => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }

    onAddToCart(product);
    flyToCart(imgRef, cartRef);
  }, [onAddToCart, product, cartRef]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${gridType === 'grid3' ? 'sm:flex-col flex-row items-stretch' : ''
        }`}
    >
      <div
        className={`relative cursor-pointer aspect-square overflow-hidden group ${gridType === 'grid3' ? 'w-1/3 sm:w-full' : ''
          }`}
      >
        <img
          ref={imgRef}
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
          onClick={() => setPreviewImage(product.image || '/placeholder-product.jpg')}
          onError={(e) => (e.currentTarget.src = '/placeholder-product.jpg')}
          loading="lazy"
          width="300"
          height="300"
        />

        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          onClick={() => setPreviewImage(product.image || '/placeholder-product.jpg')}
          aria-label="View product image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
      </div>

      <div
        className={`p-4 flex flex-col flex-grow ${gridType === 'grid3' ? 'w-2/3 sm:w-full' : ''
          }`}
      >
        <h3 className="font-semibold text-sm line-clamp-2">
          {product.title.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')}
        </h3>
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
                aria-label="Decrease quantity"
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
                className="w-10 text-center bg-transparent focus:outline-none text-sm py-1 text-black
  appearance-none 
  [&::-webkit-outer-spin-button]:appearance-none 
  [&::-webkit-inner-spin-button]:appearance-none 
  [&::-moz-appearance]:textfield"
              />

              <button
                onClick={() =>
                  onQuantityChange(product._id, (parseInt(quantity) || 1) + 1, product.stock)
                }
                className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
                disabled={(parseInt(quantity) || 1) >= product.stock}
                aria-label="Increase quantity"
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
            aria-label={isInCart ? 'Added to cart' : 'Add to cart'}
          >
            {isInCart ? 'Added to Cart' : isAddingToCart ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const ProductList = () => {
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [sortOrder, setSortOrder] = useState('az');
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  const limit = 24;

  const cartRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories } = useSelector((s) => s.categories);
  const { products: productList = [], status, totalPages } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: cartItems = [] } = useSelector((s) => s.cart);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);



  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...categories
  ], [categories]);


  const categoryChunks = useMemo(() => {
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };
    return chunkArray(combinedCategories, 8);
  }, [combinedCategories]);

  // Memoized sorted products
  const sortedProducts = useMemo(() => {
    return [...productList]
      .filter((product) => product.stock > 0)
      .sort((a, b) =>
        sortOrder === 'az'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      );
  }, [productList, sortOrder]);

  useEffect(() => {
    dispatch(fetchProducts({ category, searchTerm, page, limit, stockFilter: 'active' }))
      .then((res) => {
        // Go back one page if current page has no results
        if (res.payload.products?.length === 0 && page > 1) {
          setPage((prev) => prev - 1);
        }
      });
  }, [dispatch, category, searchTerm, page, limit]);

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    if (productList.length > 0) {
      const initialQuantities = {};
      productList.forEach((product) => {
        initialQuantities[product._id] = product.stock > 0 ? 1 : 0;
      });
      setQuantities(initialQuantities);
    }
  }, [productList]);

  const handleQuantityChange = useCallback((productId, value, stock) => {
    if (value === '') {
      return setQuantities((prev) => ({ ...prev, [productId]: '' }));
    }
    let newValue = Math.max(Math.min(parseInt(value), stock), 1);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  }, []);

  const handleAddToCart = useCallback((product) => {
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

    setAddingProductId(product._id);
    dispatch(addToCart({
      productId: product._id,
      quantity: qty
    })).then(() => {
      toast.success('Product added to cart');
      setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
    }).finally(() => setAddingProductId(null));
  }, [dispatch, navigate, quantities, user]);

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl  lg:mx-auto lg:px-4  py-6">
      {/* Swiper for categories */}
      <div className="relative px-2 sm:px-10 ">
        <Swiper
          pagination={{ clickable: true }}
          modules={[Pagination, Navigation]}
          spaceBetween={10}
          navigation={{
            nextEl: '.custom-swiper-button-next',
            prevEl: '.custom-swiper-button-prev'
          }}
          className="mySwiper"
        >
          {categoryChunks.map((chunk, idx) => (
            <SwiperSlide key={idx}>
              <div className="grid grid-cols-4 md:grid-cols-8 mt-18 pb-6 gap-3">
                {chunk.map((cat, index) => (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                    className={`flex flex-col items-center rounded-xl p-1 ${category === cat._id
                      ? 'border border-[#FED700] shadow-md'
                      : 'hover:shadow-sm'
                      } cursor-pointer text-center bg-white/80 backdrop-blur-sm transition-all`}
                    onClick={() => setCategory(cat._id)}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 8px rgba(254, 215, 0, 0.2)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    role="button"
                    tabIndex="0"
                    aria-label={`Filter by ${cat.name}`}
                    onKeyDown={(e) => e.key === 'Enter' && setCategory(cat._id)}
                  >
                    <motion.div
                      className="rounded-full p-1"
                      whileHover={{ rotate: 5 }}
                    >
                      <img
                        src={cat.image || "/fallback.jpg"}
                        alt={cat.name}
                        className="w-14 h-14 object-cover rounded-full border-2 border-white/30"
                        loading="lazy"
                        width="56"
                        height="56"
                      />
                    </motion.div>
                    <motion.p
                      className="text-xs mt-2 font-medium text-gray-700"
                      whileHover={{ color: "#000000" }}
                    >
                      {cat.name.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </motion.p>
                  </motion.div>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="hidden lg:block">
          {/* Previous Button */}
          <motion.div
            className="custom-swiper-button-prev absolute top-[120px] left-0 z-20 -translate-y-1/2 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-3 rounded-l-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg  hover:shadow-yellow-300/40 transition-all duration-300 ease-in-out">
              <motion.svg
                className="w-4 h-4 text-black drop-shadow"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                whileHover={{ scale: 1.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </motion.svg>
            </div>
          </motion.div>

          {/* Next Button */}
          <motion.div
            className="custom-swiper-button-next absolute top-[120px]  right-0 z-20 -translate-y-1/2 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-3 rounded-r-full backdrop-blur-md  bg-white/20 border border-white/30  shadow-lg hover:shadow-yellow-300/40 transition-all duration-300 ease-in-out">
              <motion.svg
                className="w-4 h-4 text-black drop-shadow"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                whileHover={{ scale: 1.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </motion.svg>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Search & Sort */}
      <div className="mb-6 px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
          <div className="relative flex-1">
            <div className="relative w-full group">
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=" Search products..."
                className="w-full border-2 border-[#FED700] rounded-2xl px-4 py-3 text-sm outline-none bg-white/80 backdrop-blur-sm
                focus:outline-none focus:ring-4 focus:ring-[#EFD700]   focus:border-[#FED700]
                transition-all duration-300 ease-out shadow-sm hover:shadow-md hover:border-[#EFD700]
                placeholder:text-gray-400"
                aria-label="Search products"
              />
              
              {/* Search icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-[#efd700] transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 lg:hidden bg-white/60 shadow-sm backdrop-blur-sm px-1.5 py-1 rounded-full transition">
              <button
                onClick={() => setGridType('grid1')}
                className={`p-1 rounded-full ${gridType === 'grid1' ? 'bg-[#FED700] text-white' : ''}`}
                aria-label="Grid view 1"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridType('grid2')}
                className={`p-1 rounded-full ${gridType === 'grid2' ? 'bg-[#FED700] text-white' : ''}`}
                aria-label="Grid view 2"
              >
                <Grid2x2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridType('grid3')}
                className={`p-1 rounded-full ${gridType === 'grid3' ? 'bg-[#FED700] text-white' : ''}`}
                aria-label="Grid view 3"
              >
                <LayoutPanelLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 lg:mt-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="hidden lg:flex text-sm border rounded-xl border-[#FED700] bg-white/50 shadow-md backdrop-blur-md px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              aria-label="Sort products"
            >
              <option value="az">Sort: A–Z</option>
              <option value="za">Sort: Z–A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loadingProducts ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : productList.length === 0 || sortedProducts.length === 0 ? (
        <p className="text-center text-lg text-gray-500 mb-10">No products found for your search.</p>
      ) : (
        <div className={`grid px-2 sm:px-0 lg:grid-cols-4 gap-6 ${gridType === 'grid1' ? 'grid-cols-1' : gridType === 'grid2' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2' : 'grid-cols-1'}`}>
          {sortedProducts.map((product) => {
            const isInCart = cartItems.some((item) => (item.product?._id || item.product) === product._id);
            return (
              <ProductCard
                key={product._id}
                product={product}
                quantity={quantities[product._id]}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                isAddingToCart={addingProductId === product._id}
                isInCart={isInCart}
                gridType={gridType}
                cartRef={cartRef}
                setPreviewImage={setPreviewImage}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-100 rounded-full filter blur-3xl opacity-20"></div>
        </div>

        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative flex flex-wrap items-center justify-center gap-1 mt-10"
          >
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 14px rgba(254, 215, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`relative flex items-center justify-center h-10 px-4 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-50 transition-all border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </motion.button>

            {/* Page Numbers */}
            <AnimatePresence>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pg => {
                  if (totalPages <= 5) return true;
                  return Math.abs(pg - page) <= 2 || pg === 1 || pg === totalPages;
                })
                .map((pg) => (
                  <motion.button
                    key={pg}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setPage(pg)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${pg === page
                      ? 'bg-[#FED700] text-white border-[#FED700] shadow-lg'
                      : 'bg-white/90 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-yellow-50'
                      } border`}
                    aria-label={`Page ${pg}`}
                  >
                    {pg}
                  </motion.button>
                ))}
            </AnimatePresence>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 14px rgba(254, 215, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`relative flex items-center justify-center h-10 px-4 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-50 transition-all border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
              aria-label="Next page"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </div>

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


      {/* Cart Drawer */}
      <div className="fixed top-4 right-16 md:right-8 z-50">
        <div
          ref={cartRef}
          className={`relative transition-all duration-300 ${cartItems.length > 0 ? 'animate-bounce' : ''
            }`}
        >
          <CartDrawer />
        </div>
      </div>

      {/* WhatsApp Button */}
      <div className="fixed animate-bounce bottom-3 lg:bottom-5 right-0 lg:right-2 z-50">
        <Link
          to='https://wa.me/923114000096?text=Hi%20How%20Are%20you%20?'
          target='_blank'
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
        >
          <img
            className='w-14 h-14'
            src="/WhatsApp.svg.webp"
            alt="WhatsApp"
            loading="lazy"
            width="56"
            height="56"
          />
        </Link>
      </div>
    </div>
  );
};

export default ProductList;