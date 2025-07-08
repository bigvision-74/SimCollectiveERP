import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
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
    icon: "User",
    title: "Add User",
    pathname: "add-user",
  },
  {
    icon: "List",
    title: "Users List",
    pathname: "list-users",
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
        pathname: "/users-layout-1",
      },
    ],
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
  },
  // {
  //   icon: "Inbox",
  //   title: "Components",
  //   subMenu: [
  //     {
  //       icon: "Activity",
  //       title: "Table",
  //       subMenu: [
  //         {
  //           icon: "Zap",
  //           pathname: "/regular-table",
  //           title: "Regular Table",
  //         },
  //         {
  //           icon: "Zap",
  //           pathname: "/tabulator",
  //           title: "Tabulator",
  //         },
  //       ],
  //     },
  //     {
  //       icon: "Activity",
  //       title: "Overlay",
  //       subMenu: [
  //         {
  //           icon: "Zap",
  //           pathname: "/modal",
  //           title: "Modal",
  //         },
  //         {
  //           icon: "Zap",
  //           pathname: "/slideover",
  //           title: "Slide Over",
  //         },
  //         {
  //           icon: "Zap",
  //           pathname: "/notification",
  //           title: "Notification",
  //         },
  //       ],
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/tab",
  //       title: "Tab",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/accordion",
  //       title: "Accordion",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/button",
  //       title: "Button",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/alert",
  //       title: "Alert",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/progress-bar",
  //       title: "Progress Bar",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/tooltip",
  //       title: "Tooltip",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/dropdown",
  //       title: "Dropdown",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/typography",
  //       title: "Typography",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/icon",
  //       title: "Icon",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/loading-icon",
  //       title: "Loading Icon",
  //     },
  //   ],
  // },
  // {
  //   icon: "PanelLeft",
  //   title: "Forms",
  //   subMenu: [
  //     {
  //       icon: "Activity",
  //       pathname: "/regular-form",
  //       title: "Regular Form",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/datepicker",
  //       title: "Datepicker",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/tom-select",
  //       title: "Tom Select",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/file-upload",
  //       title: "File Upload",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/wysiwyg-editor",
  //       title: "Wysiwyg Editor",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/validation",
  //       title: "Validation",
  //     },
  //   ],
  // },
  // {
  //   icon: "HardDrive",
  //   title: "Widgets",
  //   subMenu: [
  //     {
  //       icon: "Activity",
  //       pathname: "/chart",
  //       title: "Chart",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/slider",
  //       title: "Slider",
  //     },
  //     {
  //       icon: "Activity",
  //       pathname: "/image-zoom",
  //       title: "Image Zoom",
  //     },
  //   ],
  // },
];

export default menu;
