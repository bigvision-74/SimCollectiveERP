// import React, { useState, useEffect, useTransition } from "react";
// import { Link, NavLink } from "react-router-dom";
// import { useAuth } from "../AuthRoutes";
// import "./style.css";
// import Menu from "../Base/Headless/Menu";
// import Lucide from "@/components/Base/Lucide";
// import { useTranslation } from "react-i18next";
// import { getLanguageAction } from "@/actions/adminActions";
// import Button from "@/components/Base/Button";
// import { useNavigate } from "react-router-dom";
// import fallbackLogo from "@/assetsA/images/simVprLogo.png";
// import { useLocation } from "react-router-dom";
// import { getSettingsAction } from "@/actions/settingAction";

// interface Language {
//   id: number;
//   name: string;
//   code: string;
//   flag: string;
//   status: string;
// }

// const Header: React.FC = () => {
//   const navigate = useNavigate();
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const { authenticated, role } = useAuth();
//   const { i18n, t } = useTranslation();
//   const location = useLocation();
//   const forceSolidHeaderPaths = ["/GDPR", "/term-conditions"];
//   const forceSolidHeader = forceSolidHeaderPaths.includes(location.pathname);
//   const [, startTransition] = useTransition();
//   const [logoUrl, setLogoUrl] = useState<string | null>(null);

//   const determineDashboard = (role: string | null) => {
//     switch (role) {
//       case "Superadmin":
//         return "/dashboard";
//       case "Admin":
//         return "/dashboard-admin";
//       case "Faculty":
//         return "/dashboard-faculty";
//       case "worker":
//         return "/dashboard-user";
//       default:
//         return "/login";
//     }
//   };

//   useEffect(() => {
//     const fetchLogo = async () => {
//       try {
//         const res = await getSettingsAction();
//         if (res?.logo) {
//           setLogoUrl(res.logo);
//         }
//       } catch (error) {
//         console.error("Failed to load logo from settings:", error);
//       }
//     };

//     fetchLogo();
//   }, []);

//   const [colorPhase, setColorPhase] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorPhase((prev) => (prev + 1) % 3);
//     }, 8000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 1);
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const [languages, setLanguages] = React.useState<Language[]>([]);

//   const fetchLanguage = async () => {
//     try {
//       const res = await getLanguageAction();
//       const updatedLanguages = res.map((language: Language) => ({
//         ...language,
//         active: language.status === "active",
//       }));

//       setLanguages(updatedLanguages);
//     } catch (error) {
//       console.error("Error fetching languages:", error);
//     }
//   };

//   useEffect(() => {
//     fetchLanguage();
//   }, []);

//   const currentLangLabel =
//     languages.find((lang) => lang.code === i18n.language)?.name ||
//     i18n.language;

//   const currentLanguageFlag =
//     languages.find((lang) => lang.code === i18n.language)?.flag ||
//     i18n.language;

//   const activeStyle = "text-orange-600";

//   const handleNavigate = () => {
//     startTransition(() => {
//       navigate(determineDashboard(role));
//     });
//   };

//   const FlagImage = ({ code }: { code: string }) => {
//     const [error, setError] = useState(false);

//     if (error || !code) {
//       return <div className="mr-2 w-6 h-6 bg-gray-200 rounded"></div>;
//     }

//     return (
//       <img
//         src={`https://flagcdn.com/w320/${code.toLowerCase()}.png`}
//         alt="flag"
//         className="mr-2 w-6 h-6"
//         onError={() => setError(true)}
//       />
//     );
//   };

//   return (
//     <>
//       <div
//         className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity  ${
//           isMenuOpen ? "opacity-800 visible" : "opacity-0 invisible"
//         }`}
//         onClick={toggleMenu}
//       ></div>
//       <header
//         className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
//           isScrolled || forceSolidHeader
//             ? "bg-gradient-to-br from-[#8be2f7] via-[#7dd8f0] to-[#6fcee9] shadow-lg backdrop-blur-[4px]"
//             : "bg-gradient-to-br from-[#8be2f7] via-[#7dd8f0] to-[#6fcee9] shadow-lg backdrop-blur-[4px]"
//         }`}
//       >
//         <div className="container mx-auto flex justify-between items-center py-4">
//           <div className="logo">
//             <a
//               href="/"
//               onClick={(e) => {
//                 e.preventDefault();
//                 startTransition(() => {
//                   navigate("/");
//                 });
//               }}
//             >
//               <img
//                 className="mt-1 w-20"
//                 src={logoUrl || fallbackLogo}
//                 alt="SimVPR logo"
//               />
//             </a>
//           </div>

//           <button
//             className="mobile-menu-btn toggleButtonMobile"
//             onClick={toggleMenu}
//           >
//             ☰
//           </button>

//           <nav id="navmenu" className={`navmenu ${isMenuOpen ? "active" : ""}`}>
//             <ul
//               className={`flex flex-col md:flex-row space-x-0 md:space-x-8  ${
//                 isMenuOpen ? "block" : "hidden md:block"
//               }`}
//             >
//               <li>
//                 <NavLink
//                   to="/"
//                   className={({ isActive }) =>
//                     isActive ? `text-primary ${activeStyle}` : "text-white"
//                   }
//                 >
//                   {t("Home")}
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink
//                   to="/pricing"
//                   className={({ isActive }) =>
//                     isActive ? `text-primary ${activeStyle}` : "text-white"
//                   }
//                 >
//                   {t("Pricing")}
//                 </NavLink>
//               </li>{" "}
//               <li>
//                 <NavLink
//                   to="/contact-us"
//                   className={({ isActive }) =>
//                     isActive ? `text-primary ${activeStyle}` : "text-white"
//                   }
//                 >
//                   {t("ContactUs")}
//                 </NavLink>
//               </li>
//               {isMenuOpen && (
//                 <li className="mt-4 md:hidden">
//                   <Menu>
//                     <Menu.Button
//                       as={Button}
//                       style={{ border: "none", outline: "none" }}
//                     >
//                       <span className="text-white flex">
//                         <img
//                           src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
//                           alt={`flag`}
//                           className="mr-2 w-6 h-6"
//                         />
//                         {currentLangLabel}
//                       </span>
//                       <Lucide
//                         icon="ChevronDown"
//                         className="w-5 h-5 ml-2 text-white"
//                         strokeWidth={2.5}
//                       />
//                     </Menu.Button>
//                     <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto">
//                       {languages.map((lang, key) => (
//                         <Menu.Item key={key}>
//                           <button
//                             onClick={() => i18n.changeLanguage(lang.code)}
//                             className="flex items-center w-full p-2 text-left hover:bg-gray-100"
//                           >
//                             <FlagImage code={lang.flag} />
//                             <span>{lang.name}</span>
//                           </button>
//                         </Menu.Item>
//                       ))}
//                     </Menu.Items>
//                   </Menu>
//                 </li>
//               )}
//               {isMenuOpen && (
//                 <li className="mt-4 md:hidden">
//                   {authenticated ? (
//                     <Link
//                       className="btn text-lg ml-4 px-3 py-2 text-white rounded-lg signInDashboardBtn"
//                       to={determineDashboard(role)}
//                       style={{
//                         backgroundColor: "#5b21b6",
//                       }}
//                     >
//                       {t("dashboard")}
//                     </Link>
//                   ) : (
//                     <Link
//                       className="btn btn-get-started text-lg ml-4 px-3 py-2 text-white rounded-lg hover:text-white signInDashboardBtn"
//                       style={{
//                         backgroundColor: "#5b21b6",
//                       }}
//                       to="/login"
//                     >
//                       {t("sign_in")}
//                     </Link>
//                   )}
//                 </li>
//               )}
//             </ul>
//           </nav>

//           <div className="hidden md:flex items-center  lg:mt-0 signInDashboard">
//             {authenticated ? (
//               <Button
//                 onClick={handleNavigate}
//                 variant="primary"
//                 className="mr-2 shadow-md AddNewCourse"
//               >
//                 {t("dashboard")}
//               </Button>
//             ) : (
//               <Button
//                 as="a"
//                 href="/login"
//                 variant="primary"
//                 className="mr-2 shadow-md AddNewCourse"
//               >
//                 {t("sign_in")}
//               </Button>
//             )}

//             <div className="flex items-center mt-4 lg:mt-0 signInDashboard">
//               <Menu>
//                 <Menu.Button
//                   as={Button}
//                   style={{ border: "none", outline: "none" }}
//                 >
//                   <span className="text-white flex">
//                     <img
//                       src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
//                       alt={`flag`}
//                       className="mr-2 w-6 h-6"
//                     />
//                     {currentLangLabel}
//                   </span>
//                   <Lucide
//                     icon="ChevronDown"
//                     className="w-5 h-5 ml-2 text-white"
//                     bold
//                   />
//                 </Menu.Button>
//                 <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
//                   {languages
//                     .filter((lang) => lang.status == "active")
//                     .map((lang, key) => (
//                       <Menu.Item key={key}>
//                         <button
//                           onClick={() => i18n.changeLanguage(lang.code)}
//                           className={`flex items-center block p-2 w-full text-left text-black mr-5`}
//                         >
//                           <img
//                             src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
//                             alt={`${lang.name} flag`}
//                             className="mr-2 w-6 h-6"
//                           />
//                           <p className="text-grey-800">{lang.name}</p>
//                         </button>
//                       </Menu.Item>
//                     ))}
//                 </Menu.Items>
//               </Menu>
//             </div>
//           </div>
//         </div>
//       </header>
//     </>
//   );
// };

// export default Header;

import React, { useState, useEffect, useTransition } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../AuthRoutes";
import "./style.css";
import Menu from "../Base/Headless/Menu";
import Lucide from "@/components/Base/Lucide";
import { useTranslation } from "react-i18next";
import { getLanguageAction } from "@/actions/adminActions";
import Button from "@/components/Base/Button";
import { useNavigate } from "react-router-dom";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
import { useLocation } from "react-router-dom";
import { getSettingsAction } from "@/actions/settingAction";

interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
  status: string;
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
    const fetchLogo = async () => {
      try {
        const res = await getSettingsAction();
        if (res?.logo) {
          setLogoUrl(res.logo);
        }
      } catch (error) {
        console.error("Failed to load logo from settings:", error);
      }
    };

    fetchLogo();
  }, []);

  const [colorPhase, setColorPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorPhase((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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
        active: language.status === "active",
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
    languages.find((lang) => lang.code === i18n.language)?.name ||
    i18n.language;

  const currentLanguageFlag =
    languages.find((lang) => lang.code === i18n.language)?.flag ||
    i18n.language;

  const activeStyle = "text-white font-bold";

  const handleNavigate = () => {
    startTransition(() => {
      navigate(determineDashboard(role));
    });
  };

  const FlagImage = ({ code }: { code: string }) => {
    const [error, setError] = useState(false);

    if (error || !code) {
      return <div className="mr-2 w-6 h-6 bg-gray-200 rounded"></div>;
    }

    return (
      <img
        src={`https://flagcdn.com/w320/${code.toLowerCase()}.png`}
        alt="flag"
        className="mr-2 w-6 h-6"
        onError={() => setError(true)}
      />
    );
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
        className={`sticky top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled || forceSolidHeader
            ? "bg-gradient-to-r from-[rgba(91,33,182,0.25)] via-[rgba(3,105,161,0.25)] to-[rgba(3,105,161,0.25)] backdrop-blur-md shadow-sm"
            : "bg-gradient-to-r from-[rgba(91,33,182,0.25)] via-[rgba(3,105,161,0.25)] to-[rgba(3,105,161,0.25)] backdrop-blur-md shadow-sm"
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
              <img
                className="mt-1 w-20"
                src={logoUrl || fallbackLogo}
                alt="SimVPR logo"
              />
            </a>
          </div>

          <button
            className="mobile-menu-btn toggleButtonMobile text-dark"
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
                    isActive
                      ? activeStyle
                      : "text-primary font-bold hover:opacity-80"
                  }
                >
                  {t("Home")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    isActive
                      ? activeStyle
                      : "text-primary font-bold hover:opacity-80 pricingResponsive"
                  }
                >
                  {t("Pricing")}
                </NavLink>
              </li>{" "}
              <li>
                <NavLink
                  to="/contact-us"
                  className={({ isActive }) =>
                    isActive
                      ? activeStyle
                      : "text-primary font-bold hover:opacity-80"
                  }
                >
                  {t("ContactUs")}
                </NavLink>
              </li>
              {isMenuOpen && (
                <li className="mt-4 md:hidden">
                  <Menu>
                    <Menu.Button variant="outline-primary1" as={Button}>
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
                    <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto">
                      {languages.map((lang, key) => (
                        <Menu.Item key={key}>
                          <button
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className="flex items-center w-full p-2 text-left hover:bg-gray-100"
                          >
                            <FlagImage code={lang.flag} />
                            <span>{lang.name}</span>
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
                        background: "rgba(91, 33, 182, 0.8)",
                      }}
                    >
                      {t("dashboard")}
                    </Link>
                  ) : (
                    <Link
                      className="btn btn-get-started text-lg ml-4 px-3 py-2 text-white rounded-lg hover:text-white signInDashboardBtn"
                      style={{
                        background: "rgba(91, 33, 182, 0.8)",
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

          <div className="hidden md:flex items-center lg:mt-0 signInDashboard">
            {authenticated ? (
              <Button
                onClick={handleNavigate}
                variant="primary"
                className="mr-2 shadow-md AddNewCourse"
                style={{
                  background: "rgba(91, 33, 182, 0.8)",
                  color: "white",
                }}
              >
                {t("dashboard")}
              </Button>
            ) : (
              <Button
                as="a"
                href="/login"
                variant="primary"
                className="mr-2 shadow-md AddNewCourse"
                style={{
                  background: "rgba(91, 33, 182, 0.8)",
                  color: "white",
                }}
              >
                {t("sign_in")}
              </Button>
            )}

            <div className="flex items-center mt-4 lg:mt-0  signInDashboard languageDropdown">
              <Menu>
                <Menu.Button
                  as={Button}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "rgba(255, 255, 255, 0.2)",
                  }}
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
                    bold
                  />
                </Menu.Button>
                <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
                  {languages
                    .filter((lang) => lang.status == "active")
                    .map((lang, key) => (
                      <Menu.Item key={key}>
                        <button
                          onClick={() => i18n.changeLanguage(lang.code)}
                          className={`flex items-center block p-2 w-full text-left text-black mr-5`}
                        >
                          <img
                            src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
                            alt={`${lang.name} flag`}
                            className="mr-2 w-6 h-6"
                          />
                          <p className="text-grey-800">{lang.name}</p>
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
