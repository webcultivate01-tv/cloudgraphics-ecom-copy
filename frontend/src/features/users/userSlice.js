import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Users (customers) ────────────────────────────────────────

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users");
    }
  }
);

export const toggleBlockUser = createAsyncThunk(
  "users/toggleBlock",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}/block`);
      return { id, isBlocked: data.isBlocked };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete user");
    }
  }
);

// ── Admins ───────────────────────────────────────────────────

export const fetchAllAdmins = createAsyncThunk(
  "users/fetchAdmins",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admins");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch admins");
    }
  }
);

export const createAdmin = createAsyncThunk(
  "users/createAdmin",
  async (adminData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/admins", adminData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create admin");
    }
  }
);

export const updateAdminRole = createAsyncThunk(
  "users/updateAdminRole",
  async ({ id, adminRole }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admins/${id}/role`, { adminRole });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update role");
    }
  }
);

export const removeAdmin = createAsyncThunk(
  "users/removeAdmin",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admins/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove admin");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────

const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    admins: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearUserError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Customers
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.loading = false; state.users = action.payload; })
      .addCase(fetchAllUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        const u = state.users.find((u) => u._id === action.payload.id);
        if (u) u.isBlocked = action.payload.isBlocked;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      })

      // Admins
      .addCase(fetchAllAdmins.pending, (state) => { state.loading = true; })
      .addCase(fetchAllAdmins.fulfilled, (state, action) => { state.loading = false; state.admins = action.payload; })
      .addCase(fetchAllAdmins.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createAdmin.fulfilled, (state, action) => { state.admins.unshift(action.payload); })
      .addCase(updateAdminRole.fulfilled, (state, action) => {
        const idx = state.admins.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.admins[idx] = action.payload;
      })
      .addCase(removeAdmin.fulfilled, (state, action) => {
        state.admins = state.admins.filter((a) => a._id !== action.payload);
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
