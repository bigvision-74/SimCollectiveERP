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
import { useSessionTimeout } from "./utils/useSessionTimeout";
import { UploadProvider } from "@/components/UploadContext";
import UploadStatus from "@/components/UploadStatus";
import FaviconUpdater from "./pages/SettingsData";
import { checkLoginDuration } from "./actions/authAction";
import LoadingDots from "@/components/LoadingDots/LoadingDots";
import { AppProvider } from "./contexts/sessionContext";
import Version from "./Version";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import env from "../env";
import { SocketManager } from "./contexts/SocketContext";

const BetaBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="beta-banner">
      <div className="beta-content">
        <span className="beta-badge">BETA</span>
        <span className="beta-message">
          This is a beta version - features may change and you might encounter
          some issues
        </span>
      </div>
    </div>
  );
};
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
  useSessionTimeout();
  useInactivityTracker();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  localStorage.removeItem("loginTime");

  return (
    <UploadProvider>
      {/* {isInitialLoad ? (
        <FullPageLoading />
      ) : ( */}
      <SocketManager>
        <AppPreloader>
          <FaviconUpdater />
          <ScrollToTop />
          <Router />
          {/* <Version /> */}
          <UploadStatus />
        </AppPreloader>
      </SocketManager>
      {/* )} */}
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
const betaBannerStyles = `
.beta-banner {  
  background: linear-gradient(90deg, #7f709eff, #b5a5f9ff);
  color: white;
  padding: 6px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.beta-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.beta-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.beta-message {
  font-size: 14px;
}

.beta-dismiss {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.beta-dismiss:hover {
  background: rgba(255,255,255,0.2);
}

@media (max-width: 768px) {
  .beta-banner {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 10px;
  }
  
  .beta-content {
    flex-direction: column;
    gap: 6px;
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = betaBannerStyles;
document.head.appendChild(styleSheet);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <HelmetProvider>
          <AppProvider>
            {/* <BetaBanner /> */}
            <GoogleReCaptchaProvider reCaptchaKey={env.RECAPTCHA_SITE_KEY}>
              <App />
            </GoogleReCaptchaProvider>
          </AppProvider>
        </HelmetProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
