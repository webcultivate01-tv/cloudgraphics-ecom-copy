import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

export const fetchActiveEvents = createAsyncThunk(
  "events/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/events");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch events");
    }
  }
);

export const fetchAllEventsAdmin = createAsyncThunk(
  "events/fetchAdminAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/events/admin/all");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch events");
    }
  }
);

export const createEvent = createAsyncThunk(
  "events/create",
  async (eventData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/events", eventData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create event");
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, eventData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/events/${id}`, eventData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update event");
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/events/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete event");
    }
  }
);

const eventSlice = createSlice({
  name: "events",
  initialState: {
    events: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveEvents.fulfilled, (state, action) => { state.events = action.payload; })
      .addCase(fetchAllEventsAdmin.pending, (state) => { state.loading = true; })
      .addCase(fetchAllEventsAdmin.fulfilled, (state, action) => { state.loading = false; state.events = action.payload; })
      .addCase(fetchAllEventsAdmin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createEvent.fulfilled, (state, action) => { state.events.unshift(action.payload); })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const idx = state.events.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.events[idx] = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e._id !== action.payload);
      });
  },
});

export default eventSlice.reducer;
