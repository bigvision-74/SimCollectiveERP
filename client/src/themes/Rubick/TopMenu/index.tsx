import "@/assets/css/themes/rubick/top-nav.css";
import { useRef, Key } from "react";
import React, { useState, useEffect, useTransition } from "react";

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import fakerData from "@/utils/faker";
import _ from "lodash";
import { FormattedMenu, linkTo, nestedMenu } from "./top-menu";
import Lucide from "@/components/Base/Lucide";
import { Menu, Popover, Dialog } from "@/components/Base/Headless";
import { getLanguageAction } from "@/actions/adminActions";

import fallbackLogo from "@/assetsA/images/simVprLogo.png";

import clsx from "clsx";
import MobileMenu from "@/components/MobileMenu";
import { useTranslation } from "react-i18next";
import {
  getAdminOrgAction,
  allNotificationAction,
  updateNotificationAction,
} from "@/actions/adminActions";
import { logoutUser } from "@/actions/authAction";
import Button from "@/components/Base/Button";
import { Menu1 } from "@/stores/menuSlice";
import DynamicBreadcrumb from "./Breadcrumb";
import Search from "@/components/Search";
import { getSettingsAction } from "@/actions/settingAction";
import NotificationList from "@/pages/Notification";
import { messaging } from "../../../../firebaseConfig";
import { onMessage } from "firebase/messaging";
import { io, Socket } from "socket.io-client";
import env from "../../../../env";
import { getUserOrgIdAction } from "@/actions/userActions";
import { useAppContext } from "@/contexts/sessionContext";
import { endSessionAction } from "@/actions/sessionAction";

interface User {
  user_thumbnail?: string;
  fname: string;
  lname: string;
  role: string;
}

type Notification = {
  [x: string]: Key | null | undefined;
  id: number;
  notify_by_name?: string;
  photo?: string;
  created_at?: string;
  message?: string;
  title?: string;
  notification_created_at?: string;
  notify_to_name?: string;
  notify_by_photo?: string;
};
interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
  status: string;
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
  const [user1, setUser] = useState<User>({
    user_thumbnail: "",
    fname: "",
    lname: "",
    role: "",
  });
  const startedBy = localStorage.getItem("startedBy");
  const { i18n, t } = useTranslation();
  const [loginId, setLoginId] = useState("");
  const username = localStorage.getItem("user");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const useremail = localStorage.getItem("user");
  const userRole = localStorage.getItem("role");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationTestName, setNotificationTestName] = useState("");
  const [notificationPatientId, setNotificationPatientId] = useState("");
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [session, setSession] = useState<string>("");
  const { socket, user, sessionInfo } = useAppContext();
  const isSessionActive = sessionInfo.isActive && sessionInfo.patientId;
  const sessionData = sessionStorage.getItem("activeSession");
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = async (data: any) => {
      console.log("Socket notification received:", data);
      const { title, body, payload } = data;

      if (!payload) {
        console.error("Invalid notification payload");
        return;
      }

      const innerPayload = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.payload)
        ? payload.payload
        : [];

      const testName = innerPayload
        .map((item: any) => item.test_name)
        .join(", ");
      const patient_id = innerPayload.map((item: any) => item.patient_id);

      setNotificationTitle(title || "Notification");
      setNotificationBody(body || "New notification");
      setNotificationTestName(testName);
      setNotificationPatientId(patient_id);

      const data1 = await getUserOrgIdAction(String(username));
      const loggedInOrgId = data1?.organisation_id;

      const faculties =
        Array.isArray(payload?.facultiesIds) && payload.facultiesIds.length > 0
          ? payload.facultiesIds
          : [];

      const organisationIdsFromPayload = innerPayload
        .map((item: any) => item.organisation_id)
        .filter(Boolean);

      // Determine org match
      const orgMatched =
        faculties.length > 0
          ? faculties.some(
              (faculty: any) =>
                String(faculty.organisation_id) === String(loggedInOrgId)
            )
          : organisationIdsFromPayload.some(
              (orgId: any) => String(orgId) === String(loggedInOrgId)
            );

      if (
        title === "New Investigation Request Recieved" &&
        userRole === "Faculty" &&
        orgMatched
      ) {
        setIsDialogOpen(true);
      } else if (
        title === "New Investigation Report Received" &&
        userRole === "Admin" &&
        orgMatched
      ) {
        setIsDialogOpen(true);
      }

      // Refresh notifications
      if (useremail) {
        fetchNotifications(useremail);
      }

      setTimeout(() => {
        setIsDialogOpen(false);
      }, 5000);
    };

    socket.on("notificationPopup", handleNotification);

    return () => {
      socket.off("notificationPopup", handleNotification);
    };
  }, [socket, user]);

  const handleRedirect = () => {
    const role = localStorage.getItem("role");
    const id = Array.isArray(notificationPatientId)
      ? notificationPatientId[0]
      : notificationPatientId;

    if (notificationTitle == "New Investigation Report Received") {
      navigate(`/patients-view/${id}`);
    } else {
      navigate(`/investigations-requests/${id}`);
    }
  };

  socket?.on("notificationPopup", (data) => {
    console.log("Received notification:", data);
    // Handle the notification (show popup, etc.)
  });

  // get log icon
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

  useEffect(() => {
    let menu: Array<Menu1 | "divider"> = [];

    if (role === "Superadmin") {
      menu.push(
        {
          icon: "Home",
          title: t("dashboard"),
          pathname: "/dashboard",
        },
        {
          icon: "User",
          title: t("organisations"),
          pathname: "organisations",
        },

        {
          icon: "Users",
          title: t("Users"),
          pathname: "users",
        },
        {
          icon: "List",
          title: t("Patient"),
          pathname: "patients",
        },
        {
          icon: "BookCheck",
          title: t("Parameters"),
          pathname: "test-parameters",
        },
        {
          icon: "ScrollText",
          title: t("report"),
          pathname: "investigation-reports",
        },
        {
          icon: "Settings",
          title: t("Settings"),
          pathname: "setting",
        }
      );
    } else if (role === "Admin") {
      menu.push(
        {
          icon: "Home",
          title: t("dashboard"),
          pathname: "/dashboard-admin",
        },
        {
          icon: "Users",
          title: t("Users"),
          pathname: "users",
        },
        {
          icon: "List",
          title: t("Patient"),
          pathname: "patients",
        },
        {
          icon: "BookCheck",
          title: t("Parameters"),
          pathname: "test-parameters",
        },
        {
          icon: "ScrollText",
          title: t("reports"),
          pathname: "investigation-reports",
        }
      );
    } else if (role === "Faculty") {
      menu.push(
        {
          icon: "Home",
          title: t("dashboard"),
          pathname: "/dashboard-faculty",
        },
        {
          icon: "List",
          title: t("Patient"),
          pathname: "patients",
        },
        {
          icon: "FlaskConical",
          title: t("Investigations"),
          pathname: "/investigations",
        }
      );
    } else if (role === "Observer") {
      menu.push(
        {
          icon: "Home",
          title: t("dashboard"),
          pathname: "/dashboard-observer",
        },
        {
          icon: "List",
          title: t("User_List"),
          pathname: "/list-users",
        },
        {
          icon: "Users",
          title: t("PatientList"),
          pathname: "/patient-list",
        }
      );
    } else if (role === "User") {
      menu.push({
        icon: "Home",
        title: t("dashboard"),
        pathname: "/dashboard-user",
      });
    }
    setFormattedMenu(nestedMenu(menu, location));
  }, [t, location.pathname, role]);

  const fetchNotifications = async (useremail: string) => {
    try {
      if (useremail) {
        const data = await allNotificationAction(useremail);
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (!useremail) return;
    fetchNotifications(useremail);
  }, [useremail]);

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
    navigate("/login");
  };

  const handleLogoutClick = () => {
    setDeleteConfirmationModal(true);
  };

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

  const fetchPatient = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const org = await getAdminOrgAction(String(useremail));
      // setUserRole(org.role);
      // setPatientData(response.data);
      setLoginId(org.uid);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, []);

  const handleEndSession = async () => {
    if (!sessionInfo.sessionId) return;
    try {
      setTimer(0);
      sessionStorage.removeItem("activeSession");
      await endSessionAction(sessionInfo.sessionId);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isSessionActive) {
      if (sessionData) {
        try {
          const { startTime, duration, sessionName } = JSON.parse(sessionData);
          setSession(sessionName);
          const startTimeDate = new Date(startTime);
          const now = new Date();

          const isUnlimited =
            duration === null || duration === -1 || duration === "unlimited";

          if (isUnlimited) {
            const elapsedTime = Math.floor(
              (now.getTime() - startTimeDate.getTime()) / 1000
            );
            setTimer(elapsedTime);

            interval = setInterval(() => {
              setTimer((prev) => (prev !== null ? prev + 1 : 0));
            }, 1000);
          } else {
            const endTimeDate = new Date(
              startTimeDate.getTime() + duration * 60000
            );
            const remainingTime = Math.max(
              0,
              Math.floor((endTimeDate.getTime() - now.getTime()) / 1000)
            );

            if (remainingTime > 0) {
              setTimer(remainingTime);

              interval = setInterval(() => {
                setTimer((prev) => {
                  if (prev === null || prev <= 0) {
                    clearInterval(interval!);
                    handleEndSession();
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            } else {
              handleEndSession();
            }
          }
        } catch (error) {
          console.error("Failed to parse session data:", error);
          handleEndSession();
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, handleEndSession]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
              // src={simvpr}
              src={logoUrl || fallbackLogo}
            />
          </Link>

          <DynamicBreadcrumb />

          <div className="flex items-center mt-4 lg:mt-0 signInDashboard">
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
                  bold
                />
              </Menu.Button>
              <Menu.Items className="w-[11rem] mt-2 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
                {languages
                  .filter((lang) => lang.status == "active")
                  .map((lang, key) => (
                    <Menu.Item key={key}>
                      <button
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                        }}
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

          <Search />

          <Popover className="mr-4 intro-x sm:mr-6">
            <Popover.Button className="relative text-white/70 outline-none block">
              <Lucide icon="Bell" className="w-5 h-5 dark:text-slate-500" />

              {notifications.some((n) => n.status === "unseen") && (
                <div className="absolute top-[-2px] right-0 w-[8px] h-[8px] rounded-full bg-danger" />
              )}
            </Popover.Button>

            <Popover.Panel className="w-[280px] sm:w-[350px] p-5 mt-2">
              {({ close }) => (
                <>
                  <div className="mb-5 flex justify-between items-center">
                    <div className="font-medium">{t("notifications")}</div>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={async () => {
                        close();

                        const unseenIds = notifications
                          .filter(
                            (n) =>
                              n.status === "unseen" &&
                              typeof n.notification_id === "number"
                          )
                          .map((n) => n.notification_id as number);

                        if (unseenIds.length > 0) {
                          await updateNotificationAction(unseenIds);

                          setNotifications((prev) =>
                            prev.map((n) =>
                              typeof n.notification_id === "number" &&
                              unseenIds.includes(n.notification_id)
                                ? { ...n, status: "seen" }
                                : n
                            )
                          );
                        }

                        navigate("/allNotifications");
                      }}
                    >
                      {t("ViewAll")}
                    </button>
                  </div>

                  {notifications.filter((n) => n.status === "unseen").length ===
                  0 ? (
                    <div className="text-slate-500 text-sm text-center">
                      {t("no_new_notifications")}
                    </div>
                  ) : (
                    notifications
                      .filter((n) => n.status === "unseen")
                      .slice(0, 5)
                      .map((notification, index) => (
                        <div
                          key={notification.notification_id}
                          className={clsx([
                            "cursor-pointer relative flex items-center",
                            { "mt-5": index !== 0 },
                          ])}
                        >
                          <div className="relative flex-none w-12 h-12 mr-1 image-fit">
                            <img
                              alt="User"
                              className="rounded-full object-cover w-full h-full"
                              src={
                                notification.notify_by_photo ||
                                "/images/default-avatar.png"
                              }
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full bg-success dark:border-darkmode-600"></div>
                          </div>
                          <div className="ml-2 overflow-hidden">
                            <div className="flex items-center">
                              <span className="mr-5 font-medium truncate">
                                {notification.notify_by_name || "Unknown User"}
                              </span>
                              <div className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                                {notification.notification_created_at
                                  ? new Date(
                                      notification.notification_created_at
                                    ).toLocaleString()
                                  : "N/A"}
                              </div>
                            </div>
                            <div className="w-full truncate text-slate-500 mt-0.5">
                              {notification.message}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </>
              )}
            </Popover.Panel>
          </Popover>

          <Menu>
            <Menu.Button className="block w-8 h-8 overflow-hidden rounded-full shadow-lg image-fit zoom-in intro-x">
              <img
                alt="Midone Tailwind HTML Admin Template"
                src={
                  user1.user_thumbnail?.startsWith("http")
                    ? user1.user_thumbnail
                    : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${user1.user_thumbnail}`
                }
              />
            </Menu.Button>
            <Menu.Items className="w-56 mt-px relative bg-primary/80 before:block before:absolute before:bg-black before:inset-0 before:rounded-md before:z-[-1] text-white">
              <Menu.Header className="font-normal">
                <div className="font-medium">
                  {user1.fname + " " + user1.lname}
                </div>
                <div className="text-xs text-white/70 mt-0.5 dark:text-slate-500">
                  {user1.role ? user1.role : "Unknown Role"}
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
        {sessionInfo.isActive && sessionInfo.patientId && user && (
          <div
            onClick={() => {
              navigate(`/patients-view/${sessionInfo.patientId}`);
            }}
            className="flex items-center p-3 my-4 text-white rounded-md intro-y bg-[#115ea4]"
          >
            <Lucide icon="Clock" className="w-6 h-6 mr-3" />
            <div className="flex-grow font-medium">
              {t("session_in_progress")}
            </div>
            <div className="px-3 py-1 mr-4 text-lg bg-white rounded-md text-primary">
              {timer !== null ? formatTime(timer) : "00:00"}
            </div>
            {(userRole === "Admin" ||
              (userRole === "Faculty" && loginId == startedBy)) && (
              <Button variant="danger" onClick={handleEndSession}>
                {t("end_session")}
              </Button>
            )}
          </div>
        )}
        <Outlet />
      </div>
      {/* END: Content */}

      <Dialog
        open={isDialogOpen}
        onClose={setIsDialogOpen}
        className="z-[9999]"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            onClick={handleRedirect}
            className="w-full max-w-sm bg-white dark:bg-darkmode-600 p-6 rounded shadow-lg"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(false);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg"
              aria-label="Close"
            >
              &times;
            </button>
            <Dialog.Title className="block w-full text-lg font-semibold mb-2 text-center">
              {notificationTitle}
            </Dialog.Title>
            <p className="text-sm text-center text-gray-700 dark:text-gray-300">
              <span className="block font-medium text-primary dark:text-white">
                {notificationTestName}
              </span>
              <span className="block">{notificationBody}</span>
            </p>
          </Dialog.Panel>
        </div>
      </Dialog>

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
