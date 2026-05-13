import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// --- Async Thunks ---

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/products?${params}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load products");
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Product not found");
    }
  }
);

// Admin: fetch all (including unavailable)
export const fetchAllProductsAdmin = createAsyncThunk(
  "products/fetchAdminAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products/admin/all");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load products");
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create product");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update product");
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id; // return ID to remove from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete product");
    }
  }
);

// --- Slice ---

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    selectedProduct: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchAllProductsAdmin.pending, (state) => { state.loading = true; })
      .addCase(fetchAllProductsAdmin.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAllProductsAdmin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchProductById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.loading = false; state.selectedProduct = action.payload; })
      .addCase(fetchProductById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createProduct.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
