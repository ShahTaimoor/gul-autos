import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Pagination = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (start > 1) {
      pages.unshift(1);
      if (start > 2) {
        pages.splice(1, 0, '...');
      }
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-100 rounded-full filter blur-3xl opacity-20"></div>
      </div>

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
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative flex items-center justify-center h-10 px-4 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-50 transition-all border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </motion.button>

        {/* Page Numbers */}
        <AnimatePresence>
          {visiblePages.map((page, index) => (
            <motion.button
              key={page === '...' ? `ellipsis-${index}` : page}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                page === currentPage
                  ? 'bg-[#FED700] text-white border-[#FED700] shadow-lg'
                  : page === '...'
                    ? 'bg-transparent text-gray-400 cursor-default'
                    : 'bg-white/90 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-yellow-50'
              } border`}
              aria-label={page === '...' ? 'More pages' : `Page ${page}`}
            >
              {page}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 4px 14px rgba(254, 215, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative flex items-center justify-center h-10 px-4 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-50 transition-all border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
});

export default Pagination;

