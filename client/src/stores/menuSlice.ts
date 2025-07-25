import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { type Themes } from "@/stores/themeSlice";
import { icons } from "@/components/Base/Lucide";
import sideMenu from "@/main/side-menu";
import simpleMenu from "@/main/simple-menu";
import topMenu from "@/main/top-menu";

export interface Menu1 {
  icon: keyof typeof icons;
  title: string;
  badge?: number;
  pathname?: string;
  subMenu?: Menu1[];
  ignore?: boolean;
}

export interface MenuState {
  menu: Array<Menu1 | string>;
}

const initialState: MenuState = {
  menu: [],
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
});

export const selectMenu = (layout: Themes["layout"]) => (state: RootState) => {
  if (layout == "side-menu") {
    return sideMenu;
  }

  if (layout == "simple-menu") {
    return simpleMenu;
  }

  return topMenu;
};

export default menuSlice.reducer;
