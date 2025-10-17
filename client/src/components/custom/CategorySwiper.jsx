import React, { useMemo, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const CategorySwiper = React.memo(({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}) => {
  const [chunkSize, setChunkSize] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      // Desktop/laptop: 8 categories, Mobile/tablet: 4 categories
      setChunkSize(window.innerWidth >= 1024 ? 8 : 4);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categoryChunks = useMemo(() => {
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };
    return chunkArray(categories, chunkSize);
  }, [categories, chunkSize]);

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
            <div className="grid grid-cols-4 lg:grid-cols-8 mt-4 pb-6 gap-2">
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
  <div
    className={`flex flex-col items-center rounded-xl  ${
      isSelected
        ? 'border border-[#FED700] shadow-md'
        : 'hover:shadow-sm'
    } cursor-pointer text-center bg-white/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-95`}
    onClick={() => onSelect(category?._id)}
    role="button"
    tabIndex="0"
    aria-label={`Filter by ${category?.name || "Category"}`}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(category?._id)}
  >
    <div className="rounded-full ">
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
    </div>
    <p className="text-xs mt-1 font-medium text-gray-700">
      {(category?.name || "Category").split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')}
    </p>
  </div>
));

const NavigationButtons = React.memo(() => (
  <div className="hidden lg:block">
    {/* Previous Button */}
    <div className="custom-swiper-button-prev absolute top-1/2 left-0 z-20 -translate-y-1/2 cursor-pointer">
      <div className="p-3 rounded-l-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:shadow-yellow-300/40 hover:scale-110 active:scale-90 transition-all duration-300 ease-in-out">
        <svg
          className="w-4 h-4 text-black drop-shadow"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>

    {/* Next Button */}
    <div className="custom-swiper-button-next absolute top-1/2 right-0 z-20 -translate-y-1/2 cursor-pointer">
      <div className="p-3 rounded-r-full backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:shadow-yellow-300/40 hover:scale-110 active:scale-90 transition-all duration-300 ease-in-out">
        <svg
          className="w-4 h-4 text-black drop-shadow"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
));

export default CategorySwiper;

