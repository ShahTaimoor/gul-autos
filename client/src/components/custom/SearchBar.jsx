import React, { useCallback, useMemo } from 'react';
import { Input } from '../ui/input';
import { LayoutPanelLeft, Grid2x2, Grid3x3, X } from 'lucide-react';

const SearchBar = React.memo(({ 
  searchTerm,
  onSearchChange,
  gridType, 
  onGridTypeChange
}) => {
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    onSearchChange(value);
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleSearchClick = useCallback(() => {
    // Trigger search functionality
    if (searchTerm.trim()) {
      // You can add additional search logic here if needed
      console.log('Searching for:', searchTerm);
      // The search is already handled by the onSearchChange prop
      // This function can be extended for additional search features
    }
  }, [searchTerm]);

  const gridButtons = useMemo(() => [
    { id: 'grid1', icon: Grid3x3, label: 'Grid view 1' },
    { id: 'grid2', icon: Grid2x2, label: 'Grid view 2' },
    { id: 'grid3', icon: LayoutPanelLeft, label: 'Grid view 3' }
  ], []);

  return (
    <div className="px-2 sm:px-0">
      <div className="flex items-center gap-3">
        {/* Search Input with Button Inside */}
        <div className="relative flex-1">
          <div className="relative w-full group">
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder=" Search products by name or description..."
              className="w-full border-2 border-[#FED700] rounded-2xl px-4 py-3 pr-20 text-sm outline-none bg-white/80 backdrop-blur-sm
              focus:outline-none focus:ring-4 focus:ring-[#EFD700] focus:border-[#FED700]
              transition-all duration-300 ease-out shadow-sm hover:shadow-md hover:border-[#EFD700]
              placeholder:text-gray-400"
              aria-label="Search products"
            />
            
            {/* Clear button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Search Button Inside Input */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#FED700] hover:bg-[#EFD700] text-gray-800 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid Layout Buttons - Separate Container */}
        <div className="flex items-center">
          <div className="flex items-center gap-1 bg-white/60 shadow-sm backdrop-blur-sm px-2 py-1.5 rounded-full border border-gray-200">
            {gridButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onGridTypeChange(id)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  gridType === id 
                    ? 'bg-[#FED700] text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
});

export default SearchBar;

