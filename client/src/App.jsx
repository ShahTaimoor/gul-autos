import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import AuthInitializer from './components/custom/AuthInitializer';
import ErrorBoundary from './components/custom/ErrorBoundary';
import OneLoader from './components/ui/OneLoader';
import { Suspense, lazy } from 'react';
import { AuthDrawerProvider } from './contexts/AuthDrawerContext';
import AuthDrawer from './components/custom/AuthDrawer';
import { Toaster } from './components/ui/sonner';

// Lazy-load pages
const RootLayout = lazy(() => import('./components/layouts/RootLayout'));
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const ProtectedRoute = lazy(() => import('./components/custom/ProtectedRoute'));

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Success = lazy(() => import('./pages/Success'));
const ErrorPage = lazy(() => import('./pages/Error'));
const Category = lazy(() => import('./pages/Category'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));

const CreateProducts = lazy(() => import('./components/custom/CreateProducts'));
const AllProducts = lazy(() => import('./components/custom/AllProducts'));
const LowStock = lazy(() => import('./components/custom/LowStock'));
const UpdateProduct = lazy(() => import('./components/custom/UpdateProduct'));
const Orders = lazy(() => import('./components/custom/Orders'));
const Media = lazy(() => import('./pages/Media'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/products',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Products />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/product/:id',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <ProductDetail />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/all-products',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Products />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/checkout',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <Checkout />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/orders',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <MyOrders />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/success',
      element: (
        <RootLayout>
          <Success />
        </RootLayout>
      ),
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <Profile />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/login',
      element: (
        <AdminLogin />
      ),
    },
    {
      path: '/admin/dashboard',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <CreateProducts />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/category',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Category />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/all-products',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <AllProducts />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/low-stock',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <LowStock />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/update/:id',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <UpdateProduct />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/users',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Users />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/orders',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Orders />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/dashboard/media',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Media />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/profile',
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <AdminProfile />
          </AdminLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: (
        <RootLayout>
          <ErrorPage />
        </RootLayout>
      ),
    },
  ]);

  return (
    <Provider store={store}>
      <AuthDrawerProvider>
        <AuthInitializer />
        <TokenExpirationHandler />
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><OneLoader size="large" text="Loading..." /></div>}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </AuthDrawerProvider>
    </Provider>
  );
};

export default App;
