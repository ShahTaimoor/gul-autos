import React from 'react';

// Unified Loader Component - Consistent design across all frontend
export const UnifiedLoader = ({ 
  size = 'md', 
  message = 'Loading...', 
  showMessage = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-[#FED700]/20 border-t-[#FED700] rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} bg-[#FED700] rounded-full animate-pulse`}></div>
        </div>
      </div>
      
      {/* Message */}
      {showMessage && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};

// Page Loader - For full page loading
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FED700]/10 to-[#FED700]/5">
    <div className="text-center space-y-6">
      <UnifiedLoader size="xl" message={message} />
      <div className="flex justify-center space-x-2">
        <div className="w-3 h-3 bg-[#FED700] rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-[#FED700] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-[#FED700] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Inline Loader - For small inline loading
export const InlineLoader = ({ message = 'Loading...' }) => (
  <UnifiedLoader size="sm" message={message} className="py-4" />
);

// Button Loader - For button loading states
export const ButtonLoader = ({ size = 'sm' }) => (
  <div className="flex items-center space-x-2">
    <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
    <span>Loading...</span>
  </div>
);

// Card Loader - For card loading states
export const CardLoader = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="border rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
);

// Table Loader - For table loading states
export const TableLoader = ({ columns = 5, rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 p-4 border-b animate-pulse">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);

// Form Loader - For form loading states
export const FormLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-gray-200 rounded"></div>
    <div className="h-10 bg-gray-200 rounded"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
    <div className="h-10 bg-gray-200 rounded w-1/3"></div>
  </div>
);

// Success Loader - For success states
export const SuccessLoader = ({ message = 'Success!' }) => (
  <div className="flex flex-col items-center justify-center space-y-3">
    <div className="w-12 h-12 bg-[#FED700]/20 rounded-full flex items-center justify-center">
      <div className="w-6 h-6 bg-[#FED700] rounded-full animate-pulse"></div>
    </div>
    <p className="text-[#FED700] font-medium">{message}</p>
  </div>
);

// Error Loader - For error states
export const ErrorLoader = ({ message = 'Error occurred' }) => (
  <div className="flex flex-col items-center justify-center space-y-3">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
      <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse"></div>
    </div>
    <p className="text-red-600 font-medium">{message}</p>
  </div>
);
