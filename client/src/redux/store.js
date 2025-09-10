
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
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                // Ignore these field paths in all actions
                ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['items.dates'],
            },
            // Enable performance optimizations
            immutableCheck: { warnAfter: 128 },
            serializableCheck: { warnAfter: 128 },
        }),
    // Enable Redux DevTools in development
    devTools: process.env.NODE_ENV !== 'production',
})