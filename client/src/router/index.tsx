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
import RequestInvestigations from "@/components/PatientDetails/RequestInvestigations";
import LoadingDots from "@/components/LoadingDots/LoadingDots";
import PlanStatusChecker from "@/components/PlanStatusChecker";
import { useAppContext } from "@/contexts/sessionContext";


const Organisationspage = React.lazy(
  () => import("@/pages/OrganisationPage/Organisations")
);
const Userspage = React.lazy(() => import("@/pages/UserPage/Users"));
const ContactPage = React.lazy(() => import("@/pages/ContactUs/Contactus"));
const DashboardOverview1 = React.lazy(
  () => import("../pages/DashboardOverview1")
);

const Patientspage = React.lazy(() => import("../pages/PatientPage/Patients"));
const PricingPage = React.lazy(() => import("../pages/PricingPage/Pricing"));
const PlanFormPage = React.lazy(
  () => import("../pages/PlanFormPage/PlanFormPage")
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
const Archive = React.lazy(() => import("@/pages/Archives/index"));
const Admindashboard = React.lazy(() => import("@/pages/AdminPage"));
const Facultydashboard = React.lazy(() => import("@/pages/FacultyPage"));
const UsersAdmin = React.lazy(() => import("@/pages/UsersAdmin"));
const EditOrganisation = React.lazy(
  () => import("@/pages/AdminOrgEdit/AdminOrgEdit")
);
const ViewPatient = React.lazy(() => import("@/pages/ViewPatientDetails"));
const AssignPatient = React.lazy(() => import("@/pages/AassignPatient"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));
const Organisations = React.lazy(() => import("../pages/Organisations"));
const InvestReports = React.lazy(() => import("../pages/InvestReports"));
const PatientInvestigations = React.lazy(
  () => import("../pages/PatientInvestigations/index")
);
const ViewRequests = React.lazy(() => import("../pages/ViewRequests/index"));
const OrganisationSettings = React.lazy(
  () => import("../pages/OrganisationSettings")
);
const viewSetting = React.lazy(() => import("@/pages/Settings"));
const testParams = React.lazy(() => import("@/pages/TestParams"));
const upgradePlan = React.lazy(() => import("@/pages/RenewPlan"));
// user routes
const UserDashboard = React.lazy(() => import("@/pages/UserDashboard"));

// Observer Route
const ObserverDashboard = React.lazy(() => import("@/pages/ObserverDashboard"));
const NotificationPage = React.lazy(() => import("@/pages/Notification"));
const Success = React.lazy(() => import("../pages/Success"))
const Requests = React.lazy(() => import("../pages/Requests"));

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
      case "Admin":
        return "/dashboard-admin";
      case "Faculty":
        return "/dashboard-faculty";
      case "User":
        return "/dashboard-user";
      case "Observer":
        return "/dashboard-observer";
      default:
        return "/";
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
      return <LoadingDots />;
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
    const { isLoading } = useAppContext();

    if (isLoading || authenticated === null) {
      return <LoadingDots />;
    }

    if (!authenticated) {
      return <Navigate to="/login" replace />;
    }

    if (roles && role !== null && !roles.includes(role)) {
      return <Navigate to={determineDashboard(role)} replace />;
    }

    return authenticated ? (
      role === "Admin" ? (
        <PlanStatusChecker>{children}</PlanStatusChecker>
      ) : (
        children
      )
    ) : (
      <Navigate to="/login" replace />
    );
  };

  const PublicRouteWithSuspense = ({
    component: Component,
    fallback = <LoadingDots />,
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

    fallback = <LoadingDots />,
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
      path: "/",
      element: (
        <PublicRouteWithSuspense
          component={Home}
          title={t("Home")}
          restricted={false}
        />
      ),
    },

    // Public: only these allowed without login
    {
      path: "/login",
      element: (
        <PublicRouteWithSuspense
          component={Login}
          title={t("Login")}
          restricted={true}
        />
      ),
    },
    {
      path: "reset-password",
      element: (
        <PublicRouteWithSuspense
          component={ResetPassword}
          title={t("ResetPassword")}
          restricted
        />
      ),
    },
    {
      path: "/plan-form",
      element: (
        <PublicRouteWithSuspense
          component={PlanFormPage}
          title={t("SubscriptionPage")}
          restricted={false}
        />
      ),
    },
    {
      path: "/upgrade-plan",
      element: (
        <PublicRouteWithSuspense
          component={upgradePlan}
          title={t("upgradePage")}
          restricted={false}
        />
      ),
    },
    {
      path: "/contact-us",
      element: (
        <PublicRouteWithSuspense
          component={ContactPage}
          title={t("SubscriptionPage")}
          restricted={false}
        />
      ),
    },
    {
      path: "/pricing",
      element: (
        <PublicRouteWithSuspense
          component={PricingPage}
          title={t("PricingPage")}
          restricted={false}
        />
      ),
    },
    {
      path: "/success",
      element: (
        <PublicRouteWithSuspense
          component={Success}
          title={t("success")}
          restricted={false}
        />
      ),
    },

    {
      element: <Layout />,
      children: [
        {
          path: "dashboard",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={DashboardOverview1}
              title={t("dashboard")}
            />
          ),
        },
        {
          path: "add-user",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={AddUser}
              title={t("AddUser")}
            />
          ),
        },
        {
          path: "list-users",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Observer"]}
              component={UserList}
              title={t("UserList")}
            />
          ),
        },
        {
          path: "users",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={Userspage}
              title={t("Users")}
            />
          ),
        },
        {
          path: "patients",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "Faculty"]}
              component={Patientspage}
              title={t("Patients")}
            />
          ),
        },
        {
          path: "organisations",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={Organisationspage}
              title={t("organisations")}
            />
          ),
        },
        {
          path: "user-edit/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={EditUser}
              title={t("Edituser")}
            />
          ),
        },
        {
          path: "patient-list",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "Faculty", "Observer"]}
              component={PatientList}
              title={t("patientList")}
            />
          ),
        },
        {
          path: "add-patient",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "Faculty"]}
              component={AddPatient}
              title={t("AddPatient")}
            />
          ),
        },
        {
          path: "dashboard-profile",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "User", "Observer", "Faculty"]}
              component={Profile}
              title={t("Profile")}
            />
          ),
        },
        {
          path: "archive",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={Archive}
              title={t("Archive")}
            />
          ),
        },
        {
          path: "test-parameters",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={testParams}
              title={t("parameters")}
            />
          ),
        },
        {
          path: "investigation-reports",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={InvestReports}
              title={t("InvestReports")}
            />
          ),
        },
        {
          path: "patient-edit/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin","Faculty"]}
              component={EditPatient}
              title={t("EditPatient")}
            />
          ),
        },
        {
          path: "patients-view/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "User", "Faculty", "Observer"]}
              component={ViewPatient}
              title={t("ViewPatientDetails")}
            />
          ),
        },
        {
          path: "user-assign-patient/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin"]}
              component={AssignPatient}
              title={t("AssignPatient")}
            />
          ),
        },
        {
          path: "investigations-requests/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "Faculty"]}
              component={ViewRequests}
              title={t("ViewRequests")}
            />
          ),
        },
        {
          path: "investigations",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "Faculty"]}
              component={PatientInvestigations}
              title={t("PatientInvestigations")}
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
      path: "*",
      element: <Navigate to="/" replace />,
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
          path: "requests",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={Requests}
              title={t("organisations")}
            />
          ),
        },

        {
          path: "dashboard-admin",
          element: (
            <PrivateRouteWithSuspense
              roles={["Admin"]}
              component={Admindashboard}
              title={t("Admindashboard")}
            />
          ),
        },
        {
          path: "dashboard-faculty",
          element: (
            <PrivateRouteWithSuspense
              roles={["Faculty"]}
              component={Facultydashboard}
              title={t("Admindashboard")}
            />
          ),
        },
        {
          path: "admin-user",
          element: (
            <PrivateRouteWithSuspense
              roles={["Admin"]}
              component={UsersAdmin}
              title={t("UsersAdmin")}
            />
          ),
        },
        {
          path: "admin-organisation-settings/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Admin"]}
              component={EditOrganisation}
              title={t("EditOrganisation")}
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
          path: "organisations-settings/:id",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={OrganisationSettings}
              title={t("OrganisationSettings")}
            />
          ),
        },
        {
          path: "dashboard-user",
          element: (
            <PrivateRouteWithSuspense
              roles={["User"]}
              component={UserDashboard}
              title={t("UserDashboard")}
            />
          ),
        },
        {
          path: "dashboard-observer",
          element: (
            <PrivateRouteWithSuspense
              roles={["Observer"]}
              component={ObserverDashboard}
              title={t("ObserverDashboard")}
            />
          ),
        },
        {
          path: "setting",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin"]}
              component={viewSetting}
              title={t("viewSetting")}
            />
          ),
        },
        {
          path: "allNotifications",
          element: (
            <PrivateRouteWithSuspense
              roles={["Superadmin", "Admin", "User", "Observer", "Faculty"]} // adjust roles as needed
              component={NotificationPage}
              title={t("Notifications")}
            />
          ),
        },
      ],
    },

    // Catch-all error page
    {
      path: "*",
      element: <PublicRouteWithSuspense component={ErrorPage} title="Error" />,
    },
  ];

  return useRoutes(routes);
}

export default Public;
