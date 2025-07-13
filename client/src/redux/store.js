
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/auth/authSlice'
import cartSlice from './slices/cart/cartSlice'
import categoriesReducer from './slices/categories/categoriesSlice'
import productsReducer from './slices/products/productSlice'
import ordersReducer from './slices/order/orderSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartSlice,
        products: productsReducer,
        categories: categoriesReducer,
        orders: ordersReducer,
    },
})