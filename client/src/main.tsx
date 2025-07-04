import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./stores/store";
import Router from "./router";
import "./assets/css/app.css";
import "./i18n";
import ScrollToTop from "@/components/Base/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import { useInactivityTracker } from "./actions/userActive";
import { UploadProvider } from "@/components/UploadContext";
import UploadStatus from "@/components/UploadStatus";
import FaviconUpdater from "./pages/SettingsData";
import { checkLoginDuration } from "./actions/authAction";

const CssPreloader = ({ children }: { children: React.ReactNode }) => {
  const [stylesLoaded, setStylesLoaded] = React.useState(false);

  useEffect(() => {
    const styleSheets = Array.from(document.styleSheets);
    const appCssLoaded = styleSheets.some(
      (sheet) =>
        sheet.href?.includes("app.css") || sheet.href?.includes("chunk.css")
    );

    if (appCssLoaded) {
      setStylesLoaded(true);
      return;
    }

    const timer = setTimeout(() => setStylesLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return stylesLoaded ? <>{children}</> : null;
};

const App = () => {
  useInactivityTracker();

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkLoginDuration();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <UploadProvider>
      <CssPreloader>
        <FaviconUpdater />
        <ScrollToTop />
        <Router />
        <UploadStatus />
      </CssPreloader>
    </UploadProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
