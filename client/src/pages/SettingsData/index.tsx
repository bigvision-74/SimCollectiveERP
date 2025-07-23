import React, { useEffect, useState } from "react";
import { getSettingsAction } from "@/actions/settingAction";

const FaviconUpdater = () => {
  const [faviconUrl, setFaviconUrl] = useState("");
  const [siteTitle, setSiteTitle] = useState("");

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await getSettingsAction();
        if (res?.title) {
          setSiteTitle(res.title);
        }
        if (res?.favicon) {
          setFaviconUrl(res.favicon);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSetting();
  }, []);

  useEffect(() => {
    if (faviconUrl) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.type = "image/png";
      link.href = faviconUrl;
    }

    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [faviconUrl, siteTitle]);

  return null; // No UI rendered
};

export default FaviconUpdater;
