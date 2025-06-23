import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage safely
const loadStateFromLocalStorage = () => {
  try {
    const cartData = window.localStorage.getItem("cart");
    if (!cartData) {
      return {
        cartItems: [],
        totalQuantity: 0,
        totalPrice: 0,
      };
    }

    const parsed = JSON.parse(cartData);

    // Sanitize invalid quantity items
    const filteredCartItems = (parsed.cartItems || []).filter(
      (item) =>
        typeof item.quantity === "number" &&
        item.quantity > 0 &&
        item.quantity <= item.stock
    );

    const totalQuantity = filteredCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = filteredCartItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    return {
      cartItems: filteredCartItems.map((item) => ({
        ...item,
        totalItemPrice: item.quantity * item.price,
      })),
      totalQuantity,
      totalPrice,
    };
  } catch (error) {
    console.log("Error while loading cart:", error);
    return {
      cartItems: [],
      totalQuantity: 0,
      totalPrice: 0,
    };
  }
};

// Save to localStorage
const saveStateIntoLocalStorage = (state) => {
  try {
    window.localStorage.setItem("cart", JSON.stringify(state));
  } catch (error) {
    console.log("Error while saving cart to localStorage:", error);
  }
};

const initialState = loadStateFromLocalStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.cartItems.findIndex((item) => item._id === newItem._id);

      // Quantity validation
      if (!newItem.quantity || newItem.quantity <= 0 || newItem.quantity > newItem.stock) {
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

        if (newQuantity > newItem.stock) return;

        existingItem.quantity = newQuantity;
        existingItem.totalItemPrice = newQuantity * existingItem.price;
      }

      state.totalQuantity = state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      state.totalPrice = state.cartItems.reduce((sum, item) => sum + item.totalItemPrice, 0);

      saveStateIntoLocalStorage(state);
    },

    updateCartQuantity: (state, action) => {
      const { _id, quantity } = action.payload;
      const itemIndex = state.cartItems.findIndex((item) => item._id === _id);
      if (itemIndex === -1) return;

      const item = state.cartItems[itemIndex];

      // Guard: invalid quantity
      if (!quantity || quantity <= 0 || quantity > item.stock) return;

      const quantityDifference = quantity - item.quantity;
      item.quantity = quantity;
      item.totalItemPrice = item.price * quantity;
      state.totalQuantity += quantityDifference;

      state.totalPrice = state.cartItems.reduce((sum, i) => sum + i.totalItemPrice, 0);

      saveStateIntoLocalStorage(state);
    },

    removeFromCart: (state, action) => {
      const _id = action.payload;
      const existingItem = state.cartItems.find((item) => item._id === _id);
      if (!existingItem) return;

      state.totalQuantity -= existingItem.quantity;
      state.totalPrice = Number((state.totalPrice - existingItem.totalItemPrice).toFixed(2));
      state.cartItems = state.cartItems.filter((item) => item._id !== _id);

      saveStateIntoLocalStorage(state);
    },

    emptyCart: (state) => {
      state.cartItems = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      saveStateIntoLocalStorage(state);
    },
  },
});

export const { addToCart, removeFromCart, emptyCart, updateCartQuantity } = cartSlice.actions;
export default cartSlice.reducer;
