import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface OrgState {
  orgId: string;
  userId: string;
  planType: string;
  date: string;
}

const initialState: OrgState = {
  orgId: "",
  userId: "",
  planType: "",
  date: ""
};

export const orgSlice = createSlice({
  name: "org",
  initialState,
  reducers: {
    setOrgId: (state, action: PayloadAction<string>) => {
      state.orgId = action.payload;
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setPlanType: (state, action: PayloadAction<string>) => {
      state.planType = action.payload;
    },
    setDate: (state, action: PayloadAction<string>) => {
      state.date = action.payload;
    },
  },
});

export const { setOrgId, setUserId, setPlanType, setDate } = orgSlice.actions;

// Key change: Match the selector pattern of working slices
export const selectOrgId = (state: RootState) => state.org.orgId;
export const selectUserId = (state: RootState) => state.org.userId;
export const selectPlanType = (state: RootState) => state.org.planType;
export const selectDate = (state: RootState) => state.org.date;

export default orgSlice.reducer;