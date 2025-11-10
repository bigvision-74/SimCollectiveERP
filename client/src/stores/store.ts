import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";

import darkModeReducer from "./darkModeSlice";
import colorSchemeReducer from "./colorSchemeSlice";
import menuReducer from "./menuSlice";
import themeReducer from "./themeSlice";
// import orgReducer from "./orgSlice";
import settingsReducer from "./settingsSlice";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    darkMode: darkModeReducer,
    colorScheme: colorSchemeReducer,
    menu: menuReducer,
    theme: themeReducer,
    // org: orgReducer,
    settings: settingsReducer,
    user: userReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;  
