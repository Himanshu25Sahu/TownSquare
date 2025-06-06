import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Load state from localStorage
const storedAuth = JSON.parse(localStorage.getItem("auth"));

const initialState = storedAuth || {
  userData: null,
  token: null,
  isAuthorized: false,
  loading: false,
  error: null,
};

const signup = createAsyncThunk("signup", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_BASEURL}/user/register`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // Return only success status; user data will be set after verification
    return { success: data.success };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Registration failed");
  }
});

const login = createAsyncThunk("login", async (userCredentials, { rejectWithValue }) => {
  try {
    const result = await axios.post(
      `${import.meta.env.VITE_BACKEND_BASEURL}/user/login`,
      userCredentials,
      { withCredentials: true }
    );
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Login failed");
  }
});

const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.userData = null;
      state.token = null;
      state.isAuthorized = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("auth");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
        // Do not set userData or token yet; wait for verification
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload.user;
        state.token = action.payload.token;
        state.isAuthorized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export { signup, login };
export const { logout } = authSlice.actions;
export default authSlice.reducer;