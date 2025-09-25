// import "@/assets/css/vendors/simplebar.css";
// import "@/assets/css/components/mobile-menu.css";
// import { Transition } from "react-transition-group";
// import { useState, useEffect, createRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { toRaw } from "@/utils/helper";
// import { selectMenu } from "@/stores/menuSlice";
// import { selectTheme } from "@/stores/themeSlice";
// import { useAppSelector } from "@/stores/hooks";
// import { FormattedMenu, linkTo, nestedMenu, enter, leave } from "./mobile-menu";
// import Lucide from "@/components/Base/Lucide";
// import clsx from "clsx";
// import SimpleBar from "simplebar";
// import fallbackLogo from "@/assetsA/images/simVprLogo.png";
// import { getSettingsAction } from "@/actions/settingAction";

// function Main() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [formattedMenu, setFormattedMenu] = useState<
//     Array<FormattedMenu | "divider">
//   >([]);
//   const themeStore = useAppSelector(selectTheme);
//   const menuStore = useAppSelector(selectMenu(themeStore.layout));
//   const menu = () => nestedMenu(toRaw(menuStore), location);
//   const [activeMobileMenu, setActiveMobileMenu] = useState(false);
//   const scrollableRef = createRef<HTMLDivElement>();
//   const [logoUrl, setLogoUrl] = useState<string | null>(null);

//   useEffect(() => {
//     if (scrollableRef.current) {
//       new SimpleBar(scrollableRef.current);
//     }
//     setFormattedMenu(menu());
//   }, [menuStore, location.pathname]);
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
//   return (
//     <>
//       {/* BEGIN: Mobile Menu */}
//       <div
//         className={clsx([
//           "mobile-menu group top-0 inset-x-0 fixed bg-theme-1/90 z-[60] border-b border-white/[0.08] dark:bg-darkmode-800/90 md:hidden",
//           "before:content-[''] before:w-full before:h-screen before:z-10 before:fixed before:inset-x-0 before:bg-black/90 before:transition-opacity before:duration-200 before:ease-in-out",
//           "before:invisible before:opacity-0",
//           "[&.mobile-menu--active]:before:visible [&.mobile-menu--active]:before:opacity-100",
//           activeMobileMenu && "mobile-menu--active",
//         ])}
//       >
//         <div className="h-[70px] px-3 sm:px-8 flex items-center">
//           <a href="" className="flex mr-auto">
//             <img
//               alt="Midone Tailwind HTML Admin Template"
//               className="w-6"
//               src={logoUrl || fallbackLogo}
//             />
//           </a>
//           <a href="#" onClick={(e) => e.preventDefault()}>
//             <Lucide
//               icon="BarChart2"
//               className="w-8 h-8 text-white transform -rotate-90"
//               onClick={() => {
//                 setActiveMobileMenu(!activeMobileMenu);
//               }}
//             />
//           </a>
//         </div>
//         <div
//           ref={scrollableRef}
//           className={clsx([
//             "h-screen z-20 top-0 left-0 w-[270px] -ml-[100%] bg-primary transition-all duration-300 ease-in-out dark:bg-darkmode-800",
//             "[&[data-simplebar]]:fixed [&_.simplebar-scrollbar]:before:bg-black/50",
//             "group-[.mobile-menu--active]:ml-0",
//           ])}
//         >
//           <a
//             href="#"
//             onClick={(e) => e.preventDefault()}
//             className={clsx([
//               "fixed top-0 right-0 mt-4 mr-4 transition-opacity duration-200 ease-in-out",
//               "invisible opacity-0",
//               "group-[.mobile-menu--active]:visible group-[.mobile-menu--active]:opacity-100",
//             ])}
//           >
//             <Lucide
//               icon="XCircle"
//               className="w-8 h-8 text-white transform -rotate-90"
//               onClick={() => {
//                 setActiveMobileMenu(!activeMobileMenu);
//               }}
//             />
//           </a>
//           <ul className="py-2">
//             {/* BEGIN: First Child */}
//             {formattedMenu.map((menu, menuKey) =>
//               menu == "divider" ? (
//                 <li className="my-6 menu__divider" key={menuKey}></li>
//               ) : (
//                 <li key={menuKey}>
//                   <a
//                     href={menu.subMenu ? "#" : menu.pathname}
//                     className={clsx([
//                       menu.active ? "menu menu--active" : "menu",
//                     ])}
//                     onClick={(event) => {
//                       event.preventDefault();
//                       linkTo(menu, navigate, setActiveMobileMenu);
//                       setFormattedMenu([...formattedMenu]);
//                     }}
//                   >
//                     <div className="menu__icon">
//                       <Lucide icon={menu.icon} />
//                     </div>
//                     <div className="menu__title">
//                       {menu.title}
//                       {menu.subMenu && (
//                         <div
//                           className={clsx([
//                             "menu__sub-icon",
//                             menu.activeDropdown && "transform rotate-180",
//                           ])}
//                         >
//                           <Lucide icon="ChevronDown" />
//                         </div>
//                       )}
//                     </div>
//                   </a>
//                   {/* BEGIN: Second Child */}
//                   {menu.subMenu && (
//                     <Transition
//                       in={menu.activeDropdown}
//                       onEnter={enter}
//                       onExit={leave}
//                       timeout={300}
//                     >
//                       <ul
//                         className={clsx({
//                           "menu__sub-open": menu.activeDropdown,
//                         })}
//                       >
//                         {menu.subMenu.map((subMenu, subMenuKey) => (
//                           <li key={subMenuKey}>
//                             <a
//                               href={subMenu.subMenu ? "#" : subMenu.pathname}
//                               className={clsx([
//                                 subMenu.active ? "menu menu--active" : "menu",
//                               ])}
//                               onClick={(event) => {
//                                 event.preventDefault();
//                                 linkTo(subMenu, navigate, setActiveMobileMenu);
//                                 setFormattedMenu([...formattedMenu]);
//                               }}
//                             >
//                               <div className="menu__icon">
//                                 <Lucide icon={subMenu.icon} />
//                               </div>
//                               <div className="menu__title">
//                                 {subMenu.title}
//                                 {subMenu.subMenu && (
//                                   <div
//                                     className={clsx([
//                                       "menu__sub-icon",
//                                       subMenu.activeDropdown &&
//                                         "transform rotate-180",
//                                     ])}
//                                   >
//                                     <Lucide icon="ChevronDown" />
//                                   </div>
//                                 )}
//                               </div>
//                             </a>
//                             {/* BEGIN: Third Child */}
//                             {subMenu.subMenu && (
//                               <Transition
//                                 in={subMenu.activeDropdown}
//                                 onEnter={enter}
//                                 onExit={leave}
//                                 timeout={300}
//                               >
//                                 <ul
//                                   className={clsx({
//                                     "menu__sub-open": subMenu.activeDropdown,
//                                   })}
//                                 >
//                                   {subMenu.subMenu.map(
//                                     (lastSubMenu, lastSubMenuKey) => (
//                                       <li key={lastSubMenuKey}>
//                                         <a
//                                           href={
//                                             lastSubMenu.subMenu
//                                               ? "#"
//                                               : lastSubMenu.pathname
//                                           }
//                                           className={clsx([
//                                             lastSubMenu.active
//                                               ? "menu menu--active"
//                                               : "menu",
//                                           ])}
//                                           onClick={(event) => {
//                                             event.preventDefault();
//                                             linkTo(
//                                               lastSubMenu,
//                                               navigate,
//                                               setActiveMobileMenu
//                                             );
//                                             setFormattedMenu([
//                                               ...formattedMenu,
//                                             ]);
//                                           }}
//                                         >
//                                           <div className="menu__icon">
//                                             <Lucide icon={lastSubMenu.icon} />
//                                           </div>
//                                           <div className="menu__title">
//                                             {lastSubMenu.title}
//                                           </div>
//                                         </a>
//                                       </li>
//                                     )
//                                   )}
//                                 </ul>
//                               </Transition>
//                             )}
//                             {/* END: Third Child */}
//                           </li>
//                         ))}
//                       </ul>
//                     </Transition>
//                   )}
//                   {/* END: Second Child */}
//                 </li>
//               )
//             )}
//             {/* END: First Child */}
//           </ul>
//         </div>
//       </div>
//       {/* END: Mobile Menu */}
//     </>
//   );
// }

// export default Main;

import "@/assets/css/vendors/simplebar.css";
import "@/assets/css/components/mobile-menu.css";
import { Transition } from "react-transition-group";
import { useState, useEffect, createRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toRaw } from "@/utils/helper";
import { selectMenu } from "@/stores/menuSlice";
import { selectTheme } from "@/stores/themeSlice";
import { useAppSelector } from "@/stores/hooks";
import { FormattedMenu, linkTo, nestedMenu, enter, leave } from "./mobile-menu";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import SimpleBar from "simplebar";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
import { getSettingsAction } from "@/actions/settingAction";
import { useTranslation } from "react-i18next";

function MobileMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const role = localStorage.getItem("role");
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const themeStore = useAppSelector(selectTheme);
  const menuStore = useAppSelector(selectMenu(themeStore.layout));
  const [activeMobileMenu, setActiveMobileMenu] = useState(false);
  const scrollableRef = createRef<HTMLDivElement>();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializeMenu = async () => {
      // await i18n.init();
      let menu: Array<any> = [];

      if (role === "Superadmin") {
        menu.push(
          {
            icon: "Home",
            title: "Dashboard",
            pathname: "/dashboard",
          },
          {
            icon: "User",
            title: "Organisations",
            pathname: "organisations",
          },
          {
            icon: "Users",
            title: t("Users"),
            pathname: "users",
          },
          {
            icon: "List",
            title: "Patient",
            pathname: "patients",
          },
          {
            icon: "BookCheck",
            title: "Parameters",
            pathname: "test-parameters",
          },
          {
            icon: "ScrollText",
            title: "Reports",
            pathname: "investigation-reports",
          },
          {
            icon: "Settings",
            title: "Settings",
            pathname: "setting",
          }
        );
      } else if (role === "Admin") {
        menu.push(
          {
            icon: "Home",
            title: "Dashboard",
            pathname: "/dashboard-admin",
          },
          {
            icon: "Users",
            title: t("Users"),
            pathname: "users",
          },
          {
            icon: "List",
            title: "Patient",
            pathname: "patients",
          },
          {
            icon: "ScrollText",
            title: "Reports",
            pathname: "investigation-reports",
          }
        );
      } else if (role === "Faculty") {
        menu.push(
          {
            icon: "Home",
            title: "Dashboard",
            pathname: "/dashboard-faculty",
          },
          {
            icon: "List",
            title: "Patient",
            pathname: "patients",
          },
          {
            icon: "FlaskConical",
            title: "Investigations",
            pathname: "/investigations",
          }
        );
      } else if (role === "Observer") {
        menu.push(
          {
            icon: "Home",
            title: "Dashboard",
            pathname: "/dashboard-observer",
          },
          {
            icon: "List",
            pathname: "/list-users",
            title: t("User_List"),
          },
          {
            icon: "Users",
            title: "Patient List",
            pathname: "/patient-list",
          }
        );
      } else if (role === "User") {
        menu.push({
          icon: "Home",
          title: "Dashboard",
          pathname: "/dashboard-user",
        });
      }

      setFormattedMenu(nestedMenu(menu, location));
    };

    initializeMenu();
  }, [i18n, location.pathname, role]);

  useEffect(() => {
    if (scrollableRef.current) {
      new SimpleBar(scrollableRef.current);
    }
  }, [formattedMenu]);

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

  return (
    <>
      <div
        className={clsx([
          "mobile-menu group top-0 inset-x-0 fixed bg-theme-1/90 z-[60] border-b border-white/[0.08] dark:bg-darkmode-800/90 md:hidden",
          "before:content-[''] before:w-full before:h-screen before:z-10 before:fixed before:inset-x-0 before:bg-black/90 before:transition-opacity before:duration-200 before:ease-in-out",
          "before:invisible before:opacity-0",
          "[&.mobile-menu--active]:before:visible [&.mobile-menu--active]:before:opacity-100",
          activeMobileMenu && "mobile-menu--active",
        ])}
      >
        <div className="h-[70px] px-3 sm:px-8 flex items-center">
          <a href="/" className="flex mr-auto">
            <img
              alt="Midone Tailwind HTML Admin Template"
              className="w-14"
              src={logoUrl || fallbackLogo}
            />
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <Lucide
              icon="BarChart2"
              className="w-8 h-8 text-white transform -rotate-90"
              onClick={() => {
                setActiveMobileMenu(!activeMobileMenu);
              }}
            />
          </a>
        </div>
        <div
          ref={scrollableRef}
          className={clsx([
            "h-screen z-20 top-0 left-0 w-[270px] -ml-[100%] bg-primary transition-all duration-300 ease-in-out dark:bg-darkmode-800",
            "[&[data-simplebar]]:fixed [&_.simplebar-scrollbar]:before:bg-black/50",
            "group-[.mobile-menu--active]:ml-0",
          ])}
        >
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className={clsx([
              "fixed top-0 right-0 mt-4 mr-4 transition-opacity duration-200 ease-in-out",
              "invisible opacity-0",
              "group-[.mobile-menu--active]:visible group-[.mobile-menu--active]:opacity-100",
            ])}
          >
            <Lucide
              icon="XCircle"
              className="w-8 h-8 text-white transform -rotate-90"
              onClick={() => {
                setActiveMobileMenu(!activeMobileMenu);
              }}
            />
          </a>
          <ul className="py-2">
            {formattedMenu.length === 0 ? (
              <div className="text-center py-4 text-slate-400">
                {t("Loadingmenu")}
              </div>
            ) : (
              formattedMenu.map((menu, menuKey) =>
                menu == "divider" ? (
                  <li className="my-6 menu__divider" key={menuKey}></li>
                ) : (
                  <li key={menuKey}>
                    <a
                      href={menu.subMenu ? "#" : menu.pathname}
                      className={clsx([
                        menu.active ? "menu menu--active" : "menu",
                      ])}
                      onClick={(event) => {
                        event.preventDefault();
                        linkTo(menu, navigate, setActiveMobileMenu);
                        setFormattedMenu([...formattedMenu]);
                      }}
                    >
                      <div className="menu__icon">
                        <Lucide icon={menu.icon} />
                      </div>
                      <div className="menu__title">
                        {menu.title}
                        {menu.subMenu && (
                          <div
                            className={clsx([
                              "menu__sub-icon",
                              menu.activeDropdown && "transform rotate-180",
                            ])}
                          >
                            <Lucide icon="ChevronDown" />
                          </div>
                        )}
                      </div>
                    </a>
                    {menu.subMenu && (
                      <Transition
                        in={menu.activeDropdown}
                        onEnter={enter}
                        onExit={leave}
                        timeout={300}
                      >
                        <ul
                          className={clsx({
                            "menu__sub-open": menu.activeDropdown,
                          })}
                        >
                          {menu.subMenu.map((subMenu, subMenuKey) => (
                            <li key={subMenuKey}>
                              <a
                                href={subMenu.subMenu ? "#" : subMenu.pathname}
                                className={clsx([
                                  subMenu.active ? "menu menu--active" : "menu",
                                ])}
                                onClick={(event) => {
                                  event.preventDefault();
                                  linkTo(
                                    subMenu,
                                    navigate,
                                    setActiveMobileMenu
                                  );
                                  setFormattedMenu([...formattedMenu]);
                                }}
                              >
                                <div className="menu__icon">
                                  <Lucide icon={subMenu.icon} />
                                </div>
                                <div className="menu__title">
                                  {subMenu.title}
                                  {subMenu.subMenu && (
                                    <div
                                      className={clsx([
                                        "menu__sub-icon",
                                        subMenu.activeDropdown &&
                                          "transform rotate-180",
                                      ])}
                                    >
                                      <Lucide icon="ChevronDown" />
                                    </div>
                                  )}
                                </div>
                              </a>
                              {subMenu.subMenu && (
                                <Transition
                                  in={subMenu.activeDropdown}
                                  onEnter={enter}
                                  onExit={leave}
                                  timeout={300}
                                >
                                  <ul
                                    className={clsx({
                                      "menu__sub-open": subMenu.activeDropdown,
                                    })}
                                  >
                                    {subMenu.subMenu.map(
                                      (lastSubMenu, lastSubMenuKey) => (
                                        <li key={lastSubMenuKey}>
                                          <a
                                            href={
                                              lastSubMenu.subMenu
                                                ? "#"
                                                : lastSubMenu.pathname
                                            }
                                            className={clsx([
                                              lastSubMenu.active
                                                ? "menu menu--active"
                                                : "menu",
                                            ])}
                                            onClick={(event) => {
                                              event.preventDefault();
                                              linkTo(
                                                lastSubMenu,
                                                navigate,
                                                setActiveMobileMenu
                                              );
                                              setFormattedMenu([
                                                ...formattedMenu,
                                              ]);
                                            }}
                                          >
                                            <div className="menu__icon">
                                              <Lucide icon={lastSubMenu.icon} />
                                            </div>
                                            <div className="menu__title">
                                              {lastSubMenu.title}
                                            </div>
                                          </a>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </Transition>
                              )}
                            </li>
                          ))}
                        </ul>
                      </Transition>
                    )}
                  </li>
                )
              )
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default MobileMenu;
