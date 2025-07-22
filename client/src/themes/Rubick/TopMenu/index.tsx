import "@/assets/css/themes/rubick/top-nav.css";
import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import fakerData from "@/utils/faker";
import _ from "lodash";
import { FormattedMenu, linkTo, nestedMenu } from "./top-menu";
import Lucide from "@/components/Base/Lucide";
import { Menu, Popover, Dialog } from "@/components/Base/Headless";

import simvpr from "@/assetsA/images/simVprLogo.png";
import clsx from "clsx";
import MobileMenu from "@/components/MobileMenu";
import { useTranslation } from "react-i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import { logoutUser } from "@/actions/authAction";
import Button from "@/components/Base/Button";
import { Menu1 } from "@/stores/menuSlice";
import DynamicBreadcrumb from "./Breadcrumb";
import Search from "@/components/Search";

interface User {
  user_thumbnail?: string;
  fname: string;
  lname: string;
  role: string;
}

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const deleteButtonRef = useRef(null);
  const [user, setUser] = useState<User>({
    user_thumbnail: "",
    fname: "",
    lname: "",
    role: "",
  });
  const { i18n, t } = useTranslation();
  const username = localStorage.getItem("user");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const initializeMenu = async () => {
      await i18n.init(); // Wait for i18n to be ready
      // Now set the menu based on role
      let menu: Array<Menu1 | "divider"> = [];

      if (role === "Superadmin") {
        menu.push(
          {
            icon: "Home",
            title: "Dashboard",
            pathname: "/dashboard",
          },
          {
            icon: "User",
            title: "Add Organisations",
            pathname: "organisations",
          },

          {
            icon: "Users",
            title: t("Users"),
            subMenu: [
              {
                icon: "List",
                pathname: "/list-users",
                title: t("User_List"),
              },
              {
                icon: "Plus",
                pathname: "/add-user",
                title: t("Add_User"),
              },
            ],
          },
          {
            icon: "List",
            title: "Patient",
            subMenu: [
              {
                icon: "Users",
                title: "Patient List",
                pathname: "/patient-list",
              },
              {
                icon: "Users",
                title: "Add Patient",
                pathname: "/add-patient",
              },
            ],
          },
          {
            icon: "List",
            title: "Archive",
            pathname: "archive",
          },
          {
            icon: "Activity",
            title: "Apps",
            subMenu: [
              {
                icon: "Users",
                title: "Users",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/users-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/users-layout-2",
                    title: "Layout 2",
                  },
                  {
                    icon: "Zap",
                    pathname: "/users-layout-3",
                    title: "Layout 3",
                  },
                ],
              },
            ],
          },
          {
            icon: "PanelsTopLeft",
            title: "Pages",
            subMenu: [
              {
                icon: "Activity",
                title: "Wizards",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/wizard-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/wizard-layout-2",
                    title: "Layout 2",
                  },
                  {
                    icon: "Zap",
                    pathname: "/wizard-layout-3",
                    title: "Layout 3",
                  },
                ],
              },
              {
                icon: "Activity",
                title: "Blog",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/blog-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/blog-layout-2",
                    title: "Layout 2",
                  },
                  {
                    icon: "Zap",
                    pathname: "/blog-layout-3",
                    title: "Layout 3",
                  },
                ],
              },
              {
                icon: "Activity",
                title: "Pricing",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/pricing-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/pricing-layout-2",
                    title: "Layout 2",
                  },
                ],
              },
              {
                icon: "Activity",
                title: "Invoice",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/invoice-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/invoice-layout-2",
                    title: "Layout 2",
                  },
                ],
              },
              {
                icon: "Activity",
                title: "FAQ",
                subMenu: [
                  {
                    icon: "Zap",
                    pathname: "/faq-layout-1",
                    title: "Layout 1",
                  },
                  {
                    icon: "Zap",
                    pathname: "/faq-layout-2",
                    title: "Layout 2",
                  },
                  {
                    icon: "Zap",
                    pathname: "/faq-layout-3",
                    title: "Layout 3",
                  },
                ],
              },
              {
                icon: "Activity",
                pathname: "login",
                title: "Login",
              },
              {
                icon: "Activity",
                pathname: "register",
                title: "Register",
              },
              {
                icon: "Activity",
                pathname: "error-page",
                title: "Error Page",
              },
              {
                icon: "Activity",
                pathname: "/update-profile",
                title: "Update profile",
              },
              {
                icon: "Activity",
                pathname: "/change-password",
                title: "Change Password",
              },
            ],
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
            subMenu: [
              {
                icon: "List",
                pathname: "admin-user",
                title: t("User_List"),
              },
              {
                icon: "Plus",
                pathname: "/add-user",
                title: t("Add_User"),
              },
            ],
          },
          {
            icon: "List",
            title: "Patient",
            subMenu: [
              {
                icon: "Users",
                title: "Patient List",
                pathname: "/patient-list",
              },
              {
                icon: "Users",
                title: "Add Patient",
                pathname: "/add-patient",
              },
            ],
          },
          {
            icon: "List",
            title: "Archive",
            pathname: "archive",
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
            icon: "UserPlus",
            title: "Add Patient",
            pathname: "/add-patient",
          },
          {
            icon: "Users",
            title: "Patient List",
            pathname: "/patient-list",
          },
          {
            icon: "Archive",
            title: "Archive",
            pathname: "/archive",
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

  const fetchUsers = async () => {
    try {
      if (username) {
        const org = await getAdminOrgAction(username);
        setUser(org);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // const menuStore = useAppSelector(selectMenu("top-menu"));
  // const topMenu = () => nestedMenu(menuStore, location);

  // useEffect(() => {
  //   setFormattedMenu(topMenu());
  // }, [menuStore, location.pathname]);

  const isActive = (menu: any): boolean => {
    const currentPath = window.location.pathname;

    if (menu.pathname && currentPath === menu.pathname) {
      return true;
    }
    if (menu.pathname === "/" && currentPath === "/dashboard") {
      return true;
    }
    if (menu.subMenu && Array.isArray(menu.subMenu)) {
      return menu.subMenu.some((sub: { pathname?: string }) => {
        const subPathname = sub.pathname ?? "";
        return (
          currentPath === subPathname ||
          (subPathname && currentPath.startsWith(subPathname))
        );
      });
    }

    const segments = currentPath.split("/").filter(Boolean);
    if (segments.length === 0) return false;

    const firstSegment = segments[0].split("-")[0];
    if (!firstSegment) return false;
    if (menu.pathname) {
      const menuFirstSegment = menu.pathname
        .split("/")
        .filter(Boolean)[0]
        ?.split("-")[0];
      return menuFirstSegment && menuFirstSegment.includes(firstSegment);
    }

    return false;
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmationModal(false);
  };

  const handleDeleteConfirm = async () => {
    const username = localStorage.getItem("user");
    if (username) {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Failed to update user ID:", error);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("i18nextLng");
    navigate("/login");
  };

  const handleLogoutClick = () => {
    setDeleteConfirmationModal(true);
  };

  return (
    <div
      className={clsx([
        "rubick px-5 sm:px-8 py-5",
        "before:content-[''] before:bg-gradient-to-b before:from-theme-1 before:to-theme-2 dark:before:from-darkmode-800 dark:before:to-darkmode-800 before:fixed before:inset-0 before:z-[-1]",
      ])}
    >
      <MobileMenu />
      <div className="border-b border-white/[0.08] mt-[2.2rem] md:-mt-5 -mx-3 sm:-mx-8 px-3 sm:px-8 pt-3 md:pt-0 mb-10">
        <div className="flex items-center h-[70px] z-[51] relative">
          <Link to="/" className="hidden -intro-x md:flex">
            <img
              alt="Midone Tailwind HTML Admin Template"
              className="w-16 ml-8"
              src={simvpr}
            />
          </Link>
          <DynamicBreadcrumb />
          <Search />

          {/* END: Search */}
          {/* BEGIN: Notifications */}
          <Popover className="mr-4 intro-x sm:mr-6">
            <Popover.Button
              className="
              relative text-white/70 outline-none block
              before:content-[''] before:w-[8px] before:h-[8px] before:rounded-full before:absolute before:top-[-2px] before:right-0 before:bg-danger
            "
            >
              <Lucide icon="Bell" className="w-5 h-5 dark:text-slate-500" />
            </Popover.Button>
            <Popover.Panel className="w-[280px] sm:w-[350px] p-5 mt-2">
              <div className="mb-5 font-medium">Notifications</div>
              {_.take(fakerData, 5).map((faker, fakerKey) => (
                <div
                  key={fakerKey}
                  className={clsx([
                    "cursor-pointer relative flex items-center",
                    { "mt-5": fakerKey },
                  ])}
                >
                  <div className="relative flex-none w-12 h-12 mr-1 image-fit">
                    <img
                      alt="Midone Tailwind HTML Admin Template"
                      className="rounded-full"
                      src={faker.photos[0]}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full bg-success dark:border-darkmode-600"></div>
                  </div>
                  <div className="ml-2 overflow-hidden">
                    <div className="flex items-center">
                      <a href="" className="mr-5 font-medium truncate">
                        {faker.users[0].name}
                      </a>
                      <div className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                        {faker.times[0]}
                      </div>
                    </div>
                    <div className="w-full truncate text-slate-500 mt-0.5">
                      {faker.news[0].shortContent}
                    </div>
                  </div>
                </div>
              ))}
            </Popover.Panel>
          </Popover>
          {/* END: Notifications */}
          {/* BEGIN: Account Menu */}
          <Menu>
            <Menu.Button className="block w-8 h-8 overflow-hidden rounded-full shadow-lg image-fit zoom-in intro-x">
              <img
                alt="Midone Tailwind HTML Admin Template"
                src={
                  user.user_thumbnail?.startsWith("http")
                    ? user.user_thumbnail
                    : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${user.user_thumbnail}`
                }
              />
            </Menu.Button>
            <Menu.Items className="w-56 mt-px relative bg-primary/80 before:block before:absolute before:bg-black before:inset-0 before:rounded-md before:z-[-1] text-white">
              <Menu.Header className="font-normal">
                <div className="font-medium">
                  {user.fname + " " + user.lname}
                </div>
                <div className="text-xs text-white/70 mt-0.5 dark:text-slate-500">
                  {user.role ? user.role : "Unknown Role"}
                </div>
              </Menu.Header>
              <Menu.Divider className="bg-white/[0.08]" />
              <Menu.Item
                className="hover:bg-white/5"
                onClick={() => {
                  navigate("/dashboard-profile");
                }}
              >
                <Lucide icon="User" className="w-4 h-4 mr-2" /> {t("Profile")}
              </Menu.Item>
              <Menu.Divider className="bg-white/[0.08]" />
              <Menu.Item
                className="hover:bg-white/5"
                onClick={handleLogoutClick}
              >
                <Lucide icon="ToggleRight" className="w-4 h-4 mr-2" />{" "}
                {t("logout")}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      <nav className="relative z-50 hidden top-nav md:block">
        {formattedMenu.length === 0 ? (
          <div className="text-center py-4 text-slate-400">Loading menu...</div>
        ) : (
          <ul className="pb-3 xl:pb-0 xl:px-[50px] flex flex-wrap">
            {formattedMenu.map(
              (menu, menuKey) =>
                menu != "divider" && (
                  <li key={menuKey}>
                    <a
                      href={menu.subMenu ? "#" : menu.pathname}
                      className={clsx([
                        "top-menu",
                        isActive(menu) ? "top-menu--active" : "",
                      ])}
                      onClick={(event) => {
                        event.preventDefault();
                        linkTo(menu, navigate);
                      }}
                    >
                      <div className="top-menu__icon">
                        <Lucide icon={menu.icon} />
                      </div>
                      <div className="top-menu__title">
                        {menu.title}
                        {menu.subMenu && (
                          <Lucide
                            className="top-menu__sub-icon"
                            icon="ChevronRight"
                          />
                        )}
                      </div>
                    </a>
                    {menu.subMenu && (
                      <ul>
                        {menu.subMenu.map((subMenu, subMenuKey) => (
                          <li key={subMenuKey}>
                            <a
                              href={subMenu.subMenu ? "#" : subMenu.pathname}
                              className="top-menu"
                              onClick={(event) => {
                                event.preventDefault();
                                linkTo(subMenu, navigate);
                              }}
                            >
                              <div className="top-menu__icon">
                                <Lucide icon={subMenu.icon} />
                              </div>
                              <div className="top-menu__title">
                                {subMenu.title}
                                {subMenu.subMenu && (
                                  <Lucide
                                    v-if="subMenu.subMenu"
                                    className="top-menu__sub-icon"
                                    icon="ChevronDown"
                                  />
                                )}
                              </div>
                            </a>
                            {subMenu.subMenu && (
                              <ul
                                v-if="subMenu.subMenu"
                                className={clsx({
                                  "side-menu__sub-open": subMenu.activeDropdown,
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
                                        className="top-menu"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          linkTo(lastSubMenu, navigate);
                                        }}
                                      >
                                        <div className="top-menu__icon">
                                          <Lucide icon={lastSubMenu.icon} />
                                        </div>
                                        <div className="top-menu__title">
                                          {lastSubMenu.title}
                                        </div>
                                      </a>
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
            )}
          </ul>
        )}
      </nav>
      {/* END: Top Menu */}
      {/* BEGIN: Content */}
      <div className="rounded-[30px] min-w-0 min-h-screen flex-1 pb-10 bg-slate-100 dark:bg-darkmode-700 px-4 md:px-[22px] max-w-full md:max-w-auto before:content-[''] before:w-full before:h-px before:block">
        <Outlet />
      </div>
      {/* END: Content */}

      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-xl"> {t("logoutSure")} </div>
          </div>
          <div className="px-5 pb-8  text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={handleDeleteCancel}
              className="w-24 mr-4"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              ref={deleteButtonRef}
              onClick={handleDeleteConfirm}
            >
              {t("logout")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}

export default Main;
