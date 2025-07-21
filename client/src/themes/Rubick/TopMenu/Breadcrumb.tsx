import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { t } from "i18next";
import clsx from "clsx";

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
            path: "/list-users",
            label: t("UserList"),
          },
          {
            path: "/add-user",
            label: t("AddUser"),
          },
          {
            path: "/edit-user/:id",
            label: t("Edituser"),
          },
          {
            path: "/patient-list",
            label: t("patientList"),
          },
          {
            path: "/add-patient",
            label: t("AddPatient"),
          },
          {
            path: "/edit-patient/:id",
            label: t("EditPatient"),
          },
          {
            path: "/view-patient/:id",
            label: t("ViewPatientDetails"),
          },
          {
            path: "/assign-patient/:id",
            label: t("AssignPatient"),
          },
          {
            path: "/archive",
            label: t("Archive"),
          },
          {
            path: "/categories",
            label: t("Categories"),
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
            path: "/admin-user",
            label: t("UsersAdmin"),
          },
          {
            path: "/admin-organisation-settings/:id",
            label: t("EditOrganisation"),
          },
          {
            path: "/patient-list",
            label: t("patientList"),
          },
          {
            path: "/add-patient",
            label: t("AddPatient"),
          },
          {
            path: "/edit-patient/:id",
            label: t("EditPatient"),
          },
          {
            path: "/view-patient/:id",
            label: t("ViewPatientDetails"),
          },
          {
            path: "/assign-patient/:id",
            label: t("AssignPatient"),
          },
          {
            path: "/archive",
            label: t("Archive"),
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
            path: "/patient-list",
            label: t("patientList"),
          },
          {
            path: "/add-patient",
            label: t("AddPatient"),
          },
        ],
      },
    ],
    User: [
      {
        path: "/dashboard-user",
        label: t("UserDashboard"),
        children: [
          {
            path: "/view-patient/:id",
            label: t("ViewPatientDetails"),
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
    // Recursive function to find the path to a matching route
    const findPath = (
      routes: RouteConfig[],
      currentPath: string,
      parentPath: RouteConfig[] = []
    ): RouteConfig[] | null => {
      for (const route of routes) {
        const currentBreadcrumb = [...parentPath, route];

        // Check if this route matches the current path
        if (isPathMatch(route.path, currentPath)) {
          return currentBreadcrumb;
        }

        // If this route has children, search them
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
    return result || [];
  };

  // Select routes based on user role, fallback to Guest for unauthenticated users
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
          {index > 0 && <span className="mx-2 text-slate-500">/</span>}
          {index < breadcrumbItems.length - 1 ? (
            <Link
              to={normalizePath(item.path)}
              className="text-slate-500 hover:text-slate-300"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default DynamicBreadcrumb;
