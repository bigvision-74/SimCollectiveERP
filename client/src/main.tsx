import React, { useEffect, useState } from "react";
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
import LoadingDots from "@/components/LoadingDots/LoadingDots";
import { AppProvider } from "./contexts/sessionContext";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import env from "../env"; // adjust path if needed

const AppPreloader = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const styleSheets = Array.from(document.styleSheets);
    const isCssLoaded = styleSheets.some(
      (sheet) =>
        sheet.href?.includes("app.css") || sheet.href?.includes("chunk.css")
    );

    const timer = setTimeout(() => setIsReady(true), 300);

    if (isCssLoaded) {
      clearTimeout(timer);
      setIsReady(true);
    }

    return () => clearTimeout(timer);
  }, []);

  return isReady ? <>{children}</> : <FullPageLoading />;
};

const FullPageLoading = () => <LoadingDots />;

const App = () => {
  useInactivityTracker();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkLoginDuration();
    }, 60000);

    const loadTimer = setTimeout(() => setIsInitialLoad(false), 500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <UploadProvider>
      {isInitialLoad ? (
        <FullPageLoading />
      ) : (
        <AppPreloader>
          <FaviconUpdater />
          <ScrollToTop />
          <Router />
          <UploadStatus />
        </AppPreloader>
      )}
    </UploadProvider>
  );
};

const preloadComponents = () => {
  const components = [
    import("@/components/LoadingDots/LoadingDots"),
    import("@/pages/Login"),
    import("@/pages/Homepage"),
  ];
  return Promise.all(components);
};

preloadComponents();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <HelmetProvider>
          <AppProvider>
            <GoogleReCaptchaProvider reCaptchaKey={env.RECAPTCHA_SITE_KEY}>
              <App />
            </GoogleReCaptchaProvider>
          </AppProvider>
        </HelmetProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
