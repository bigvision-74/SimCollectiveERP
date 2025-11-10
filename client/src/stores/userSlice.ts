
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { getUserOrgIdAction } from '@/actions/userActions';

export interface UserState {
    data: any;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    data: null,
    loading: false,
    error: null,
};

// The async thunk to fetch data
export const fetchOrgDetails = createAsyncThunk<any, void, { rejectValue: string }>(
    'org/fetchOrgDetails',
    async (_, { rejectWithValue }) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                return rejectWithValue('Email not found in local storage');
            }
            const data = await getUserOrgIdAction(email);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch organization details');
        }
    }
);

const userSlice = createSlice({
    name: 'org',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrgDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrgDetails.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchOrgDetails.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.error = action.payload || 'An unknown error occurred';
            });
    },
});

// Selectors that read data from the RootState
export const selectUser = (state: RootState) => state.user;
export const selectUserData = (state: RootState) => state.user.data;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

// 3. Export the reducer from `orgSlice`
export default userSlice.reducer;