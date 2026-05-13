import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage so it persists across refreshes
const savedCart = localStorage.getItem("cart")
  ? JSON.parse(localStorage.getItem("cart"))
  : [];

const saveCart = (items) => localStorage.setItem("cart", JSON.stringify(items));

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: savedCart,
  },
  reducers: {
    // Add item or increase quantity if already in cart
    addToCart: (state, action) => {
      const { _id, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item._id === _id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...action.payload, quantity });
      }
      saveCart(state.items);
    },

    // Remove item entirely from cart
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      saveCart(state.items);
    },

    // Update quantity for a specific item
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item._id === id);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== id);
        }
      }
      saveCart(state.items);
    },

    // Attach a custom image URL to a specific cart item
    setItemImage: (state, action) => {
      const { id, imageUrl } = action.payload;
      const item = state.items.find((item) => item._id === id);
      if (item) item.uploadedImage = imageUrl;
      saveCart(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    },
  },
});

// Selectors
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const { addToCart, removeFromCart, updateQuantity, setItemImage, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
