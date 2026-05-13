import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunks ──────────────────────────────────────────────────

export const submitReplacement = createAsyncThunk(
  "replacement/submit",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/replacement", formData);
      return data.replacement;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit request");
    }
  }
);

export const fetchUserReplacements = createAsyncThunk(
  "replacement/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/replacement/user");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch replacements");
    }
  }
);

export const fetchAllReplacements = createAsyncThunk(
  "replacement/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/replacement/admin");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch replacements");
    }
  }
);

const makeStatusThunk = (action, endpoint) =>
  createAsyncThunk(`replacement/${action}`, async ({ id, adminResponse }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/replacement/${id}/${endpoint}`, { adminResponse });
      return data.replacement;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || `Failed to ${action}`);
    }
  });

export const approveReplacement  = makeStatusThunk("approve",  "approve");
export const rejectReplacement   = makeStatusThunk("reject",   "reject");
export const processReplacement  = makeStatusThunk("process",  "process");
export const completeReplacement = makeStatusThunk("complete", "complete");

export const deleteReplacement = createAsyncThunk(
  "replacement/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/replacement/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────

const upsert = (arr, updated) => {
  const idx = arr.findIndex((r) => r._id === updated._id);
  if (idx !== -1) { arr[idx] = updated; } else { arr.unshift(updated); }
};

const replacementSlice = createSlice({
  name: "replacement",
  initialState: {
    userReplacements: [],
    allReplacements:  [],
    loading:          false,
    uploadLoading:    false,
    error:            null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // submit
    builder
      .addCase(submitReplacement.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(submitReplacement.fulfilled,(s, a) => { s.loading = false; s.userReplacements.unshift(a.payload); })
      .addCase(submitReplacement.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchUser
    builder
      .addCase(fetchUserReplacements.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchUserReplacements.fulfilled,(s, a) => { s.loading = false; s.userReplacements = a.payload; })
      .addCase(fetchUserReplacements.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // fetchAll (admin)
    builder
      .addCase(fetchAllReplacements.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchAllReplacements.fulfilled,(s, a) => { s.loading = false; s.allReplacements = a.payload; })
      .addCase(fetchAllReplacements.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // status updates — all four actions handled identically
    const onStatusUpdate = (s, a) => {
      upsert(s.allReplacements, a.payload);
      upsert(s.userReplacements, a.payload);
    };
    for (const thunk of [approveReplacement, rejectReplacement, processReplacement, completeReplacement]) {
      builder.addCase(thunk.fulfilled, onStatusUpdate);
    }

    // delete
    builder.addCase(deleteReplacement.fulfilled, (s, a) => {
      s.allReplacements  = s.allReplacements.filter((r) => r._id !== a.payload);
      s.userReplacements = s.userReplacements.filter((r) => r._id !== a.payload);
    });
  },
});

export default replacementSlice.reducer;
