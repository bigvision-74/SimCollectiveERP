import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { t } from "i18next";
import clsx from "clsx";
import breadcrumbiconn from "@/assetsA/images/icons/breadcrumb.png";
import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";
import Lucide from "@/components/Base/Lucide";

interface RouteConfig {
  path: string;
  label: string;
  from?: string;
  children?: RouteConfig[];
}

const DynamicBreadcrumb: React.FC = () => {
  const location = useLocation();
  const { state } = location;
  const params = useParams();
  const userRole = localStorage.getItem("role") || "Superadmin";
  const { t } = useTranslation();

  const [ids, setIds] = useState({
    orgId: localStorage.getItem("CrumbsOrg"),
    patientId: localStorage.getItem("patientId"),
    userId: localStorage.getItem("userId"),
  });

  const { orgId } = ids;

  useEffect(() => {
    const updateIds = () => {
      setIds({
        orgId: localStorage.getItem("CrumbsOrg"),
        patientId: localStorage.getItem("patientId"),
        userId: localStorage.getItem("userId"),
      });
    };

    updateIds();
    const timeoutId = setTimeout(updateIds, 500);

    const handleStorageChange = () => updateIds();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [location.pathname]);

  const normalizePath = (path: string) => {
    let normalized = path;
    Object.entries(params).forEach(([key, value]) => {
      if (value) normalized = normalized.replace(`:${key}`, value);
    });
    if (ids.orgId) normalized = normalized.replace(":orgId", ids.orgId);
    return normalized;
  };

  const superadminRoutes: RouteConfig[] = [
    {
      path: "/dashboard",
      label: t("DashboardBread"),
      children: [
        {
          path: "/dashboard-profile",
          label: t("profile"),
        },
        {
          path: "/organisations",
          label: t("OrganisationsBread"),
          children: [
            {
              path: `/organisations-settings/${orgId}`,
              label: t("OrganisationsSettings"),
              children: [
                {
                  path: "/patients-view/:id",
                  label: t("PatientDetails"),
                  from: "org",
                },
                {
                  path: "/patient-edit/:id",
                  label: t("EditPatient"),
                  from: "org",
                },
              ],
            },
          ],
        },
        {
          path: "/users",
          label: t("Users"),
          children: [
            {
              path: "/user-edit/:id",
              label: t("Edituser"),
            },
            {
              path: "/user-assign-patient/:id",
              label: t("AssignPatient"),
            },
          ],
        },
        {
          path: "/list-users",
          label: t("UserList"),
        },
        {
          path: "/test-parameters",
          label: t("Parameters"),
        },
        {
          path: "/wards",
          label: t("wards"),
        },
        {
          path: "/add-user",
          label: t("AddUser"),
        },
        {
          path: "/patients",
          label: t("patients"),
          children: [
            {
              path: "/patients-view/:id",
              label: t("PatientDetails"),
              from: "patients",
            },
            {
              path: "/patient-list",
              label: t("patientList"),
              from: "patients",
            },
            {
              path: "/patient-edit/:id",
              label: t("EditPatient"),
              from: "patients",
            },
          ],
        },
        {
          path: "/investigation-reports",
          label: t("reports"),
        },
        {
          path: "/add-patient",
          label: t("AddPatient"),
        },
        {
          path: "/archive",
          label: t("Archive"),
        },
        {
          path: "/setting",
          label: t("Settings"),
        },
        {
          path: "/new-investigations",
          label: t("parameters"),
        },
        {
          path: "/language-update",
          label: t("language"),
        },
        {
          path: "/requests",
          label: t("requests"),
        },
        {
          path: "/categories",
          label: t("Categories"),
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
        },
        {
          path: "/view-feedback",
          label: t("view_feedback"),
        },
        {
          path: "/requests",
          label: t("requests"),
        },
        {
          path: "/new-investigations",
          label: t("parameters"),
        },
        {
          path: "/language-update",
          label: t("language"),
        },
        {
          path: "/contacts-request",
          label: t("Contacts"),
        },
        {
          path: "/virtual-section",
          label: t("virtual_session"),
        },
      ],
    },
  ];

  const administratorRoutes: RouteConfig[] = [
    {
      path: "/dashboard",
      label: t("DashboardBread"),
      children: [
        {
          path: "/dashboard-profile",
          label: t("profile"),
        },
        {
          path: "/organisations",
          label: t("OrganisationsBread"),
          children: [
            {
              path: `/organisations-settings/${orgId}`,
              label: t("OrganisationsSettings"),
            },
          ],
        },
        {
          path: "/users",
          label: t("Users"),
          children: [
            {
              path: "/user-edit/:id",
              label: t("Edituser"),
            },
          ],
        },
        {
          path: "/list-users",
          label: t("UserList"),
        },
        {
          path: "/test-parameters",
          label: t("Parameters"),
        },
        {
          path: "/add-user",
          label: t("AddUser"),
        },
        {
          path: "/investigation-reports",
          label: t("reports"),
        },

        {
          path: "/archive",
          label: t("Archive"),
        },
        {
          path: "/setting",
          label: t("Settings"),
        },
        {
          path: "/categories",
          label: t("Categories"),
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
        },
        {
          path: "/wards",
          label: t("wards"),
        },
        {
          path: "/view-feedback",
          label: t("view_feedback"),
        },
        {
          path: "/requests",
          label: t("requests"),
        },
        {
          path: "/new-investigations",
          label: t("parameters"),
        },
        {
          path: "/contacts-request",
          label: t("Contacts"),
        },
      ],
    },
  ];

  const adminRoutes: RouteConfig[] = [
    {
      path: "/dashboard-admin",
      label: t("Admindashboard"),
      children: [
        {
          path: "/dashboard-profile",
          label: t("profile"),
        },
        {
          path: "/admin-user",
          label: t("UsersAdmin"),
        },
        {
          path: "/new-investigations",
          label: t("parameters"),
        },
        {
          path: "/admin-organisation-settings/:id",
          label: t("EditOrganisation"),
        },
        {
          path: "/test-parameters",
          label: t("testparameters"),
        },
        {
          path: "/wards",
          label: t("wards"),
        },
        {
          path: "/patients",
          label: t("patients"),
          children: [
            {
              path: "/patients-view/:id",
              label: t("PatientDetails"),
              from: "patients",
            },
            {
              path: "/patient-list",
              label: t("patientList"),
              from: "patients",
            },
            {
              path: "/patient-edit/:id",
              label: t("EditPatient"),
              from: "patients",
            },
          ],
        },
        {
          path: "/users",
          label: t("Users"),
          children: [
            {
              path: "/user-edit/:id",
              label: t("Edituser"),
            },
            {
              path: "/user-assign-patient/:id",
              label: t("AssignPatient"),
            },
          ],
        },
        {
          path: "/investigation-reports",
          label: t("reports"),
        },
        {
          path: "/add-patient",
          label: t("AddPatient"),
        },
        {
          path: "/add-user",
          label: t("AddUser"),
        },
        {
          path: "/archive",
          label: t("Archive"),
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
        },
        {
          path: "/feedback-form",
          label: t("feedback"),
        },
      ],
    },
  ];

  const facultyRoutes: RouteConfig[] = [
    {
      path: "/dashboard-faculty",
      label: t("Admindashboard"),
      children: [
        {
          path: "/patients",
          label: t("patients"),
        },
        {
          path: "/users",
          label: t("Users"),
          children: [
            {
              path: "/user-edit/:id",
              label: t("Edituser"),
            },
            {
              path: "/user-assign-patient/:id",
              label: t("AssignPatient"),
            },
          ],
        },
        {
          path: "/new-investigations",
          label: t("parameters"),
        },
        {
          path: "/add-patient",
          label: t("AddPatient"),
        },
        {
          path: "/investigations",
          label: t("Investigations"),
          children: [
            {
              path: "/investigations-requests/:id",
              label: t("patient_report"),
            },
          ],
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
        },
        {
          path: "/feedback-form",
          label: t("feedback"),
        },
        {
          path: "/wards",
          label: t("wards"),
        },
        {
          path: "/virtual-section",
          label: t("virtual_session"),
        },
      ],
    },
  ];

  const observerRoutes: RouteConfig[] = [
    {
      path: "/dashboard-observer",
      label: t("Admindashboard"),
      children: [
        {
          path: "/patient-list",
          label: t("patientList"),
          children: [
            {
              path: "/patients-view/:id",
              label: t("PatientDetails"),
              from: "patients",
            },
          ],
        },
        {
          path: "/list-users",
          label: t("UserList"),
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
        },
        {
          path: "/feedback-form",
          label: t("feedback"),
        },
      ],
    },
  ];

  const userRoutes: RouteConfig[] = [
    {
      path: "/dashboard-user",
      label: t("Admindashboard"),
      children: [
        {
          path: "/patients-view/:id",
          label: t("PatientDetails"),
          from: "patients",
        },
        {
          path: "/allNotifications",
          label: t("allNotifications"),
          from: "patients",
        },
        {
          path: "/patients-public",
          label: t("public_patient"),
          children: [
            {
              path: "/patients-view/:id",
              label: t("PatientDetails"),
              from: "patients-public",
            },
          ],
        },
        {
          path: "/feedback-form",
          label: t("feedback"),
        },
      ],
    },
  ];

  let routeConfig: RouteConfig[];
  switch (userRole) {
    case "Superadmin":
      routeConfig = superadminRoutes;
      break;
    case "Administrator":
      routeConfig = administratorRoutes;
      break;
    case "Admin":
      routeConfig = adminRoutes;
      break;
    case "Faculty":
      routeConfig = facultyRoutes;
      break;
    case "Observer":
      routeConfig = observerRoutes;
      break;
    case "User":
    default:
      routeConfig = userRoutes;
      break;
  }

  const findBreadcrumbItems = (
    routes: RouteConfig[],
    currentPath: string,
    fromContext?: string
  ): RouteConfig[] => {
    for (const route of routes) {
      const normalizedRoutePath = normalizePath(route.path);
      if (
        currentPath === normalizedRoutePath ||
        currentPath.startsWith(normalizedRoutePath + "/")
      ) {
        if (route.from && fromContext && route.from !== fromContext) {
          continue;
        }

        const BreadcrumbItems = [route];
        if (route.children) {
          const nestedMatch = findBreadcrumbItems(
            route.children,
            currentPath,
            fromContext
          );
          if (nestedMatch.length > 1) {
            BreadcrumbItems.push(...nestedMatch.slice(1));
          }
        }
        return BreadcrumbItems;
      }

      if (route.children) {
        const nestedResult = findBreadcrumbItems(
          route.children,
          currentPath,
          fromContext
        );
        if (nestedResult.length > 0) {
          return [route, ...nestedResult];
        }
      }
    }
    return [];
  };

  const fromContext = state?.from;
  let BreadcrumbItems = findBreadcrumbItems(
    routeConfig,
    location.pathname,
    fromContext
  );

  if (BreadcrumbItems.length === 0) {
    const dashboardRoute = routeConfig.find((route) =>
      route.path.includes("dashboard")
    );
    if (dashboardRoute) {
      BreadcrumbItems = [dashboardRoute];
    }
  }

  return (
    <div className="h-full md:ml-10 md:pl-10 md:border-l border-white/[0.08] mr-auto -intro-x mt-12">
      <nav aria-label="breadcrumb">
        <div className="md:hidden">
          <Menu as="div" className="relative inline-block text-left mt-1">
            <div>
              <Menu.Button className="inline-flex items-center text-white hover:text-blue-200 transition-colors">
                {BreadcrumbItems.length > 0 && (
                  <>
                    <span className="truncate max-w-[120px]">
                      {BreadcrumbItems[BreadcrumbItems.length - 1].label}
                    </span>
                    <Lucide
                      icon="ChevronDown"
                      className="w-5 h-5 text-white flex-shrink-0"
                      bold
                    />
                  </>
                )}
              </Menu.Button>
            </div>

            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {BreadcrumbItems.map((item, index) => (
                    <Menu.Item key={`${item.path}-${index}`}>
                      {({ active }) => (
                        <Link
                          to={item.path}
                          state={{ from: item.from }}
                          className={`${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block px-4 py-2 text-sm`}
                        >
                          {item.label}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <ol className="hidden md:flex list-none p-0 m-0 items-center flex-wrap">
          {BreadcrumbItems.map((item, index) => (
            <li
              key={`${item.path}-${index}`}
              className="flex items-center mr-2 mb-1"
            >
              {index < BreadcrumbItems.length - 1 ? (
                <>
                  <Link
                    to={item.path}
                    state={{ from: item.from }}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                  <span className="text-white mx-2">/</span>
                </>
              ) : (
                <span className="text-white font-bold">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default DynamicBreadcrumb;
