import React, { useState, useEffect, useTransition } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../AuthRoutes";
import "./style.css";
import Menu from "../Base/Headless/Menu";
import Lucide from "@/components/Base/Lucide";
// import { LANGUAGES } from "@/constants";
import { useTranslation } from "react-i18next";
import { getLanguageAction } from "@/actions/adminActions";
import Button from "@/components/Base/Button";
import { useNavigate } from "react-router-dom";
import vpr from "@/assetsA/images/simVprLogo.png";
import { useLocation } from "react-router-dom";

interface Language {
  id: number;
  lang_name: string;
  short_name: string;
  flag: string;
  lang_status: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { authenticated, role } = useAuth();

  const { i18n, t } = useTranslation();
  const location = useLocation();
  const forceSolidHeaderPaths = ["/GDPR", "/term-conditions"];
  const forceSolidHeader = forceSolidHeaderPaths.includes(location.pathname);
  const [, startTransition] = useTransition();

  const determineDashboard = (role: string | null) => {
    switch (role) {
      case "Superadmin":
        return "/dashboard";
      case "Admin":
        return "/dashboard-admin";
      case "Faculty":
        return "/dashboard-faculty";
      case "worker":
        return "/dashboard-user";
      default:
        return "/login";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [languages, setLanguages] = React.useState<Language[]>([]);

  const fetchLanguage = async () => {
    try {
      const res = await getLanguageAction();
      const updatedLanguages = res.map((language: Language) => ({
        ...language,
        active: language.lang_status === "active",
      }));

      setLanguages(updatedLanguages);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  useEffect(() => {
    fetchLanguage();
  }, []);

  const currentLangLabel =
    languages.find((lang) => lang.short_name === i18n.language)?.lang_name ||
    i18n.language;

  const currentLanguageFlag =
    i18n.language === "en_uk"
      ? "gb"
      : languages.find((lang) => lang.short_name === i18n.language)?.flag ||
        i18n.language;
  const activeStyle = "text-primary";

  const handleNavigate = () => {
    startTransition(() => {
      navigate(determineDashboard(role));
    });
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity  ${
          isMenuOpen ? "opacity-800 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleMenu}
      ></div>
      <header
        className={`header fixed top-0 left-0 w-full z-50 transition-all duration-300  ${
          isScrolled || forceSolidHeader
            ? // ? "scrollColor shadow-lg"
              "bg-[#73ced5f2] shadow-lg"
            : "bg-transparent"
          // "bg-[#4aa3df]"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center py-4">
          <div className="logo">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => {
                  navigate("/");
                });
              }}
            >
              <img className="mt-1 w-20" src={vpr} alt="SimVPR logo" />
            </a>
          </div>

          <button
            className="mobile-menu-btn toggleButtonMobile"
            onClick={toggleMenu}
          >
            ☰
          </button>

          <nav id="navmenu" className={`navmenu ${isMenuOpen ? "active" : ""}`}>
            <ul
              className={`flex flex-col md:flex-row space-x-0 md:space-x-8  ${
                isMenuOpen ? "block" : "hidden md:block"
              }`}
            >
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? `text-primary ${activeStyle}` : "text-white"
                  }
                >
                  {t("Home")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/AboutUs"
                  className={({ isActive }) =>
                    isActive ? `text-primary ${activeStyle}` : "text-white"
                  }
                >
                  {t("AboutUs")}
                </NavLink>
              </li>{" "}
              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    isActive ? `text-primary ${activeStyle}` : "text-white"
                  }
                >
                  {t("ContactUs")}
                </NavLink>
              </li>
              {isMenuOpen && (
                <li className="mt-4 md:hidden">
                  <Menu>
                    <Menu.Button
                      as={Button}
                      style={{ border: "none", outline: "none" }}
                    >
                      <span className="text-white flex">
                        <img
                          src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
                          alt={`flag`}
                          className="mr-2 w-6 h-6"
                        />
                        {currentLangLabel}
                      </span>
                      <Lucide
                        icon="ChevronDown"
                        className="w-5 h-5 ml-2 text-white"
                        strokeWidth={2.5}
                      />
                    </Menu.Button>
                    <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md">
                      {languages
                        .filter((lang) => lang.lang_status === "active")
                        .map((lang, key) => (
                          <Menu.Item key={key}>
                            <button
                              onClick={() =>
                                i18n.changeLanguage(lang.short_name)
                              }
                              className={`flex items-center block p-2 text-left text-black`}
                            >
                              <img
                                src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
                                alt={`${lang.lang_name} flag`}
                                className="mr-2 w-6 h-6"
                              />
                              {lang.lang_name}
                            </button>
                          </Menu.Item>
                        ))}
                    </Menu.Items>
                  </Menu>
                </li>
              )}
              {isMenuOpen && (
                <li className="mt-4 md:hidden">
                  {authenticated ? (
                    <Link
                      className="btn text-lg ml-4 px-3 py-2 text-white rounded-lg signInDashboardBtn"
                      to={determineDashboard(role)}
                      style={{
                        backgroundColor: "#fd6f39",
                      }}
                    >
                      {t("dashboard")}
                    </Link>
                  ) : (
                    <Link
                      className="btn btn-get-started text-lg ml-4 px-3 py-2 text-white rounded-lg hover:text-white signInDashboardBtn"
                      style={{
                        backgroundColor: "#fd6f39",
                      }}
                      to="/login"
                    >
                      {t("sign_in")}
                    </Link>
                  )}
                </li>
              )}
            </ul>
          </nav>

          {/* Desktop Sign In button */}
          <div className="hidden md:flex items-center mt-4 lg:mt-0 signInDashboard">
            {authenticated ? (
              <Button
                onClick={handleNavigate}
                variant="primary"
                className="mr-2 shadow-md AddNewCourse"
              >
                {t("dashboard")}
              </Button>
            ) : (
              <Button
                as="a"
                href="/login"
                variant="primary"
                className="mr-2 shadow-md AddNewCourse"
              >
                {t("sign_in")}
              </Button>
            )}

            <div className="flex items-center mt-4 lg:mt-0 signInDashboard">
              <Menu>
                <Menu.Button
                  as={Button}
                  style={{ border: "none", outline: "none" }}
                  variant="outline-primary"
                >
                  <span className="text-white flex">
                    <img
                      src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
                      alt={`flag`}
                      className="mr-2 w-6 h-6"
                    />
                    {currentLangLabel}
                  </span>
                  <Lucide
                    icon="ChevronDown"
                    className="w-5 h-5 ml-2 text-white"
                    strokeWidth={2.5}
                  />
                </Menu.Button>
                <Menu.Items className="w-50 mt-2 bg-white border rounded-lg shadow-md">
                  {languages
                    .filter((lang) => lang.lang_status === "active")
                    .map((lang, key) => (
                      <Menu.Item key={key}>
                        <button
                          onClick={() => i18n.changeLanguage(lang.short_name)}
                          className={`flex items-center block p-2 w-full text-left text-black mr-5`}
                        >
                          <img
                            src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
                            alt={`${lang.lang_name} flag`}
                            className="mr-2 w-6 h-6"
                          />
                          <p>{lang.lang_name}</p>
                        </button>
                      </Menu.Item>
                    ))}
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
