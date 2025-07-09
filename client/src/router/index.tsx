import React, { useState, useEffect, ReactNode, Suspense } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthRoutes";
import Layout from "../themes";
import { ErrorBoundary } from "react-error-boundary";
import "../style.css";
import "../components/HomeHeader/style.css";
import "../pages/Platform/platform.css";
import "../pages/Homepage/style.css";
import "../components/HomePageComponents/slider.css";
import { useTranslation } from "react-i18next";
import { ErrorBoundary1 } from "@/Errorboundary";
import { Helmet } from "react-helmet-async";
// import DashboardOverview1 from "../pages/DashboardOverview1";
import DashboardOverview2 from "../pages/DashboardOverview2";
import DashboardOverview3 from "../pages/DashboardOverview3";
import DashboardOverview4 from "../pages/DashboardOverview4";
import UsersLayout1 from "../pages/UsersLayout1";
import UsersLayout2 from "../pages/UsersLayout2";
import UsersLayout3 from "../pages/UsersLayout3";

const DashboardOverview1 = React.lazy(
  () => import("../pages/DashboardOverview1")
);

const Categories = React.lazy(() => import("../pages/Categories"));
const AddProduct = React.lazy(() => import("../pages/AddProduct"));
const Verify = React.lazy(() => import("@/pages/LoginVerify"));
const Login = React.lazy(() => import("../pages/Login"));
const Register = React.lazy(() => import("../pages/Register"));
const ErrorPage = React.lazy(() => import("../pages/ErrorPage"));
const Home = React.lazy(() => import("@/pages/Homepage"));
const ForgotPassword = React.lazy(() => import("@/pages/HomeLoginForgot"));
const AddUser = React.lazy(() => import("../pages/AddUser"));
const UserList = React.lazy(() => import("../pages/UserList"));
const PatientList = React.lazy(() => import("../pages/PatientList"));
const AddPatient = React.lazy(() => import("../pages/AddPatient"));
const EditPatient = React.lazy(() => import("../pages/PatientEdit"));
const EditUser = React.lazy(() => import("../pages/UserEdit"));
const Profile = React.lazy(() => import("@/pages/Profile"));

// org add function route
const Organisations = React.lazy(() => import("../pages/Organisations"));
const OrganisationSettings = React.lazy(
  () => import("../pages/OrganisationSettings")
);

const RouteTitle = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{title} | ERP </title>
      </Helmet>
      {children}
    </>
  );
};

interface PrivateRouteWithSuspenseProps {
  roles: string[];
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  title: string;
}

interface PublicRouteWithSuspenseProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  restricted?: boolean;
  title: string;
}

function Public() {
  const { t } = useTranslation();
  const role = localStorage.getItem("role");
  const determineDashboard = (role: string | null) => {
    switch (role) {
      case "Superadmin":
        return "/dashboard";
      case "admin":
        return "/dashboard-admin";
      case "manager":
        return "/dashboard-instructor";
      case "worker":
        return "/dashboard-user";
      default:
        return "/login";
    }
  };

  const PublicRoute = ({
    children,
    restricted = false,
  }: {
    children: React.ReactNode;
    restricted?: boolean;
  }) => {
    const { authenticated } = useAuth();

    useEffect(() => {
      const fontLink = document.createElement("link");
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);

      const iconLink = document.createElement("link");
      iconLink.href =
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css";
      iconLink.rel = "stylesheet";
      document.head.appendChild(iconLink);

      return () => {
        document.head.removeChild(fontLink);
        document.head.removeChild(iconLink);
      };
    }, []);

    if (authenticated === null) {
      return (
        <div className="fixed inset-0 flex items-center justify-center  ">
          <div className="load-row">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }

    if (authenticated && restricted) {
      return <Navigate to={determineDashboard(role)} />;
    }

    return <div style={{ fontFamily: "Poppins" }}>{children}</div>;
  };

  const PrivateRoute = ({
    children,
    roles,
  }: {
    children: React.ReactNode;
    roles?: string[];
  }) => {
    const { authenticated, role } = useAuth();
    if (!authenticated) {
      <Navigate to="/login" />;
    }
    if (authenticated === null) {
      return (
        <div className="fixed inset-0 flex items-center justify-center  ">
          <div className="load-row">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }

    if (roles && role !== null && !roles.includes(role)) {
      return <Navigate to={determineDashboard(role)} />;
    }

    return authenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  const PublicRouteWithSuspense = ({
    component: Component,
    fallback = (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="load-row">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    ),
    restricted = false,
    title = t("ERP"),
  }: PublicRouteWithSuspenseProps) => (
    <PublicRoute restricted={restricted}>
      <ErrorBoundary fallback={<ErrorBoundary1 />}>
        <Suspense fallback={fallback}>
          <RouteTitle title={title}>
            <Component />
          </RouteTitle>
        </Suspense>
      </ErrorBoundary>
    </PublicRoute>
  );

  const PrivateRouteWithSuspense = ({
    roles,
    component: Component,
    title = t("ERP"),

    fallback = (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="load-row">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    ),
  }: PrivateRouteWithSuspenseProps) => (
    <PrivateRoute roles={roles}>
      <ErrorBoundary fallback={<ErrorBoundary1 />}>
        <Suspense fallback={fallback}>
          <RouteTitle title={title}>
            <Component />
          </RouteTitle>
        </Suspense>
      </ErrorBoundary>
    </PrivateRoute>
  );

  const routes = [
    // Public: only these allowed without login
    {
      path: "/login",
      element: (
        <PublicRouteWithSuspense
          component={Login}
          title={t("Login")}
          restricted
        />
      ),
    },

    {
      element: <Layout />,
      children: [
        {
          path: "add-user",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "admin"]}
              component={AddUser}
              title={t("AddUser")}
            />
          ),
        },
        {
          path: "list-users",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={UserList}
              title={t("UserList")}
            />
          ),
        },
        {
          path: "edit-user/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "admin"]}
              component={EditUser}
              title={t("Edituser")}
            />
          ),
        },
        {
          path: "patient-list",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin","admin"]}
              component={PatientList}
              title={t("patientList")}
            />
          ),
        },
        {
          path: "add-patient",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "admin"]}
              component={AddPatient}
              title={t("AddPatient")}
            />
          ),
        },
         {
          path: "dashboard-profile",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "admin"]}
              component={Profile}
              title={t("Profile")}
            />
          ),
        },
        {
          path: "edit-patient/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "admin"]}
              component={EditPatient}
              title={t("EditPatient")}
            />
          ),
        },
        {
          path: "dashboard-overview-2",
          element: <DashboardOverview2 />,
        },
        {
          path: "dashboard-overview-3",
          element: <DashboardOverview3 />,
        },
        {
          path: "dashboard-overview-4",
          element: <DashboardOverview4 />,
        },
        {
          path: "users-layout-1",
          element: <UsersLayout1 />,
        },
        {
          path: "users-layout-2",
          element: <UsersLayout2 />,
        },
        {
          path: "users-layout-3",
          element: <UsersLayout3 />,
        },
      ],
    },

    // {
    //   path: "/",
    //   element: <DashboardOverview1 />,
    // },

    {
      path: "verify",
      element: (
        <PublicRouteWithSuspense
          component={Verify}
          title={t("Verifyt")}
          restricted
        />
      ),
    },
    {
      path: "/register",
      element: (
        <PublicRouteWithSuspense
          component={Register}
          title={t("Register")}
          restricted
        />
      ),
    },
    {
      path: "forgot",
      element: (
        <PublicRouteWithSuspense
          component={ForgotPassword}
          title={t("ForgotPasswordt")}
          restricted
        />
      ),
    },

    // Default route always to login
    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },

    // Private routes (require login)
    {
      element: <Layout />,
      children: [
        {
          path: "dashboard",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={DashboardOverview1}
              title={t("Dashboard")}
            />
          ),
        },
        {
          path: "categories",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={Categories}
              title={t("Categories")}
            />
          ),
        },
        {
          path: "organisations",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={Organisations}
              title={t("organisations")}
            />
          ),
        },
        {
          path: "organisations-settings/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={OrganisationSettings}
              title={t("OrganisationSettings")}
            />
          ),
        },
      ],
    },

    // Catch-all error page
    {
      path: "*",
      element: (
        <PublicRouteWithSuspense component={ErrorPage} title={t("Error")} />
      ),
    },
  ];

  return useRoutes(routes);
}

export default Public;
