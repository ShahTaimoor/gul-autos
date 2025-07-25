import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { Toaster } from './components/ui/sonner';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import { Suspense, lazy } from 'react';

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

const CreateProducts = lazy(() => import('./components/custom/CreateProducts'));
const AllProducts = lazy(() => import('./components/custom/AllProducts'));
const UpdateProduct = lazy(() => import('./components/custom/UpdateProduct'));
const Orders = lazy(() => import('./components/custom/Orders'));

const App = () => {
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
    <Provider store={store}>
      <Toaster />
      <TokenExpirationHandler />
      <Suspense fallback={<div className="text-center mt-20 text-lg">Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </Provider>
  );
};

export default App;
