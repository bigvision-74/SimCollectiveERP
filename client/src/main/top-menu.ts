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
          pathname: "/dashboard",
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
          icon: "Settings",
          title: "Settings",
          pathname: "setting",
        },


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
