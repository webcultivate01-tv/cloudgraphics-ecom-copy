import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// --- Async Thunks ---

export const placeOrder = createAsyncThunk(
  "orders/place",
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/orders", orderData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to place order");
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders/my");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/orders?${query}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update status");
    }
  }
);

export const requestCancelOTP = createAsyncThunk(
  "orders/requestCancelOTP",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/orders/${id}/cancel-otp`);
      return data; // { message: "OTP sent to ..." }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send OTP");
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async ({ id, otp }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { otp });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to cancel order");
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "orders/dashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders/admin/stats");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch stats");
    }
  }
);

// --- Slice ---

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    stats: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetOrderState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(placeOrder.fulfilled, (state, action) => { state.loading = false; state.success = true; state.orders.unshift(action.payload); })
      .addCase(placeOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload; })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchAllOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload; })
      .addCase(fetchAllOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })

      .addCase(requestCancelOTP.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(requestCancelOTP.fulfilled, (state) => { state.loading = false; })
      .addCase(requestCancelOTP.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(cancelOrder.pending,   (state) => { state.loading = true; })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.orders.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(cancelOrder.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
