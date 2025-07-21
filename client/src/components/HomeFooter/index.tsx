import React, { useEffect, useState } from "react";
import "./style.css";
import { useTranslation } from "react-i18next";
// import final from '@/assetsA/images/Final-logo-InsightXR.png';
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
      <footer className="py-4 bg-[#7fc3c3]">
        {/* <div className="container mx-auto text-center ">
          <div className="grid grid-cols-1 md:grid-cols-3 ">
            <div className="col Xrfooterlogo ">
              <LazyImage
                src={vpr}
                alt="SimVpr"
                className="footerLogo mb-4 mx-auto w-24 ml-[-0px]"
              />
              <p className="text-white footerPara text-left">{t("sim_para")}</p>
              <div className="mt-4 socialLinks flex justify-center mb-5 float-left ">
                <a>
                  <i
                    className="bi bi-twitter mr-2 OrgIcons"
                    style={{ color: "#5b21b6" }}
                  ></i>
                </a>
                <a>
                  <i
                    className="bi bi-facebook mr-2 OrgIcons"
                    style={{ color: "#5b21b6" }}
                  ></i>
                </a>
                <a>
                  <i
                    className="bi bi-instagram mr-2 OrgIcons"
                    style={{ color: "#5b21b6" }}
                  ></i>
                </a>
                <a>
                  <i
                    className="bi bi-linkedin mr-2 OrgIcons"
                    style={{ color: "#5b21b6" }}
                  ></i>
                </a>
              </div>
            </div>

           
            <div className="ml-36 col mt-12 usefulLinks">
              <h3 className="text-primary text-2xl mb-3 text-left">
                {t("footer_links")}
              </h3>
              <ul className="text-white list-none space-y-2 text-left">
                <li>
                  <a href="/pricingPage" className="footerLinks">
                    {t("pricing")}
                  </a>
                </li>
                <li>
                  <a href="/contact" className="footerLinks">
                    {t("contactus")}
                  </a>
                </li>
                <li>
                  <a href="/term-conditions" className="footerLinks">
                    {t("termconditions")}
                  </a>
                </li>
                <li>
                  <a href="/platform" className="footerLinks">
                    {t("analityics_resources")}
                  </a>
                </li>
                <li>
                  <a href="/GDPR" className="footerLinks">
                    {t("gdpr")}
                  </a>
                </li>
              </ul>
            </div>

    
            <div className="ml-36 col mt-12 solutionLinks">
              <h3 className="text-primary text-2xl mb-3 text-left">
                {t("solutions")}
              </h3>
              <ul className="text-white list-none space-y-2 text-left">
                <li>
                  <a href="/solutions" className="footerLinks">
                    {t("enterprise_solution")}
                  </a>
                </li>
                <li>
                  <a href="/solutions" className="footerLinks">
                    {t("academic_solution")}
                  </a>
                </li>
                <li>
                  <a href="/solutions" className="footerLinks">
                    {t("healthcare_solution")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div> */}

        {/* <div className="footerBorder mt-3 mx-auto  border-t border-gray-500"></div> */}

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
