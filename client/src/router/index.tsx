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

const DashboardOverview1 = React.lazy(
  () => import("../pages/DashboardOverview1")
);
const Categories = React.lazy(() => import("../pages/Categories"));
const AddProduct = React.lazy(() => import("../pages/AddProduct"));

const Login = React.lazy(() => import("../pages/Login"));
const Register = React.lazy(() => import("../pages/Register"));
const ErrorPage = React.lazy(() => import("../pages/ErrorPage"));
const Home = React.lazy(() => import("@/pages/Homepage"));

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
        <title>{title} | Insight XR </title>
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
      case "superadmin":
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
    title = t("insightMXR"),
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
    title = t("insightMXR"),

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
    {
      element: <Layout />,
      children: [
        {
          path: "dashboard",
          element: (
            <PrivateRouteWithSuspense
              roles={["superadmin"]}
              component={DashboardOverview1}
              title={t("DashboardOverview1")}
            />
          ),
        },
        {
          path: "categories",
          element: (
            <PrivateRouteWithSuspense
              roles={["superadmin"]}
              component={Categories}
              title={t("Categories")}
            />
          ),
        },
        {
          path: "/",
          element: (
            <PublicRouteWithSuspense component={Home} title={t("Homet")} />
          ),
        },
        {
          path: "login",
          element: (
            <PublicRouteWithSuspense
              component={Login}
              title={t("Login")}
              restricted
            />
          ),
        },
        {
          path: "register",
          element: (
            <PublicRouteWithSuspense
              component={Register}
              title={t("Register")}
              restricted
            />
          ),
        },
        {
          path: "*",
          element: (
            <PublicRouteWithSuspense
              component={ErrorPage}
              title={t("ErrorPage")}
            />
          ),
        },
      ],
    },
  ];

  return useRoutes(routes);
}

export default Public;
