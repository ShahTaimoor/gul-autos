import React, { useCallback, useMemo } from 'react';
import { Input } from '../ui/input';
import { LayoutPanelLeft, Grid2x2, Grid3x3 } from 'lucide-react';

const SearchBar = React.memo(({ 
  searchTerm, 
  onSearchChange, 
  gridType, 
  onGridTypeChange, 
  sortOrder, 
  onSortChange 
}) => {
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleSortChange = useCallback((e) => {
    onSortChange(e.target.value);
  }, [onSortChange]);

  const gridButtons = useMemo(() => [
    { id: 'grid1', icon: Grid3x3, label: 'Grid view 1' },
    { id: 'grid2', icon: Grid2x2, label: 'Grid view 2' },
    { id: 'grid3', icon: LayoutPanelLeft, label: 'Grid view 3' }
  ], []);

  return (
    <div className="mb-6 px-2 sm:px-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
        <div className="relative flex-1">
          <div className="relative w-full group">
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder=" Search products by name or description..."
              className="w-full border-2 border-[#FED700] rounded-2xl px-4 py-3 text-sm outline-none bg-white/80 backdrop-blur-sm
              focus:outline-none focus:ring-4 focus:ring-[#EFD700] focus:border-[#FED700]
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
            {gridButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onGridTypeChange(id)}
                className={`p-1 rounded-full ${gridType === id ? 'bg-[#FED700] text-white' : ''}`}
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 lg:mt-0 flex flex-col lg:flex-row gap-2">
          {/* Mobile Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="lg:hidden text-sm border rounded-xl border-[#FED700] bg-white/50 shadow-md backdrop-blur-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
            aria-label="Sort products"
          >
            <option value="az">Sort: A–Z</option>
            <option value="za">Sort: Z–A</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="stock-high">Stock: High to Low</option>
            <option value="stock-low">Stock: Low to High</option>
          </select>
          
          {/* Desktop Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="hidden lg:flex text-sm border rounded-xl border-[#FED700] bg-white/50 shadow-md backdrop-blur-md px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
            aria-label="Sort products"
          >
            <option value="az">Sort: A–Z</option>
            <option value="za">Sort: Z–A</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="stock-high">Stock: High to Low</option>
            <option value="stock-low">Stock: Low to High</option>
          </select>
          
          {/* Sort Order Indicator */}
          <div className="hidden lg:flex items-center text-xs text-gray-600 bg-white/30 rounded-lg px-3 py-2">
            <span className="font-medium">
              {sortOrder === 'az' && 'A–Z'}
              {sortOrder === 'za' && 'Z–A'}
              {sortOrder === 'price-low' && 'Price ↑'}
              {sortOrder === 'price-high' && 'Price ↓'}
              {sortOrder === 'newest' && 'Newest'}
              {sortOrder === 'oldest' && 'Oldest'}
              {sortOrder === 'stock-high' && 'Stock ↓'}
              {sortOrder === 'stock-low' && 'Stock ↑'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SearchBar;

