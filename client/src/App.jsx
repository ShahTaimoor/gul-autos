import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { Toaster } from "./components/ui/sonner";

// Page Imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Success from "./pages/Success";
import Error from "./pages/Error";
// Admin Pages
import AdminLayout from "./components/layouts/AdminLayout";
import CreateProducts from "./components/custom/CreateProducts";
import AllProducts from "./components/custom/AllProducts";
import Orders from "./components/custom/Orders";
// Layouts
import RootLayout from "./components/layouts/RootLayout";
// Custom Components
import ProtectedRoute from "./components/custom/ProtectedRoute";
import Category from "./pages/Category";
import Users from "./pages/Users";
import UpdateProduct from "./components/custom/UpdateProduct";
import Profile from "./pages/Profile";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <RootLayout>
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </RootLayout>
      ),
    },
    {
      path: "/login",
      element: (
        <RootLayout>
          <Login />
        </RootLayout>
      ),
    },
    {
      path: "/signup",
      element: (
        <RootLayout>
          <Signup />
        </RootLayout>
      ),
    },
    {
      path: "/checkout",
      element: (
        <ProtectedRoute>
          <RootLayout>
            <Checkout />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders",
      element: (
        <ProtectedRoute>
          <RootLayout>
            <MyOrders />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/success",
      element: (
        <RootLayout>
          <Success />
        </RootLayout>
      ),
    },
    {
      path: "/profile",
      element: (
        <RootLayout>
          <Profile />
        </RootLayout>
      ),
    },
    {
      path: "/admin/dashboard",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <CreateProducts />
          </AdminLayout>
        </ProtectedRoute>


      ),
    },
   
    {
      path: "/admin/category",
      element: (
        <ProtectedRoute>

          <AdminLayout>
            <Category />
          </AdminLayout>
        </ProtectedRoute>

      ),
    },
    {
      path: "/admin/dashboard/all-products",
      element: (
        <ProtectedRoute>

          <AdminLayout>
            <AllProducts />
          </AdminLayout>

        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/dashboard/update/:id",
      element: (
        <ProtectedRoute>

          <AdminLayout>
            <UpdateProduct />
          </AdminLayout>

        </ProtectedRoute>
      ),
    },

    {
      path: "/admin/dashboard/users",
      element: (
        <ProtectedRoute>
          <AdminLayout>
            <Users />
          </AdminLayout>
        </ProtectedRoute>

      ),
    },
    {
      path: "/admin/dashboard/orders",
      element: (

        <AdminLayout>
          <Orders />
        </AdminLayout>

      ),
    },
    {
      path: "*",
      element: (
        <RootLayout>
          <Error />
        </RootLayout>
      ),
    },
  ]);

  return (
    <Provider store={store}>
      <Toaster />
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;
