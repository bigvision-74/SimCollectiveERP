// import { useRoutes } from "react-router-dom";
// import DashboardOverview1 from "../pages/DashboardOverview1";
// import DashboardOverview2 from "../pages/DashboardOverview2";
// import DashboardOverview3 from "../pages/DashboardOverview3";
// import DashboardOverview4 from "../pages/DashboardOverview4";
// import Categories from "../pages/Categories";
// import AddProduct from "../pages/AddProduct";
// import ProductList from "../pages/ProductList";
// import ProductGrid from "../pages/ProductGrid";
// import TransactionList from "../pages/TransactionList";
// import TransactionDetail from "../pages/TransactionDetail";
// import SellerList from "../pages/SellerList";
// import SellerDetail from "../pages/SellerDetail";
// import Reviews from "../pages/Reviews";
// import Inbox from "../pages/Inbox";
// import FileManager from "../pages/FileManager";
// import PointOfSale from "../pages/PointOfSale";
// import Chat from "../pages/Chat";
// import Post from "../pages/Post";
// import Calendar from "../pages/Calendar";
// import CrudDataList from "../pages/CrudDataList";
// import CrudForm from "../pages/CrudForm";
// import UsersLayout1 from "../pages/UsersLayout1";
// import UsersLayout2 from "../pages/UsersLayout2";
// import UsersLayout3 from "../pages/UsersLayout3";
// import ProfileOverview1 from "../pages/ProfileOverview1";
// import ProfileOverview2 from "../pages/ProfileOverview2";
// import ProfileOverview3 from "../pages/ProfileOverview3";
// import WizardLayout1 from "../pages/WizardLayout1";
// import WizardLayout2 from "../pages/WizardLayout2";
// import WizardLayout3 from "../pages/WizardLayout3";
// import BlogLayout1 from "../pages/BlogLayout1";
// import BlogLayout2 from "../pages/BlogLayout2";
// import BlogLayout3 from "../pages/BlogLayout3";
// import PricingLayout1 from "../pages/PricingLayout1";
// import PricingLayout2 from "../pages/PricingLayout2";
// import InvoiceLayout1 from "../pages/InvoiceLayout1";
// import InvoiceLayout2 from "../pages/InvoiceLayout2";
// import FaqLayout1 from "../pages/FaqLayout1";
// import FaqLayout2 from "../pages/FaqLayout2";
// import FaqLayout3 from "../pages/FaqLayout3";
// import Login from "../pages/Login";
// import Register from "../pages/Register";
// import ErrorPage from "../pages/ErrorPage";
// import UpdateProfile from "../pages/UpdateProfile";
// import ChangePassword from "../pages/ChangePassword";
// import RegularTable from "../pages/RegularTable";
// import Tabulator from "../pages/Tabulator";
// import Modal from "../pages/Modal";
// import Slideover from "../pages/Slideover";
// import Notification from "../pages/Notification";
// import Tab from "../pages/Tab";
// import Accordion from "../pages/Accordion";
// import Button from "../pages/Button";
// import Alert from "../pages/Alert";
// import ProgressBar from "../pages/ProgressBar";
// import Tooltip from "../pages/Tooltip";
// import Dropdown from "../pages/Dropdown";
// import Typography from "../pages/Typography";
// import Icon from "../pages/Icon";
// import LoadingIcon from "../pages/LoadingIcon";
// import RegularForm from "../pages/RegularForm";
// import Datepicker from "../pages/Datepicker";
// import TomSelect from "../pages/TomSelect";
// import FileUpload from "../pages/FileUpload";
// import WysiwygEditor from "../pages/WysiwygEditor";
// import Validation from "../pages/Validation";
// import Chart from "../pages/Chart";
// import Slider from "../pages/Slider";
// import ImageZoom from "../pages/ImageZoom";

// import Layout from "../themes";

// function Router() {
//   const routes = [
//     {
//       path: "/",
//       element: <Layout />,
//       children: [
//         {
//           path: "/",
//           element: <DashboardOverview1 />,
//         },
//         {
//           path: "dashboard-overview-2",
//           element: <DashboardOverview2 />,
//         },
//         {
//           path: "dashboard-overview-3",
//           element: <DashboardOverview3 />,
//         },
//         {
//           path: "dashboard-overview-4",
//           element: <DashboardOverview4 />,
//         },
//         {
//           path: "categories",
//           element: <Categories />,
//         },
//         {
//           path: "add-product",
//           element: <AddProduct />,
//         },
//         {
//           path: "product-list",
//           element: <ProductList />,
//         },
//         {
//           path: "product-grid",
//           element: <ProductGrid />,
//         },
//         {
//           path: "transaction-list",
//           element: <TransactionList />,
//         },
//         {
//           path: "transaction-detail",
//           element: <TransactionDetail />,
//         },
//         {
//           path: "seller-list",
//           element: <SellerList />,
//         },
//         {
//           path: "seller-detail",
//           element: <SellerDetail />,
//         },
//         {
//           path: "reviews",
//           element: <Reviews />,
//         },
//         {
//           path: "inbox",
//           element: <Inbox />,
//         },
//         {
//           path: "file-manager",
//           element: <FileManager />,
//         },
//         {
//           path: "point-of-sale",
//           element: <PointOfSale />,
//         },
//         {
//           path: "chat",
//           element: <Chat />,
//         },
//         {
//           path: "post",
//           element: <Post />,
//         },
//         {
//           path: "calendar",
//           element: <Calendar />,
//         },
//         {
//           path: "crud-data-list",
//           element: <CrudDataList />,
//         },
//         {
//           path: "crud-form",
//           element: <CrudForm />,
//         },
//         {
//           path: "users-layout-1",
//           element: <UsersLayout1 />,
//         },
//         {
//           path: "users-layout-2",
//           element: <UsersLayout2 />,
//         },
//         {
//           path: "users-layout-3",
//           element: <UsersLayout3 />,
//         },
//         {
//           path: "profile-overview-1",
//           element: <ProfileOverview1 />,
//         },
//         {
//           path: "profile-overview-2",
//           element: <ProfileOverview2 />,
//         },
//         {
//           path: "profile-overview-3",
//           element: <ProfileOverview3 />,
//         },
//         {
//           path: "wizard-layout-1",
//           element: <WizardLayout1 />,
//         },
//         {
//           path: "wizard-layout-2",
//           element: <WizardLayout2 />,
//         },
//         {
//           path: "wizard-layout-3",
//           element: <WizardLayout3 />,
//         },
//         {
//           path: "blog-layout-1",
//           element: <BlogLayout1 />,
//         },
//         {
//           path: "blog-layout-2",
//           element: <BlogLayout2 />,
//         },
//         {
//           path: "blog-layout-3",
//           element: <BlogLayout3 />,
//         },
//         {
//           path: "pricing-layout-1",
//           element: <PricingLayout1 />,
//         },
//         {
//           path: "pricing-layout-2",
//           element: <PricingLayout2 />,
//         },
//         {
//           path: "invoice-layout-1",
//           element: <InvoiceLayout1 />,
//         },
//         {
//           path: "invoice-layout-2",
//           element: <InvoiceLayout2 />,
//         },
//         {
//           path: "faq-layout-1",
//           element: <FaqLayout1 />,
//         },
//         {
//           path: "faq-layout-2",
//           element: <FaqLayout2 />,
//         },
//         {
//           path: "faq-layout-3",
//           element: <FaqLayout3 />,
//         },
//         {
//           path: "update-profile",
//           element: <UpdateProfile />,
//         },
//         {
//           path: "change-password",
//           element: <ChangePassword />,
//         },
//         {
//           path: "regular-table",
//           element: <RegularTable />,
//         },
//         {
//           path: "tabulator",
//           element: <Tabulator />,
//         },
//         {
//           path: "modal",
//           element: <Modal />,
//         },
//         {
//           path: "slideover",
//           element: <Slideover />,
//         },
//         {
//           path: "notification",
//           element: <Notification />,
//         },
//         {
//           path: "tab",
//           element: <Tab />,
//         },
//         {
//           path: "accordion",
//           element: <Accordion />,
//         },
//         {
//           path: "button",
//           element: <Button />,
//         },
//         {
//           path: "alert",
//           element: <Alert />,
//         },
//         {
//           path: "progress-bar",
//           element: <ProgressBar />,
//         },
//         {
//           path: "tooltip",
//           element: <Tooltip />,
//         },
//         {
//           path: "dropdown",
//           element: <Dropdown />,
//         },
//         {
//           path: "typography",
//           element: <Typography />,
//         },
//         {
//           path: "icon",
//           element: <Icon />,
//         },
//         {
//           path: "loading-icon",
//           element: <LoadingIcon />,
//         },
//         {
//           path: "regular-form",
//           element: <RegularForm />,
//         },
//         {
//           path: "datepicker",
//           element: <Datepicker />,
//         },
//         {
//           path: "tom-select",
//           element: <TomSelect />,
//         },
//         {
//           path: "file-upload",
//           element: <FileUpload />,
//         },
//         {
//           path: "wysiwyg-editor",
//           element: <WysiwygEditor />,
//         },
//         {
//           path: "validation",
//           element: <Validation />,
//         },
//         {
//           path: "chart",
//           element: <Chart />,
//         },
//         {
//           path: "slider",
//           element: <Slider />,
//         },
//         {
//           path: "image-zoom",
//           element: <ImageZoom />,
//         },
//       ],
//     },
//     {
//       path: "/login",
//       element: <Login />,
//     },
//     {
//       path: "/register",
//       element: <Register />,
//     },
//     {
//       path: "/error-page",
//       element: <ErrorPage />,
//     },
//     {
//       path: "*",
//       element: <ErrorPage />,
//     },
//   ];

//   return useRoutes(routes);
// }

// export default Router;


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
// const UserList = React.lazy(() => import("../pages/UserList"));
// const AgoraTokenUsers = React.lazy(
//   () => import("../pages/AgoraTokenUsers/AgoraToken")
// );
// const OrganisationSettings = React.lazy(
//   () => import("../pages/OrganisationSettings")
// );
// const Organisations = React.lazy(() => import("../pages/Organisations"));
// const AddUser = React.lazy(() => import("../pages/AddUser"));
const Login = React.lazy(() => import("../pages/Login"));
const Register = React.lazy(() => import("../pages/Register"));
const ErrorPage = React.lazy(() => import("../pages/ErrorPage"));
// const Home = React.lazy(() => import("@/pages/Homepage"));
// const Verify = React.lazy(() => import("@/pages/LoginVerify"));
// const AboutPage = React.lazy(() => import("@/components/HomeAbout"));
// const ContactPage = React.lazy(() => import("@/components/HomeContact"));
// const Product = React.lazy(() => import("@/components/HomeProduct"));
// const EditUser = React.lazy(() => import("../pages/UserEdit"));
// const Instructordashboard = React.lazy(() => import("@/pages/InstructorPage"));
// const Admindashboard = React.lazy(() => import("@/pages/AdminPage"));
// const ForgotPassword = React.lazy(() => import("@/pages/HomeLoginForgot"));
// const ResetPassword = React.lazy(() => import("@/pages/HomeResetPassword"));
// const Setting = React.lazy(() => import("@/pages/Settings"));
// const Devices = React.lazy(() => import("@/pages/Device"));
// const DeviceDetails = React.lazy(() => import("@/pages/DeviceDetails"));
// const Tags = React.lazy(() => import("@/pages/Tags"));
// const AllCourses = React.lazy(() => import("@/pages/AllCourses"));
// const AddCourse = React.lazy(() => import("@/pages/AddCourse"));
// const CourseDetails = React.lazy(() => import("@/pages/CourseDetails"));
// const AdminCourseDetail = React.lazy(() => import("@/pages/AdminCourseDetail"));
// const AddVrContent = React.lazy(() => import("@/pages/AddVrContent"));
// const VrContent = React.lazy(() => import("@/pages/VrContent"));
// const ModuleDetails = React.lazy(() => import("@/pages/ModuleDetails"));
// const ModuleApk = React.lazy(() => import("@/pages/CourseVirtualModule"));
// const LearningVideo = React.lazy(() => import("@/pages/LearningVideo"));
// const Preference1 = React.lazy(() => import("@/pages/Preference1"));
// const Preference2 = React.lazy(() => import("@/pages/Preference2"));
// const Preference3 = React.lazy(() => import("@/pages/Preference3"));
// const Preference4 = React.lazy(() => import("@/pages/Preference4"));
// const OnlineUsers = React.lazy(() => import("@/pages/OnlineUsers"));
// const HealthCare = React.lazy(() => import("@/pages/Solutions/HealthCare"));
// const DevicesAdmin = React.lazy(() => import("@/pages/DevicesAdmin"));
// const CoursesAdmin = React.lazy(() => import("@/pages/CoursesAdmin"));
// const UsersAdmin = React.lazy(() => import("@/pages/UsersAdmin"));
// const AdminOnlineUsers = React.lazy(() => import("@/pages/AdminOnlineUsers"));
// const CourseDetailsAdmin = React.lazy(
//   () => import("@/pages/CourseDetailsAdmin")
// );
// const UserActivity = React.lazy(() => import("@/pages/UserActivity"));
// const UserDashboard = React.lazy(() => import("@/pages/UserDashboard"));
// const UserCourse = React.lazy(() => import("@/pages/UserCourse"));
// const UserCourseDetails = React.lazy(() => import("@/pages/UserCourseDetails"));
// const InstructorUserList = React.lazy(
//   () => import("@/pages/InstructorUserList")
// );
// const ManagerCourses = React.lazy(() => import("@/pages/ManagerCourses"));
// const ManagerCourseDetails = React.lazy(
//   () => import("@/pages/ManagerCourseDetails")
// );
// const Recordings = React.lazy(() => import("@/pages/Recordings"));
// const Adminrecord = React.lazy(() => import("@/pages/RecordingsAdmins"));
// const Profile = React.lazy(() => import("@/pages/Profile"));
// const Pricing = React.lazy(() => import("@/pages/Pricing"));
// const AnalyticsResource = React.lazy(() => import("@/pages/AnalyticsResource"));
// const Notification = React.lazy(() => import("@/pages/Notification"));
// const DefaultPrefrence = React.lazy(() => import("@/pages/DefaultPrefrence"));
// const SuperAdminReport = React.lazy(() => import("@/pages/SuperAdminReport"));
// const VRSessionsSuperAdmin = React.lazy(
//   () => import("@/pages/VRSessionsSuperAdmin")
// );
// const ViewVRSessionsSuperAdmin = React.lazy(
//   () => import("@/pages/ViewVRSessionsSuperAdmin")
// );
// const Demographics = React.lazy(() => import("@/pages/Demographics"));
// const Language = React.lazy(() => import("@/pages/Language"));
// const SpatialOptimization = React.lazy(() => import("@/pages/SpacticalReport"));
// const PerformanceDashboard = React.lazy(() => import("@/pages/AppPerformance"));
// const LiveOperation = React.lazy(() => import("@/pages/LiveOperation"));
// const DownloadApps = React.lazy(() => import("@/pages/DownloadApps"));
// const CourseEdit = React.lazy(() => import("@/pages/CourseEdit"));
// const StudentOverview = React.lazy(() => import("@/pages/StudentOverview"));
// const StudentOptimization = React.lazy(
//   () => import("@/pages/StudentOptimization")
// );
// const StudentDemographic = React.lazy(
//   () => import("@/pages/StudentDemographic")
// );
// const StudentAppPerformance = React.lazy(
//   () => import("@/pages/StudentAppPerformance")
// );
// const AssignCourse = React.lazy(() => import("@/pages/AssignCourse"));
// const AddQuiz = React.lazy(() => import("@/pages/Quiz"));
// const AllQuiz = React.lazy(() => import("@/pages/AllQuiz"));
// const QuizAddQuestions = React.lazy(() => import("@/pages/QuizAddQuestion"));
// const QuizAddQuestionsModule = React.lazy(
//   () => import("@/pages/QuizAddQuestionsModule")
// );
// const QuizReportList = React.lazy(() => import("@/pages/QuizReportList"));
// const QuizUserList = React.lazy(() => import("@/pages/QuizUser"));
// const QuizUserDetail = React.lazy(() => import("@/pages/QuizUserDetail"));
// const QuizReport = React.lazy(() => import("@/pages/QuizReport"));
// const PlayQuiz = React.lazy(() => import("@/pages/PlayQuiz"));
// const AboutUs = React.lazy(() => import("@/pages/AboutUs"));
// const ContactSection = React.lazy(() => import("@/pages/ContactUs/ContactUs"));
// const Platform = React.lazy(() => import("@/pages/Platform"));
// const SessionReport = React.lazy(() => import("@/pages/SessionReport"));
// const StudentAtRisk = React.lazy(() => import("@/pages/StudentAtRisk"));
// const SolutionsNew = React.lazy(() => import("@/pages/solutionPage"));
// const EditOrganisation = React.lazy(
//   () => import("@/pages/AdminOrgEdit/AdminOrgEdit")
// );
// const UserSchedule = React.lazy(() => import("@/pages/UserSchedule"));
// const GDPRCompliance = React.lazy(() => import("@/pages/GDPRPage/GdprPage"));
// const TermsAndConditions = React.lazy(
//   () => import("@/pages/TermConditions/TermandConditons")
// );
// const StudentReport = React.lazy(
//   () => import("@/pages/NewUserReport/StudentReport")
// );
// const Certificate = React.lazy(() => import("@/pages/Certificate"));
// const Attendance = React.lazy(() => import("@/pages/Attendance/Attendance"));
// const CourseModuleList = React.lazy(
//   () => import("@/pages/CourseModuleList/index")
// );
// const Archive = React.lazy(() => import("@/pages/Archives/index"));
// const Licence = React.lazy(() => import("@/pages/Licence/index"));

// const UploadStatusIndicator = React.lazy(
//   () => import("@/pages/CourseVirtualModule/index")
// );

// const Preference = React.lazy(() => import("@/pages/Preference"));

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
        // {
        //   path: "edit-user/:id",

        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={EditUser}
        //       title={t("Edituser")}
        //     />
        //   ),
        // },
        // {
        //   path: "preference/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Preference}
        //       title={t("Preference")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-add-quiz/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={AddQuiz}
        //       title={t("AddQuiz")}
        //     ></PrivateRouteWithSuspense>
        //   ),
        // },
        // {
        //   path: "admin-organisation-settings/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={EditOrganisation}
        //       title={t("EditOrganisation")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-module-list",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={CourseModuleList}
        //       title={t("courses")}
        //     />
        //   ),
        // },
        // {
        //   path: "license",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Licence}
        //       title={t("license")}
        //     />
        //   ),
        // },

        // {
        //   path: "quiz-report-list",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "worker", "manager"]}
        //       component={QuizReportList}
        //       title={t("QuizReportList")}
        //     />
        //   ),
        // },
        // {
        //   path: "quiz-user-list/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={QuizUserList}
        //       title={t("QuizUserList")}
        //     />
        //   ),
        // },
        // {
        //   path: "quiz-user-detail/:quizId/:userId",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "worker", "manager"]}
        //       component={QuizUserDetail}
        //       title={t("QuizUserDetail")}
        //     />
        //   ),
        // },
        // {
        //   path: "/quiz-report/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "worker", "manager"]}
        //       component={QuizReport}
        //       title={t("QuizReportt")}
        //     />
        //   ),
        // },
        // {
        //   path: "/archive",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Archive}
        //       title={t("Archive")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-all-quiz",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={AllQuiz}
        //       title={t("AllQuiz")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-add-quizQuestions/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={QuizAddQuestions}
        //       title={t("QuizAddQuestions")}
        //     />
        //   ),
        // },
        // {
        //   path: "module-add-quizQuestions/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={QuizAddQuestionsModule}
        //       title={t("QuizAddQuestions")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-play-quiz/:quizId",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={PlayQuiz}
        //       title={t("PlayQuizt")}
        //     />
        //   ),
        // },
        // {
        //   path: "settings",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Setting}
        //       title={t("Setting")}
        //     />
        //   ),
        // },
        // {
        //   path: "notification",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager", "worker"]}
        //       component={Notification}
        //       title={t("Notification")}
        //     />
        //   ),
        // },
        // {
        //   path: "devices",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Devices}
        //       title={t("Devicest")}
        //     />
        //   ),
        // },
        // {
        //   path: "tags",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Tags}
        //       title={t("Tagst")}
        //     />
        //   ),
        // },
        // {
        //   path: "language",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={Language}
        //       title={t("Language")}
        //     />
        //   ),
        // },
        // {
        //   path: "vr-add",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={AddVrContent}
        //       title={t("AddVrContent")}
        //     />
        //   ),
        // },
        // {
        //   path: "vr-content",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={VrContent}
        //       title={t("VrContent")}
        //     />
        //   ),
        // },
        // {
        //   path: "sessionReport/:moduleId",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={SessionReport}
        //       title={t("SessionReport")}
        //     />
        //   ),
        // },
        // {
        //   path: "assign-course",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={AssignCourse}
        //       title={t("AssignCourset")}
        //     />
        //   ),
        // },
        // {
        //   path: "devices-details/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={DeviceDetails}
        //       title={t("DeviceDetailst")}
        //     />
        //   ),
        // },
        // {
        //   path: "dashboard-user",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={UserDashboard}
        //       title={t("UserDashboardt")}
        //     />
        //   ),
        // },
        // {
        //   path: "dashboard-admin",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={Admindashboard}
        //       title={t("Admindashboard")}
        //     />
        //   ),
        // },
        // {
        //   path: "devices-admin",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={DevicesAdmin}
        //       title={t("DevicesAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "courses-admin",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={CoursesAdmin}
        //       title={t("CoursesAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "dashboard-instructor",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={Instructordashboard}
        //       title={t("Instructordashboard")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-list-manager",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={ManagerCourses}
        //       title={t("ManagerCourses")}
        //     />
        //   ),
        // },
        // {
        //   path: "manager-users",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={InstructorUserList}
        //       title={t("InstructorUserList")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-detail-manager/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={ManagerCourseDetails}
        //       title={t("ManagerCourseDetails")}
        //     />
        //   ),
        // },
        // {
        //   path: "recordings",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={Recordings}
        //       title={t("Recordingst")}
        //     />
        //   ),
        // },
        // {
        //   path: "all-recordings",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={Adminrecord}
        //       title={t("Recordingst")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-at-risk",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["manager"]}
        //       component={StudentAtRisk}
        //       title={t("StudentAtRisk")}
        //     />
        //   ),
        // },
        // {
        //   path: "reportsPage",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={SuperAdminReport}
        //       title={t("SuperAdminReport")}
        //     />
        //   ),
        // },
        // {
        //   path: "app-performance",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={PerformanceDashboard}
        //       title={t("PerformanceDashboard")}
        //     />
        //   ),
        // },
        // {
        //   path: "demographic",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={Demographics}
        //       title={t("Demographics")}
        //     />
        //   ),
        // },
        // {
        //   path: "live-operations",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={LiveOperation}
        //       title={t("LiveOperation")}
        //     />
        //   ),
        // },
        // {
        //   path: "spatial-optimization",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={SpatialOptimization}
        //       title={t("SpatialOptimization")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-user-schedule",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={UserSchedule}
        //       title={t("UserSchedule")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-report",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={StudentReport}
        //       title={t("StudentReport")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-overview",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={StudentOverview}
        //       title={t("StudentOverview")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-app-performance",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={StudentAppPerformance}
        //       title={t("StudentAppPerformance")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-demographic",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={StudentDemographic}
        //       title={t("StudentDemographic")}
        //     />
        //   ),
        // },
        // {
        //   path: "student-optimization",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={StudentOptimization}
        //       title={t("StudentOptimization")}
        //     />
        //   ),
        // },
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
        // {
        //   path: "dashboard-profile",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager", "worker"]}
        //       component={Profile}
        //       title={t("Profile")}
        //     />
        //   ),
        // },
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
        // {
        //   path: "course-module-lesson/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager", "worker"]}
        //       component={ModuleDetails}
        //       title={t("ModuleDetails")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-details-admin",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={CourseDetailsAdmin}
        //       title={t("CourseDetailsAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-details/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={UserCourseDetails}
        //       title={t("UserCourseDetails")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-user",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["worker"]}
        //       component={UserCourse}
        //       title={t("UserCourse")}
        //     />
        //   ),
        // },
        {
          path: "add-product",
          element: (
            <PrivateRouteWithSuspense
              roles={[]}
              component={AddProduct}
              title={t("AddProduct")}
            />
          ),
        },
        // {
        //   path: "list-users",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={UserList}
        //       title={t("UserList")}
        //     />
        //   ),
        // },
        // {
        //   path: "agora-token",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={AgoraTokenUsers}
        //       title={t("agora_token")}
        //     />
        //   ),
        // },
        // {
        //   path: "online-user",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={OnlineUsers}
        //       title={t("OnlineUsers")}
        //     />
        //   ),
        // },

        // {
        //   path: "organisations-settings/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={OrganisationSettings}
        //       title={t("OrganisationSettings")}
        //     />
        //   ),
        // },
        // {
        //   path: "courses",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={AllCourses}
        //       title={t("AllCourses")}
        //     />
        //   ),
        // },
        // {
        //   path: "sessions",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={VRSessionsSuperAdmin}
        //       title={t("VRSessionsSuperAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "sessions-detail/:id/:userid",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={ViewVRSessionsSuperAdmin}
        //       title={t("ViewVRSessionsSuperAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-add",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={AddCourse}
        //       title={t("AddCourse")}
        //     />
        //   ),
        // },
        // {
        //   path: "admin-user",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={UsersAdmin}
        //       title={t("UsersAdmin")}
        //     />
        //   ),
        // },
        // {
        //   path: "online-admin-users",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["admin"]}
        //       component={AdminOnlineUsers}
        //       title={t("AdminOnlineUsers")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-details",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={AdminCourseDetail}
        //       title={t("AdminCourseDetail")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-detail/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin"]}
        //       component={CourseDetails}
        //       title={t("CourseDetails")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-module-detail/:id",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "admin", "manager"]}
        //       component={ModuleApk}
        //       title={t("ModuleApk")}
        //     />
        //   ),
        // },
        // {
        //   path: "deafault-prefrence",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin"]}
        //       component={DefaultPrefrence}
        //       title={t("DefaultPrefrence")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-ques-pref",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "manager"]}
        //       component={Preference1}
        //       title={t("Preference1")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-mall-pref",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "manager"]}
        //       component={Preference3}
        //       title={t("Preference3")}
        //     />
        //   ),
        // },
        // {
        //   path: "new-pref",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "manager"]}
        //       component={Preference4}
        //       title={t("Preference4")}
        //     />
        //   ),
        // },
        // {
        //   path: "course-safety-pref",
        //   element: (
        //     <PrivateRouteWithSuspense
        //       roles={["superadmin", "manager"]}
        //       component={Preference2}
        //       title={t("Preference2")}
        //     />
        //   ),
        // },
        // {
        //   path: 'recent-activity',
        //   element: (
        //     <PrivateRoute roles={['superadmin', 'admin', 'worker', 'manager']}>
        //       <UserActivity />
        //     </PrivateRoute>
        //   ),
        // },
    //     {
    //       path: "dashboard-user",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["worker"]}
    //           component={UserDashboard}
    //           title={t("UserDashboard")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "organisations",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["superadmin"]}
    //           component={Organisations}
    //           title={t("organisations")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "add-user",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["superadmin", "admin"]}
    //           component={AddUser}
    //           title={t("AddUser")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "download-apps",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["superadmin"]}
    //           component={DownloadApps}
    //           title={t("DownloadApps")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "course-edit/:id",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["superadmin", "manager"]}
    //           component={CourseEdit}
    //           title={t("CourseEdit")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "attendance-report",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["manager"]}
    //           component={Attendance}
    //           title={t("Attendance")}
    //         />
    //       ),
    //     },
    //     {
    //       path: "certificates-user",
    //       element: (
    //         <PrivateRouteWithSuspense
    //           roles={["worker"]}
    //           component={Certificate}
    //           title={t("Certificate")}
    //         />
    //       ),
    //     },
      ],
    },
    // {
    //   path: "course-learning-video/:id",
    //   element: (
    //     <PrivateRouteWithSuspense
    //       roles={["superadmin", "admin", "manager", "worker"]}
    //       component={LearningVideo}
    //       title={t("LearningVideo")}
    //     />
    //   ),
    // },
    // {
    //   path: "pricingPage",
    //   element: (
    //     <PublicRouteWithSuspense component={Pricing} title={t("Pricing")} />
    //   ),
    // },
    // {
    //   path: "Aboutus",
    //   element: (
    //     <PublicRouteWithSuspense component={AboutUs} title={t("AboutUs")} />
    //   ),
    // },
    // {
    //   path: "contact",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={ContactSection}
    //       title={t("ContactSection")}
    //     />
    //   ),
    // },
    // {
    //   path: "about",
    //   element: (
    //     <PublicRouteWithSuspense component={AboutPage} title={t("AboutPage")} />
    //   ),
    // },
    // {
    //   path: "product",
    //   element: (
    //     <PublicRouteWithSuspense component={Product} title={t("Product")} />
    //   ),
    // },
    // {
    //   path: "/",
    //   element: <PublicRouteWithSuspense component={Home} title={t("Homet")} />,
    // },
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
    // {
    //   path: "verify",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={Verify}
    //       title={t("Verifyt")}
    //       restricted
    //     />
    //   ),
    // },
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
    // {
    //   path: "forgot",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={ForgotPassword}
    //       title={t("ForgotPasswordt")}
    //       restricted
    //     />
    //   ),
    // },
    // {
    //   path: "reset-password",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={ResetPassword}
    //       title={t("ResetPassword")}
    //       restricted
    //     />
    //   ),
    // },
    {
      path: "*",
      element: (
        <PublicRouteWithSuspense component={ErrorPage} title={t("ErrorPage")} />
      ),
    },
    // {
    //   path: "/platform",
    //   element: (
    //     <PublicRouteWithSuspense component={Platform} title={t("Platform")} />
    //   ),
    // },
    // {
    //   path: "/solutions",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={SolutionsNew}
    //       title={t("SolutionsNew")}
    //     />
    //   ),
    // },
    // {
    //   path: "GDPR",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={GDPRCompliance}
    //       title={t("GDPRCompliance")}
    //     />
    //   ),
    // },
    // {
    //   path: "term-conditions",
    //   element: (
    //     <PublicRouteWithSuspense
    //       component={TermsAndConditions}
    //       title={t("TermsAndConditions")}
    //     />
    //   ),
    // },
  ];

  return useRoutes(routes);
}

export default Public;
