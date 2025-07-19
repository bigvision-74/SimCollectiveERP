import "@/assets/css/themes/rubick/top-nav.css";
import { useState, useEffect, Fragment, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import fakerData from "@/utils/faker";
import _ from "lodash";
import { FormattedMenu, linkTo, nestedMenu } from "./top-menu";
import Lucide from "@/components/Base/Lucide";
import Breadcrumb from "@/components/Base/Breadcrumb";
import { FormInput } from "@/components/Base/Form";
import { Menu, Popover, Dialog } from "@/components/Base/Headless";
import { Transition } from "@headlessui/react";
import logoUrl from "@/assets/images/logo.svg";
import clsx from "clsx";
import MobileMenu from "@/components/MobileMenu";
import { useTranslation } from "react-i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import { logoutUser } from "@/actions/authAction";
import Button from "@/components/Base/Button";
import { onMessage } from "firebase/messaging";
import { messaging } from "../../../../firebaseConfig";

interface User {
  user_thumbnail?: string;
  fname: string;
  lname: string;
  role: string;
}

function Main() {
  const navigate = useNavigate();
  const [searchDropdown, setSearchDropdown] = useState(false);
  const showSearchDropdown = () => {
    setSearchDropdown(true);
  };
  const hideSearchDropdown = () => {
    setSearchDropdown(false);
  };
  const location = useLocation();
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const deleteButtonRef = useRef(null);
  const [user, setUser] = useState<User>({
    user_thumbnail: "",
    fname: "",
    lname: "",
    role: "",
  });
  const { i18n, t } = useTranslation();
  const username = localStorage.getItem("user");
  const popoverButtonRef = useRef<HTMLElement | null>(null);
  const setPopoverButtonRef = (el: HTMLElement | null) => {
    popoverButtonRef.current = el;
  };
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const togglePopover = () => {
    setIsPopoverOpen((prev) => !prev);
  };

  // console.log(username, "usernameusername");
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

  const menuStore = useAppSelector(selectMenu("top-menu"));
  const topMenu = () => nestedMenu(menuStore, location);

  useEffect(() => {
    setFormattedMenu(topMenu());
  }, [menuStore, location.pathname]);

  const isActive = (menu: any): boolean => {
    const currentPath = window.location.pathname;

    // Check if the current path matches the menu's path directly
    if (menu.pathname && currentPath === menu.pathname) {
      return true;
    }
    if (menu.pathname === "/" && currentPath === "/dashboard") {
      return true;
    }
    // Check if any submenu is active
    if (menu.subMenu && Array.isArray(menu.subMenu)) {
      return menu.subMenu.some((sub: { pathname?: string }) => {
        const subPathname = sub.pathname ?? "";
        return (
          currentPath === subPathname ||
          (subPathname && currentPath.startsWith(subPathname))
        );
      });
    }

    // Fallback to segment matching if no direct match found
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

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔔 New notification received:", payload);

      const newNotification = {
        id: Date.now(),
        title: payload.notification?.title,
        body: payload.notification?.body,
        timestamp: new Date().toLocaleTimeString(),
        image: "/images/profile-default.jpg",
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 5));

      // Show desktop notification
      if (Notification.permission === "granted") {
        new Notification(newNotification.title || "Notification", {
          body: newNotification.body,
          icon: newNotification.image,
        });
      }

      // Open popover if closed
      if (!isPopoverOpen) {
        setTimeout(() => {
          popoverButtonRef.current?.click();
        }, 150);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteCancel = () => {
    setDeleteConfirmationModal(false);
  };

  const handleDeleteConfirm = async () => {
    const username = localStorage.getItem("user");
    if (username) {
      try {
        await logoutUser();
        // await upddateOnlineUseridDelete(username);
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
      {/* BEGIN: Top Bar */}
      <div className="border-b border-white/[0.08] mt-[2.2rem] md:-mt-5 -mx-3 sm:-mx-8 px-3 sm:px-8 pt-3 md:pt-0 mb-10">
        <div className="flex items-center h-[70px] z-[51] relative">
          {/* BEGIN: Logo */}
          <Link to="/" className="hidden -intro-x md:flex">
            <img
              alt="Midone Tailwind HTML Admin Template"
              className="w-6"
              src={logoUrl}
            />
            <span className="ml-3 text-lg text-white"> Rubick </span>
          </Link>
          {/* END: Logo */}
          {/* BEGIN: Breadcrumb */}
          <Breadcrumb
            light
            className="h-full md:ml-10 md:pl-10 md:border-l border-white/[0.08] mr-auto -intro-x"
          >
            <Breadcrumb.Link to="/">Application</Breadcrumb.Link>
            <Breadcrumb.Link to="/" active={true}>
              Dashboard
            </Breadcrumb.Link>
          </Breadcrumb>
          {/* END: Breadcrumb */}
          {/* BEGIN: Search */}
          <div className="relative mr-3 intro-x sm:mr-6">
            <div className="hidden sm:block">
              <FormInput
                type="text"
                className="border-transparent w-56 shadow-none rounded-full bg-slate-200 pr-8 transition-[width] duration-300 ease-in-out focus:border-transparent focus:w-72 dark:bg-darkmode-400/70"
                placeholder="Search..."
                onFocus={showSearchDropdown}
                onBlur={hideSearchDropdown}
              />
              <Lucide
                icon="Search"
                className="absolute inset-y-0 right-0 w-5 h-5 my-auto mr-3 text-slate-600 dark:text-slate-500"
              />
            </div>
            <a className="relative text-white/70 sm:hidden" href="">
              <Lucide icon="Search" className="w-5 h-5 dark:text-slate-500" />
            </a>
            <Transition
              as={Fragment}
              show={searchDropdown}
              enter="transition-all ease-linear duration-150"
              enterFrom="mt-5 invisible opacity-0 translate-y-1"
              enterTo="mt-[3px] visible opacity-100 translate-y-0"
              leave="transition-all ease-linear duration-150"
              leaveFrom="mt-[3px] visible opacity-100 translate-y-0"
              leaveTo="mt-5 invisible opacity-0 translate-y-1"
            >
              <div className="absolute right-0 z-10 mt-[3px]">
                <div className="w-[450px] p-5 box">
                  <div className="mb-2 font-medium">Pages</div>
                  <div className="mb-5">
                    <a href="" className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/20 dark:bg-success/10 text-success">
                        <Lucide icon="Inbox" className="w-4 h-4" />
                      </div>
                      <div className="ml-3">Mail Settings</div>
                    </a>
                    <a href="" className="flex items-center mt-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pending/10 text-pending">
                        <Lucide icon="Users" className="w-4 h-4" />
                      </div>
                      <div className="ml-3">Users & Permissions</div>
                    </a>
                    <a href="" className="flex items-center mt-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80">
                        <Lucide icon="CreditCard" className="w-4 h-4" />
                      </div>
                      <div className="ml-3">Transactions Report</div>
                    </a>
                  </div>
                  <div className="mb-2 font-medium">Users</div>
                  <div className="mb-5">
                    {_.take(fakerData, 4).map((faker, fakerKey) => (
                      <a
                        key={fakerKey}
                        href=""
                        className="flex items-center mt-2"
                      >
                        <div className="w-8 h-8 image-fit">
                          <img
                            alt="Midone Tailwind HTML Admin Template"
                            className="rounded-full"
                            src={faker.photos[0]}
                          />
                        </div>
                        <div className="ml-3">{faker.users[0].name}</div>
                        <div className="w-48 ml-auto text-xs text-right truncate text-slate-500">
                          {faker.users[0].email}
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="mb-2 font-medium">Products</div>
                  {_.take(fakerData, 4).map((faker, fakerKey) => (
                    <a
                      key={fakerKey}
                      href=""
                      className="flex items-center mt-2"
                    >
                      <div className="w-8 h-8 image-fit">
                        <img
                          alt="Midone Tailwind HTML Admin Template"
                          className="rounded-full"
                          src={faker.images[0]}
                        />
                      </div>
                      <div className="ml-3">{faker.products[0].name}</div>
                      <div className="w-48 ml-auto text-xs text-right truncate text-slate-500">
                        {faker.products[0].category}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </Transition>
          </div>
          {/* END: Search */}
          {/* BEGIN: Notifications */}
          <Popover className="mr-4 intro-x sm:mr-6">
            <Popover.Button
              ref={setPopoverButtonRef}
              onClick={togglePopover}
              className="relative text-white/70 outline-none block
      before:content-[''] before:w-[8px] before:h-[8px] 
      before:rounded-full before:absolute before:top-[-2px] 
      before:right-0 before:bg-danger"
            >
              <Lucide icon="Bell" className="w-5 h-5 dark:text-slate-500" />
            </Popover.Button>
            <Popover.Panel className="w-[280px] sm:w-[350px] p-5 mt-2">
              <div className="mb-5 font-medium">Notifications</div>
              {notifications.map((notif, notifKey) => (
                <div
                  key={notifKey}
                  className={clsx([
                    "cursor-pointer relative flex items-center",
                    { "mt-5": notifKey },
                  ])}
                >
                  <div className="relative flex-none w-12 h-12 mr-1 image-fit">
                    <img
                      alt="Profile"
                      className="rounded-full"
                      src={notif.image}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full bg-success dark:border-darkmode-600"></div>
                  </div>
                  <div className="ml-2 overflow-hidden">
                    <div className="flex items-center">
                      <div className="mr-5 font-medium truncate">
                        {notif.title || "Notification"}
                      </div>
                      <div className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                        {notif.timestamp}
                      </div>
                    </div>
                    <div className="w-full truncate text-slate-500 mt-0.5">
                      {notif.body}
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
              {/* <Menu.Item className="hover:bg-white/5">
                <Lucide icon="FilePenLine" className="w-4 h-4 mr-2" />{" "}
                {t("Add Account")}
              </Menu.Item>
              <Menu.Item className="hover:bg-white/5">
                <Lucide icon="Lock" className="w-4 h-4 mr-2" />{" "}
                {t("Reset Password")}
              </Menu.Item>
              <Menu.Item className="hover:bg-white/5">
                <Lucide icon="HelpCircle" className="w-4 h-4 mr-2" />{" "}
                {t("Help")}
              </Menu.Item> */}
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
          {/* END: Account Menu */}
        </div>
      </div>
      {/* END: Top Bar */}
      {/* BEGIN: Top Menu */}
      <nav className="relative z-50 hidden top-nav md:block">
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
