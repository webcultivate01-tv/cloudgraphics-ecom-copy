import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunks ──────────────────────────────────────────────────

export const submitInquiry = createAsyncThunk(
  "inquiry/submit",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/inquiry", formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit inquiry");
    }
  }
);

export const fetchAllInquiries = createAsyncThunk(
  "inquiry/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/inquiry");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch inquiries");
    }
  }
);

export const fetchPendingCount = createAsyncThunk(
  "inquiry/pendingCount",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/inquiry/pending-count");
      return data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch count");
    }
  }
);

export const deleteInquiry = createAsyncThunk(
  "inquiry/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/inquiry/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete inquiry");
    }
  }
);

export const respondToInquiry = createAsyncThunk(
  "inquiry/respond",
  async ({ id, adminResponse }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/inquiry/${id}/respond`, { adminResponse });
      return data.inquiry;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send response");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────

const inquirySlice = createSlice({
  name: "inquiry",
  initialState: {
    inquiries:    [],
    pendingCount: 0,
    loading:      false,
    error:        null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // submit
    builder
      .addCase(submitInquiry.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(submitInquiry.fulfilled,(s) => { s.loading = false; })
      .addCase(submitInquiry.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchAll
    builder
      .addCase(fetchAllInquiries.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAllInquiries.fulfilled,(s, a) => { s.loading = false; s.inquiries = a.payload; })
      .addCase(fetchAllInquiries.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // pendingCount
    builder
      .addCase(fetchPendingCount.fulfilled, (s, a) => { s.pendingCount = a.payload; });

    // delete
    builder
      .addCase(deleteInquiry.fulfilled, (s, a) => {
        s.inquiries = s.inquiries.filter((inq) => inq._id !== a.payload);
        if (s.pendingCount > 0) s.pendingCount -= 1;
      });

    // respond
    builder
      .addCase(respondToInquiry.fulfilled, (s, a) => {
        const idx = s.inquiries.findIndex((inq) => inq._id === a.payload._id);
        if (idx !== -1) s.inquiries[idx] = a.payload;
        if (s.pendingCount > 0) s.pendingCount -= 1;
      });
  },
});

export default inquirySlice.reducer;
