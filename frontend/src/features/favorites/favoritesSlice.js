import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "cg_favorites";

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: { items: load() },
  reducers: {
    toggleFavorite: (state, action) => {
      const product = action.payload;
      const idx = state.items.findIndex((p) => p._id === product._id);
      if (idx >= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items.push(product);
      }
      save(state.items);
    },
    clearFavorites: (state) => {
      state.items = [];
      save([]);
    },
  },
});

export const { toggleFavorite, clearFavorites } = favoritesSlice.actions;
export const selectFavoriteIds = (state) => new Set(state.favorites.items.map((p) => p._id));
export const selectFavoriteCount = (state) => state.favorites.items.length;
export default favoritesSlice.reducer;
