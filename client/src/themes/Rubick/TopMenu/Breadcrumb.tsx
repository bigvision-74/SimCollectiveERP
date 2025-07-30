import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { t } from "i18next";
import clsx from "clsx";
import breadcrumbiconn from "@/assetsA/images/icons/breadcrumb.png";
import { useTranslation } from "react-i18next";

interface RouteConfig {
  path: string;
  label: string;
  from?: string;
  children?: RouteConfig[];
}

const DynamicBreadcrumb: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const userRole = localStorage.getItem("role") || "Superadmin";
  const { t } = useTranslation();

  const normalizePath = (path: string): string => {
    let normalized = path;
    Object.entries(params).forEach(([key, value]) => {
      normalized = normalized.replace(`:${key}`, value || "");
    });
    return normalized.replace(/\/+$/, "");
  };

  // Check if a route path matches the current path
  const isPathMatch = (routePath: string, currentPath: string): boolean => {
    const normalizedRoutePath = normalizePath(routePath);
    const normalizedCurrentPath = normalizePath(currentPath);

    // Exact match
    if (normalizedRoutePath === normalizedCurrentPath) {
      return true;
    }

    // For dynamic routes (containing :), check if the pattern matches
    if (routePath.includes(":")) {
      const routeSegments = routePath.split("/");
      const currentSegments = normalizedCurrentPath.split("/");

      if (routeSegments.length !== currentSegments.length) {
        return false;
      }

      return routeSegments.every((segment, index) => {
        return segment.startsWith(":") || segment === currentSegments[index];
      });
    }

    return false;
  };

  // Define route configurations for each role
  const routeConfigs: Record<string, RouteConfig[]> = {
    Superadmin: [
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
                path: "/organisations-settings/:orgId",
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
              },
              {
                path: "/patient-list",
                label: t("patientList"),
              },
              {
                path: "/patient-edit/:id",
                label: t("EditPatient"),
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
            path: "/categories",
            label: t("Categories"),
          },
          {
            path: "/allNotifications",
            label: t("allNotifications"),
          },
        ],
      },
    ],
    Admin: [
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
            path: "/admin-organisation-settings/:id",
            label: t("EditOrganisation"),
          },
          {
            path: "/patients",
            label: t("patients"),
            children: [
              {
                path: "/patients-view/:id",
                label: t("PatientDetails"),
              },
              {
                path: "/patient-list",
                label: t("patientList"),
              },
              {
                path: "/patient-edit/:id",
                label: t("EditPatient"),
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
        ],
      },
    ],
    Faculty: [
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
        ],
      },
    ],
    User: [
      {
        path: "/dashboard-user",
        label: t("Admindashboard"),
        children: [
          {
            path: "/patients-view/:id",
            label: t("PatientDetails"),
          },
          {
            path: "/allNotifications",
            label: t("allNotifications"),
          },
        ],
      },
    ],
    Observer: [
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
        ],
      },
    ],
    Guest: [
      {
        path: "/",
        label: t("Home"),
      },
      {
        path: "/login",
        label: t("Login"),
      },
      {
        path: "/register",
        label: t("Register"),
      },
      {
        path: "/forgot",
        label: t("ForgotPasswordt"),
      },
      {
        path: "/pricing",
        label: t("PricingPage"),
      },
      {
        path: "/plan-form",
        label: t("SubscriptionPage"),
      },
    ],
  };

  const findBreadcrumbItems = (
    routes: RouteConfig[],
    currentPath: string
  ): RouteConfig[] => {
    const findPath = (
      routes: RouteConfig[],
      currentPath: string,
      parentPath: RouteConfig[] = []
    ): RouteConfig[] | null => {
      for (const route of routes) {
        const currentBreadcrumb = [...parentPath, route];

        if (isPathMatch(route.path, currentPath)) {
          return currentBreadcrumb;
        }

        if (route.children) {
          const childResult = findPath(
            route.children,
            currentPath,
            currentBreadcrumb
          );
          if (childResult) {
            return childResult;
          }
        }
      }

      return null;
    };

    const result = findPath(routes, currentPath);

    return (
      result || [
        {
          label: t("DashboardBread"),
          path: "/dashboard",
        },
      ]
    );
  };

  const selectedRoutes = routeConfigs[userRole] || routeConfigs.Guest;
  const [breadcrumbItems, setBreadcrumbItems] = useState<RouteConfig[]>([]);

  useEffect(() => {
    const items = findBreadcrumbItems(selectedRoutes, location.pathname);
    setBreadcrumbItems(items);
  }, [location.pathname, userRole]);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <div className="h-full md:ml-10 md:pl-10 md:border-l border-white/[0.08] mr-auto -intro-x mt-12">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={`${item.path}-${index}`}>
          {index > 0 && <span className="mx-2 text-slate-400 ">/</span>}
          {index < breadcrumbItems.length - 1 ? (
            <Link
              to={normalizePath(item.path)}
              className="text-slate-200 hover:text-slate-300 text-[12px] lg:text-[14px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white text-[12px] lg:text-[14px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DynamicBreadcrumb;
