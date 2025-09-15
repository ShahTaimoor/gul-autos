import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './redux/store';
import { Toaster } from './components/ui/sonner';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import ErrorBoundary from './components/custom/ErrorBoundary';
import { Suspense, lazy, useEffect } from 'react';
import { useTokenValidation, useTokenRefresh } from './hooks/use-token-validation';
import { PageLoader } from './components/ui/unified-loader';
import ScrollOptimizer from './components/ui/ScrollOptimizer';

// Lazy-load pages
const RootLayout = lazy(() => import('./components/layouts/RootLayout'));
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const ProtectedRoute = lazy(() => import('./components/custom/ProtectedRoute'));

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
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
const UpdateProduct = lazy(() => import('./components/custom/UpdateProduct'));
const Orders = lazy(() => import('./components/custom/Orders'));

const AppContent = () => {
  // Initialize token validation and refresh
  useTokenValidation();
  useTokenRefresh();
  
  // Get user state to conditionally apply navbar-present clas
  const user = useSelector((state) => state.auth.user);

  // Apply navbar-present class to body when user is logged in
  useEffect(() => {
    console.log('User state changed:', user);
    if (user) {
      document.body.classList.add('navbar-present');
      console.log('Added navbar-present class to body');
    } else {
      document.body.classList.remove('navbar-present');
      console.log('Removed navbar-present class from body');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('navbar-present');
    };
  }, [user]);

  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <RootLayout>
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </RootLayout>
      ),
    },
    {
      path: '/login',
      element: (
        <RootLayout>
          <Login />
        </RootLayout>
      ),
    },
    {
      path: '/signup',
      element: (
        <RootLayout>
          <Signup />
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
      path: '*',
      element: (
        <RootLayout>
          <ErrorPage />
        </RootLayout>
      ),
    },
  ]);

  return (
    <ErrorBoundary>
      <Toaster />
      <TokenExpirationHandler />
      <Suspense fallback={<PageLoader message="Loading Application" />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ScrollOptimizer>
        <AppContent />
      </ScrollOptimizer>
    </Provider>
  );
};

export default App;
