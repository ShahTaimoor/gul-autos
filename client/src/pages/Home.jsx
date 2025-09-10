import React, { useState, useEffect } from 'react';
import ProductList from '@/components/custom/ProductList';
import { PageLoader } from '@/components/ui/unified-loader';

const Home = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <PageLoader message="Loading Products" />;
  }

  return (
    <div>
      <ProductList />
    </div>
  );
};

export default Home;