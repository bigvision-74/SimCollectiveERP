import React from "react";
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
    currentPath: string,
    breadcrumbs: RouteConfig[] = []
  ): RouteConfig[] => {
    const normalizedCurrentPath = normalizePath(currentPath);

    for (const route of routes) {
      const normalizedRoutePath = normalizePath(route.path);

      if (
        normalizedCurrentPath === normalizedRoutePath ||
        normalizedCurrentPath.startsWith(`${normalizedRoutePath}/`) ||
        (route.path.includes(":") &&
          normalizedCurrentPath.includes(normalizedRoutePath.split(":")[0]))
      ) {
        const newBreadcrumbs = [...breadcrumbs, route];

        if (route.children) {
          const childMatch = findBreadcrumbItems(
            route.children,
            normalizedCurrentPath,
            newBreadcrumbs
          );
          if (childMatch.length > newBreadcrumbs.length) {
            return childMatch;
          }
        }
        return newBreadcrumbs;
      }
    }
    return breadcrumbs;
  };

  // Select routes based on user role, fallback to Guest for unauthenticated users
  const selectedRoutes = routeConfigs[userRole] || routeConfigs.Guest;
  const breadcrumbItems = findBreadcrumbItems(
    selectedRoutes,
    location.pathname
  );

  console.log({
    pathname: location.pathname,
    normalizedPath: normalizePath(location.pathname),
    params,
    userRole,
    selectedRoutes,
    breadcrumbItems: breadcrumbItems.map((item) => ({
      path: item.path,
      label: item.label,
      normalized: normalizePath(item.path),
    })),
  });

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <div className="h-full md:ml-10 md:pl-10 md:border-l border-white/[0.08] mr-auto -intro-x mt-12">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={`${item.path}-${index}`}>
          {index > 0 && <span className="mx-2 text-slate-200">/</span>}
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
