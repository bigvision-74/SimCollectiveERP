// src/features/settings/settingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getSettingsAction } from '../actions/settingAction'; // Ensure this path is correct
import { RootState } from '@/stores/store'; // Import RootState from your store

export interface SettingsState {
  data: any; // You might want to define a more specific type for your settings data
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk<any, void, { rejectValue: string }>(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getSettingsAction();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null; // Clear any previous errors on success
      })
      .addCase(fetchSettings.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch settings';
      });
  },
});

// Selector to get the entire settings state slice
export const selectSettings = (state: RootState) => state.settings;

// You can also create selectors for specific parts of the settings state if needed
export const selectSettingsData = (state: RootState) => state.settings.data;
export const selectSettingsLoading = (state: RootState) => state.settings.loading;
export const selectSettingsError = (state: RootState) => state.settings.error;


export default settingsSlice.reducer;