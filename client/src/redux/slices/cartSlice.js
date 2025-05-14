import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage
const loadStateFromLocalStorage = () => {
  try {
    const cartData = window.localStorage.getItem('cart');
    if (cartData === null) {
      return {
        cartItems: [],
        totalQuantity: 0,
        totalPrice: 0,
      };
    }
    return JSON.parse(cartData);
  } catch (error) {
    console.log('Error while loading cart:', error);
    return {
      cartItems: [],
      totalQuantity: 0,
      totalPrice: 0,
    };
  }
};

// Save cart to localStorage
const saveStateIntoLocalStorage = (state) => {
  try {
    const cartData = JSON.stringify(state);
    window.localStorage.setItem('cart', cartData);
  } catch (error) {
    console.log('Error while saving cart to localStorage:', error);
  }
};

const initialState = loadStateFromLocalStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.cartItems.findIndex(item => item._id === newItem._id);

      // Check if the new item quantity is greater than available stock
      if (newItem.quantity > newItem.stock) {
        return;
      }

      if (existingIndex === -1) {
        state.cartItems.push({
          ...newItem,
          quantity: newItem.quantity,
          totalItemPrice: newItem.quantity * newItem.price,
        });
      } else {
        const existingItem = state.cartItems[existingIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;

        // Ensure the quantity does not exceed stock
        if (newQuantity > newItem.stock) {
          return;
        }

        existingItem.quantity = newQuantity;
        existingItem.totalItemPrice = existingItem.quantity * existingItem.price;
      }

      state.totalQuantity += newItem.quantity;
      state.totalPrice = state.cartItems.reduce(
        (total, item) => total + item.totalItemPrice,
        0
      );

      saveStateIntoLocalStorage(state);
    },
    updateCartQuantity: (state, action) => {
      const { _id, quantity } = action.payload;
      const itemIndex = state.cartItems.findIndex(item => item._id === _id);

      if (itemIndex === -1) return;

      const item = state.cartItems[itemIndex];

      // Stock check (optional safety)
      if (quantity > item.stock) return;

      // Update totalQuantity and totalPrice
      const quantityDifference = quantity - item.quantity;
      state.totalQuantity += quantityDifference;

      item.quantity = quantity;
      item.totalItemPrice = quantity * item.price;

      // Recalculate total price
      state.totalPrice = state.cartItems.reduce(
        (sum, i) => sum + i.totalItemPrice,
        0
      );

      saveStateIntoLocalStorage(state);
    },

    removeFromCart: (state, action) => {
      const _id = action.payload;
      const existingItem = state.cartItems.find(item => item._id === _id);
      if (!existingItem) return;

      state.totalQuantity -= existingItem.quantity;
      state.totalPrice = Number((state.totalPrice - existingItem.quantity * existingItem.price).toFixed(2));
      state.cartItems = state.cartItems.filter(item => item._id !== _id);

      saveStateIntoLocalStorage(state);
    },

    emptyCart: (state) => {
      state.cartItems = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      saveStateIntoLocalStorage(state);
    }
  }
});

export const { addToCart, removeFromCart, emptyCart, updateCartQuantity } = cartSlice.actions;
export default cartSlice.reducer;
