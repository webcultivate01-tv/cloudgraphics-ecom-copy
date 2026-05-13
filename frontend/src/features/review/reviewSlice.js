import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunks ──────────────────────────────────────────────────

export const submitReview = createAsyncThunk(
  "review/submit",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/review", formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit review");
    }
  }
);

export const fetchApprovedReviews = createAsyncThunk(
  "review/fetchApproved",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/review");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

export const fetchAllReviews = createAsyncThunk(
  "review/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/review/admin");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

export const approveReview = createAsyncThunk(
  "review/approve",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/review/${id}/approve`);
      return data.review;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve review");
    }
  }
);

export const deleteReview = createAsyncThunk(
  "review/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/review/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete review");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    approvedReviews: [],
    allReviews:      [],
    loading:         false,
    error:           null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // submit
    builder
      .addCase(submitReview.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(submitReview.fulfilled,(s) => { s.loading = false; })
      .addCase(submitReview.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchApproved
    builder
      .addCase(fetchApprovedReviews.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchApprovedReviews.fulfilled,(s, a) => { s.loading = false; s.approvedReviews = a.payload; })
      .addCase(fetchApprovedReviews.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchAll (admin)
    builder
      .addCase(fetchAllReviews.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAllReviews.fulfilled,(s, a) => { s.loading = false; s.allReviews = a.payload; })
      .addCase(fetchAllReviews.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // approve
    builder
      .addCase(approveReview.fulfilled, (s, a) => {
        const idx = s.allReviews.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.allReviews[idx] = a.payload;
      });

    // delete
    builder
      .addCase(deleteReview.fulfilled, (s, a) => {
        s.allReviews      = s.allReviews.filter((r) => r._id !== a.payload);
        s.approvedReviews = s.approvedReviews.filter((r) => r._id !== a.payload);
      });
  },
});

export default reviewSlice.reducer;
