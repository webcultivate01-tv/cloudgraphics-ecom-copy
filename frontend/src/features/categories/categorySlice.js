import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api/categories";

const authHeader = (getState) => ({
  headers: { Authorization: `Bearer ${getState().auth.user?.token}` },
});

export const fetchCategoriesAdmin = createAsyncThunk("categories/fetchAdmin", async (_, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.get(`${API}/admin/all`, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to load categories");
  }
});

export const fetchCategories = createAsyncThunk("categories/fetchPublic", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get(API);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to load categories");
  }
});

export const createCategory = createAsyncThunk("categories/create", async (payload, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.post(API, payload, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create category");
  }
});

export const updateCategory = createAsyncThunk("categories/update", async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.put(`${API}/${id}`, payload, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update category");
  }
});

export const deleteCategory = createAsyncThunk("categories/delete", async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${API}/${id}`, authHeader(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete category");
  }
});

export const addSubcategory = createAsyncThunk("categories/addSub", async ({ catId, name }, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${API}/${catId}/subcategories`, { name }, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add subcategory");
  }
});

export const updateSubcategory = createAsyncThunk("categories/updateSub", async ({ catId, subId, payload }, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.put(`${API}/${catId}/subcategories/${subId}`, payload, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update subcategory");
  }
});

export const deleteSubcategory = createAsyncThunk("categories/deleteSub", async ({ catId, subId }, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.delete(`${API}/${catId}/subcategories/${subId}`, authHeader(getState));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete subcategory");
  }
});

const upsert = (state, updated) => {
  const idx = state.items.findIndex((c) => c._id === updated._id);
  if (idx >= 0) state.items[idx] = updated;
  else state.items.push(updated);
};

const categorySlice = createSlice({
  name: "categories",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    const pending  = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; };

    builder
      .addCase(fetchCategoriesAdmin.pending,  pending)
      .addCase(fetchCategoriesAdmin.rejected, rejected)
      .addCase(fetchCategoriesAdmin.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })

      .addCase(fetchCategories.pending,  pending)
      .addCase(fetchCategories.rejected, rejected)
      .addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })

      .addCase(createCategory.pending,  pending)
      .addCase(createCategory.rejected, rejected)
      .addCase(createCategory.fulfilled, (s, a) => { s.loading = false; s.items.unshift(a.payload); })

      .addCase(updateCategory.pending,  pending)
      .addCase(updateCategory.rejected, rejected)
      .addCase(updateCategory.fulfilled, (s, a) => { s.loading = false; upsert(s, a.payload); })

      .addCase(deleteCategory.pending,  pending)
      .addCase(deleteCategory.rejected, rejected)
      .addCase(deleteCategory.fulfilled, (s, a) => { s.loading = false; s.items = s.items.filter((c) => c._id !== a.payload); })

      .addCase(addSubcategory.pending,  pending)
      .addCase(addSubcategory.rejected, rejected)
      .addCase(addSubcategory.fulfilled, (s, a) => { s.loading = false; upsert(s, a.payload); })

      .addCase(updateSubcategory.pending,  pending)
      .addCase(updateSubcategory.rejected, rejected)
      .addCase(updateSubcategory.fulfilled, (s, a) => { s.loading = false; upsert(s, a.payload); })

      .addCase(deleteSubcategory.pending,  pending)
      .addCase(deleteSubcategory.rejected, rejected)
      .addCase(deleteSubcategory.fulfilled, (s, a) => { s.loading = false; upsert(s, a.payload); });
  },
});

export default categorySlice.reducer;
