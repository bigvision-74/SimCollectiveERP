import React, { useEffect, useState } from "react";
import "./style.css";
import { useTranslation } from "react-i18next";
import LazyImage from "@/components/LazyImage";
import vpr from "@/assetsA/images/simVprLogo.png";
import Button from "../Base/Button";
import versionData from "../../version.json";

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { t } = useTranslation();
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const buildDate = versionData?.buildDate
    ? new Date(versionData.buildDate)
    : null;

  const formattedDate = buildDate
    ? buildDate.toLocaleString(undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="">
      <footer className="py-4 bg-[rgba(184,230,254,0.48)] backdrop-blur-lg">
        <div className="container mx-auto text-center mt-2 text-gray-700 px-4 copyrightInfo">
          <p className="">
            <span className="text-gray-800 font-bold"> © </span>{" "}
            {new Date().getFullYear()} {t("Copyright")}{" "}
            <span className="text-gray-800 font-bold">{t("SimVPR")}</span>.{" "}
            {t("Rights")}.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-gray-800 text-[10px] md:text-[13px]">
            {/* Powered by + Logo */}
            <p className="flex items-center justify-center gap-1 m-0">
              {t("powered_by")}
              <a
                className="cursor-pointer inline-flex items-center hover:opacity-80 transition ml-1"
                onClick={() => window.open("https://www.mxr.ai/", "_blank")}
              >
                <img
                  src="https://insightxr.s3.eu-west-2.amazonaws.com/image/9LFQ-ydCp-Mxr-logo.png"
                  alt="Meta Extended Reality"
                  className="w-14 md:w-16 h-auto"
                />
              </a>
            </p>

            {/* Divider */}
            <span className="mx-1 text-black">|</span>

            {/* Version Info */}
            <p className="flex items-center gap-1 m-0 text-black">
              <span className="font-semibold">v{versionData.version}</span>
              <span>•</span>
              <span className="text-gray-800">{formattedDate}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
