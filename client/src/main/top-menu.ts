import i18n from "i18next";
import { t } from "i18next";
import { Menu } from "@/stores/menuSlice";

const role = localStorage.getItem("role");
const menu: Array<Menu | "divider"> = [];
i18n
  .init()
  .then(() => {
    if (role === "Superadmin") {
      menu.push(
        {
          icon: "Home",
          title: "Dashboard",
          pathname: "/",
        },
        {
          icon: "User",
          title: "Add Organisations",
          pathname: "organisations",
        },

        {
          icon: "Users",
          title: t("Users"),
          subMenu: [
            {
              icon: "List",
              pathname: "/list-users",
              title: t("User_List"),
            },
            {
              icon: "Plus",
              pathname: "/add-user",
              title: t("Add_User"),
            },
          ],
        },
        {
          icon: "List",
          title: "Patient",
          subMenu: [
            {
              icon: "Users",
              title: "Patient List",
              pathname: "/patient-list",
            },
            {
              icon: "Users",
              title: "Add Patient",
              pathname: "/add-patient",
            },
          ],
        },
        {
          icon: "List",
          title: "Archive",
          pathname: "archive",
        },
        {
          icon: "Activity",
          title: "Apps",
          subMenu: [
            {
              icon: "Users",
              title: "Users",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/users-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/users-layout-2",
                  title: "Layout 2",
                },
                {
                  icon: "Zap",
                  pathname: "/users-layout-3",
                  title: "Layout 3",
                },
              ],
            },
          ],
        },
        {
          icon: "PanelsTopLeft",
          title: "Pages",
          subMenu: [
            {
              icon: "Activity",
              title: "Wizards",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/wizard-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/wizard-layout-2",
                  title: "Layout 2",
                },
                {
                  icon: "Zap",
                  pathname: "/wizard-layout-3",
                  title: "Layout 3",
                },
              ],
            },
            {
              icon: "Activity",
              title: "Blog",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/blog-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/blog-layout-2",
                  title: "Layout 2",
                },
                {
                  icon: "Zap",
                  pathname: "/blog-layout-3",
                  title: "Layout 3",
                },
              ],
            },
            {
              icon: "Activity",
              title: "Pricing",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/pricing-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/pricing-layout-2",
                  title: "Layout 2",
                },
              ],
            },
            {
              icon: "Activity",
              title: "Invoice",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/invoice-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/invoice-layout-2",
                  title: "Layout 2",
                },
              ],
            },
            {
              icon: "Activity",
              title: "FAQ",
              subMenu: [
                {
                  icon: "Zap",
                  pathname: "/faq-layout-1",
                  title: "Layout 1",
                },
                {
                  icon: "Zap",
                  pathname: "/faq-layout-2",
                  title: "Layout 2",
                },
                {
                  icon: "Zap",
                  pathname: "/faq-layout-3",
                  title: "Layout 3",
                },
              ],
            },
            {
              icon: "Activity",
              pathname: "login",
              title: "Login",
            },
            {
              icon: "Activity",
              pathname: "register",
              title: "Register",
            },
            {
              icon: "Activity",
              pathname: "error-page",
              title: "Error Page",
            },
            {
              icon: "Activity",
              pathname: "/update-profile",
              title: "Update profile",
            },
            {
              icon: "Activity",
              pathname: "/change-password",
              title: "Change Password",
            },
          ],
        }

      );
    } else if (role === "Admin") {
      menu.push(
        {
          icon: "Home",
          title: "Dashboard",
          pathname: "/",
        },
        {
          icon: "Users",
          title: t("Users"),
          subMenu: [
            {
              icon: "List",
              pathname: "admin-user",
              title: t("User_List"),
            },
            {
              icon: "Plus",
              pathname: "/add-user",
              title: t("Add_User"),
            },
          ],
        },
        {
          icon: "List",
          title: "Patient",
          subMenu: [
            {
              icon: "Users",
              title: "Patient List",
              pathname: "/patient-list",
            },
            {
              icon: "Users",
              title: "Add Patient",
              pathname: "/add-patient",
            },
          ],
        },
        {
          icon: "List",
          title: "Archive",
          pathname: "archive",
        },
        {
          icon: "ScrollText",
          title: "Reports",
          pathname: "investigation-reports",
        }
      );
    } else if (role === "Faculty") {
      menu.push(
        {
          icon: "Home",
          title: "Dashboard",
          pathname: "/",
        },
        {
          icon: "UserPlus",
          title: "Add Patient",
          pathname: "/add-patient",
        },
        {
          icon: "Users",
          title: "Patient List",
          pathname: "/patient-list",
        },
        {
          icon: "Archive",
          title: "Archive",
          pathname: "archive",
        },
        {
          icon: "FlaskConical",
          title: "Investigations",
          pathname: "investigations",
        }
      );
    } else if (role === "Observer") {
      menu.push(
        {
          icon: "Home",
          title: "Dashboard",
          pathname: "/",
        },
        {
          icon: "List",
          pathname: "/list-users",
          title: t("User_List"),
        },
        {
          icon: "Users",
          title: "Patient List",
          pathname: "/patient-list",
        },
      );
    } else if (role === "User") {
      menu.push(
        {
          icon: "Home",
          title: "Dashboard",
          pathname: "/",
        },

      );
    }
  })
  .catch((error) => {
    console.error("i18next initialization failed:", error);
  });

export default menu;
