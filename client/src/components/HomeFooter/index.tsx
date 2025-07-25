import React, { useEffect, useState } from "react";
import "./style.css";
import { useTranslation } from "react-i18next";
import LazyImage from "@/components/LazyImage";
import vpr from "@/assetsA/images/simVprLogo.png";

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { t } = useTranslation();
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="">
      <footer className="py-4   bg-[#12a6e4ed]">
        <div className="container mx-auto text-center mt-2 text-white px-4 copyrightInfo">
          <p className="mt-10">
            <span className="text-primary"> © </span> {new Date().getFullYear()}{" "}
            {t("Copyright")} <span className="text-primary">{t("SimVPR")}</span>
            . {t("Rights")}.
          </p>
          <p className="mt-2">
            {t("powered_by")}{" "}
            <span className="text-primary">Meta Extended Reality</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
