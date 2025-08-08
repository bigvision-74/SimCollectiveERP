// import {
//   selectTheme,
//   getTheme,
//   setTheme,
//   themes,
//   Themes,
// } from "@/stores/themeSlice";
// import { useAppDispatch } from "@/stores/hooks";
// import ThemeSwitcher from "@/components/ThemeSwitcher";
// import { useLocation, Navigate } from "react-router-dom";
// import { useEffect } from "react";
// import { useAppSelector } from "@/stores/hooks";
// import { useAppContext } from "@/contexts/sessionContext";
// import LoadingDots from "@/components/LoadingDots/LoadingDots";

// function Main() {
//   const dispatch = useAppDispatch();
//   const theme = useAppSelector(selectTheme);

//   const { user, sessionInfo, isLoading } = useAppContext();
// console.log(sessionInfo,"nmmghjghjghjghjghjghm")

//   if (isLoading) {
//     return <LoadingDots />;
//   }

//   if (
//     sessionInfo.isActive &&
//     sessionInfo.patientId &&
//     user && // This will be a valid user object
//     (user.role === "User" || user.role === "Observer")
//   ) {
//     return (
//       <Navigate to={`/patients-view/${sessionInfo.patientId}`} replace />
//     );
//   }

//   const Component = getTheme(theme).component;
//   const { search } = useLocation();
//   const queryParams = new URLSearchParams(search);

//   const switchTheme = (theme: Themes["name"]) => {
//     dispatch(setTheme(theme));
//   };

//   useEffect(() => {
//     if (queryParams.get("theme")) {
//       const selectedTheme = themes.find(
//         (theme) => theme.name === queryParams.get("theme")
//       );
//       if (selectedTheme) {
//         switchTheme(selectedTheme.name);
//       }
//     }
//   }, [search]);

//   return (
//     <div>
//       <ThemeSwitcher />
//       <Component />
//     </div>
//   );
// }

// export default Main;

import {
  selectTheme,
  getTheme,
  setTheme,
  themes,
  Themes,
} from "@/stores/themeSlice";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/contexts/sessionContext";
import LoadingDots from "@/components/LoadingDots/LoadingDots";

function Main() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { user, sessionInfo, isLoading } = useAppContext();
  const { search, pathname } = useLocation();
  const queryParams = new URLSearchParams(search);

  const switchTheme = (theme: Themes["name"]) => {
    dispatch(setTheme(theme));
  };

  useEffect(() => {
    if (queryParams.get("theme")) {
      const selectedTheme = themes.find(
        (theme) => theme.name === queryParams.get("theme")
      );
      if (selectedTheme) {
        switchTheme(selectedTheme.name);
      }
    }
  }, [search]);

  if (isLoading) {
    return <LoadingDots />;
  }

  if (
    sessionInfo.isActive &&
    sessionInfo.patientId &&
    user &&
    (user.role === "User" || user.role === "Observer")
  ) {
    return <Navigate to={`/patients-view/${sessionInfo.patientId}`} replace />;
  }

  const Component = getTheme(theme).component;

  return (
    <div>
      <ThemeSwitcher />
      <Component />
    </div>
  );
}

export default Main;
