import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';

const CategorySwiper = React.memo(({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}) => {
  const categoryChunks = useMemo(() => {
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };
    return chunkArray(categories, 8);
  }, [categories]);

  return (
    <div className="relative px-2 sm:px-10">
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
              {chunk.filter(cat => cat && cat._id).map((cat, index) => (
                <CategoryItem
                  key={cat._id}
                  category={cat}
                  isSelected={selectedCategory === cat._id}
                  onSelect={onCategorySelect}
                  index={index}
                />
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <NavigationButtons />
    </div>
  );
});

const CategoryItem = React.memo(({ category, isSelected, onSelect, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.4,
      delay: index * 0.05,
      ease: "easeOut"
    }}
    className={`flex flex-col items-center rounded-xl p-1 ${
      isSelected
        ? 'border border-[#FED700] shadow-md'
        : 'hover:shadow-sm'
    } cursor-pointer text-center bg-white/80 backdrop-blur-sm transition-all`}
    onClick={() => onSelect(category?._id)}
    whileHover={{
      scale: 1.05,
      boxShadow: "0 4px 8px rgba(254, 215, 0, 0.2)"
    }}
    whileTap={{ scale: 0.95 }}
    role="button"
    tabIndex="0"
    aria-label={`Filter by ${category?.name || "Category"}`}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(category?._id)}
  >
    <motion.div
      className="rounded-full p-1"
      whileHover={{ rotate: 5 }}
    >
      <img
        src={category?.image || category?.picture?.secure_url || "/fallback.jpg"}
        alt={category?.name || "Category"}
        className="w-14 h-14 object-cover rounded-full border-2 border-white/30"
        loading="lazy"
        width="56"
        height="56"
        onError={(e) => {
          e.currentTarget.src = "/fallback.jpg";
        }}
      />
    </motion.div>
    <motion.p
      className="text-xs mt-2 font-medium text-gray-700"
      whileHover={{ color: "#000000" }}
    >
      {(category?.name || "Category").split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')}
    </motion.p>
  </motion.div>
));

const NavigationButtons = React.memo(() => (
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
      <div className="p-3 rounded-l-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:shadow-yellow-300/40 transition-all duration-300 ease-in-out">
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
      className="custom-swiper-button-next absolute top-[120px] right-0 z-20 -translate-y-1/2 cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ x: 10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-3 rounded-r-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:shadow-yellow-300/40 transition-all duration-300 ease-in-out">
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
));

export default CategorySwiper;

