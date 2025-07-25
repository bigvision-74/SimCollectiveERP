import React, { Fragment, useState, useRef, useEffect } from "react";
import { FormInput } from "@/components/Base/Form";
import { Transition } from "@headlessui/react";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";
import { globalSearchDataAction } from "@/actions/userActions";
import { useNavigate } from "react-router-dom";

function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const role = localStorage.getItem("role") || "";
  const email = localStorage.getItem("email") || "";
  const navigate = useNavigate();

  const searchablePages = [
    {
      path: "dashboard",
      title: t("dashboard"),
      roles: ["Superadmin", "Admin"],
      icon: <Lucide icon="LayoutDashboard" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "investigation-reports",
      title: t("reports"),
      roles: ["Superadmin", "Admin"],
      icon: <Lucide icon="ClipboardList" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "add-user",
      title: t("AddUser"),
      roles: ["Superadmin", "Admin"],
      icon: <Lucide icon="UserPlus" className="w-4 h-4" />,
      iconBg: "bg-success/20 dark:bg-success/10 text-success",
    },
    {
      path: "list-users",
      title: t("UserList"),
      roles: ["Superadmin", "Observer"],
      icon: <Lucide icon="Users" className="w-4 h-4" />,
      iconBg: "bg-pending/10 text-pending",
    },
    {
      path: "patient-list",
      title: t("patientList"),
      roles: ["Superadmin", "Admin", "Faculty", "Observer"],
      icon: <Lucide icon="ClipboardList" className="w-4 h-4" />,
      iconBg: "bg-success/20 dark:bg-success/10 text-success",
    },
    {
      path: "add-patient",
      title: t("AddPatient"),
      roles: ["Superadmin", "Admin", "Faculty"],
      icon: <Lucide icon="UserPlus" className="w-4 h-4" />,
      iconBg: "bg-success/20 dark:bg-success/10 text-success",
    },
    {
      path: "dashboard-profile",
      title: t("Profile"),
      roles: ["Superadmin", "Admin", "User", "Observer"],
      icon: <Lucide icon="User" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "archive",
      title: t("Archive"),
      roles: ["Superadmin", "Admin"],
      icon: <Lucide icon="Archive" className="w-4 h-4" />,
      iconBg: "bg-warning/10 text-warning",
    },
    {
      path: "investigations",
      title: t("PatientInvestigations"),
      roles: ["Superadmin", "Admin", "Faculty"],
      icon: <Lucide icon="Activity" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "organisations",
      title: t("organisations"),
      roles: ["Superadmin"],
      icon: <Lucide icon="Building2" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "dashboard-admin",
      title: t("Admindashboard"),
      roles: ["Admin"],
      icon: <Lucide icon="LayoutDashboard" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "dashboard-faculty",
      title: t("Admindashboard"),
      roles: ["Faculty"],
      icon: <Lucide icon="LayoutDashboard" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "admin-user",
      title: t("UsersAdmin"),
      roles: ["Admin"],
      icon: <Lucide icon="Users" className="w-4 h-4" />,
      iconBg: "bg-pending/10 text-pending",
    },
    {
      path: "categories",
      title: t("Categories"),
      roles: ["Superadmin"],
      icon: <Lucide icon="List" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "dashboard-user",
      title: t("UserDashboard"),
      roles: ["User"],
      icon: <Lucide icon="LayoutDashboard" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
    {
      path: "dashboard-observer",
      title: t("ObserverDashboard"),
      roles: ["Observer"],
      icon: <Lucide icon="LayoutDashboard" className="w-4 h-4" />,
      iconBg: "bg-primary/10 dark:bg-primary/20 text-primary/80",
    },
  ];

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const search = async () => {
      if (debouncedQuery && debouncedQuery.length >= 3) {
        try {
          const results = await globalSearchDataAction(
            debouncedQuery,
            role,
            email
          );
          setSearchResults(results.data);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults(null);
        }
      } else {
        setSearchResults(null);
      }
    };

    search();
  }, [debouncedQuery, role, email]);

  const handleResultClick = (type: string, id?: number) => {
    setIsOpen(false);
    setQuery("");

    switch (type) {
      case "user":
        navigate("/list-users");
        break;
      case "patient":
        navigate(`/patient-list`);
        break;
      case "organisation":
        navigate("/organisations");
        break;
      case "investigation":
        navigate("/investigations");
        break;
      case "request_investigation":
        navigate("/investigations");
        break;
      default:
        // For pages from searchablePages
        navigate(`/${type}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(!!e.target.value);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Lucide icon="User" className="w-4 h-4" />;
      case "patient":
        return <Lucide icon="ClipboardList" className="w-4 h-4" />;
      case "organisation":
        return <Lucide icon="Building2" className="w-4 h-4" />;
      case "investigation":
      case "request_investigation":
        return <Lucide icon="Activity" className="w-4 h-4" />;
      default:
        return <Lucide icon="Search" className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative mr-3 intro-x sm:mr-6" ref={dropdownRef}>
      <div className="hidden sm:block">
        <FormInput
          type="text"
          value={query}
          onChange={handleChange}
          className="border-transparent w-56 shadow-none rounded-full bg-slate-200 pr-8 transition-[width] duration-300 ease-in-out focus:border-transparent focus:w-72 dark:bg-darkmode-400/70"
          placeholder="Search..."
          onFocus={handleFocus}
        />
        <Lucide
          icon="Search"
          className="absolute inset-y-0 right-0 w-5 h-5 my-auto mr-3 text-slate-600 dark:text-slate-500"
        />
      </div>

      <a className="relative text-white/70 sm:hidden" href="/search">
        <Lucide icon="Search" className="w-5 h-5 dark:text-slate-500" />
      </a>

      <Transition
        as={Fragment}
        show={isOpen && !!query}
        enter="transition-all ease-linear duration-150"
        enterFrom="mt-5 invisible opacity-0 translate-y-1"
        enterTo="mt-[3px] visible opacity-100 translate-y-0"
        leave="transition-all ease-linear duration-150"
        leaveFrom="mt-[3px] visible opacity-100 translate-y-0"
        leaveTo="mt-5 invisible opacity-0 translate-y-1"
      >
        <div className="absolute right-0 z-10 mt-[3px] w-[450px]">
          <div className="p-5 box shadow-lg rounded-lg bg-white dark:bg-darkmode-600 max-h-[80vh] overflow-y-auto">
            {/* Check if we have any results at all */}
            {searchResults?.users?.length > 0 ||
            searchResults?.patients?.length > 0 ||
            searchResults?.organisations?.length > 0 ||
            searchResults?.investigations?.length > 0 ||
            searchResults?.requestInvestigations?.length > 0 ||
            searchablePages.filter(
              (page) =>
                page.title.toLowerCase().includes(query.toLowerCase()) ||
                page.path.toLowerCase().includes(query.toLowerCase())
            ).length > 0 ? (
              <>
                {/* Local Pages Results - only show if we have matches */}
                {searchablePages.filter(
                  (page) =>
                    page.title.toLowerCase().includes(query.toLowerCase()) ||
                    page.path.toLowerCase().includes(query.toLowerCase())
                ).length > 0 && (
                  <>
                    <div className="mb-2 font-medium">Pages</div>
                    <div className="mb-5">
                      {searchablePages
                        .filter((page) => {
                          const matchesSearch =
                            page.title
                              .toLowerCase()
                              .includes(query.toLowerCase()) ||
                            page.path
                              .toLowerCase()
                              .includes(query.toLowerCase());
                          const hasPermission = page.roles.includes(role);
                          return matchesSearch && hasPermission;
                        })
                        .map((page) => (
                          <div
                            key={page.path}
                            className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-darkmode-400 rounded cursor-pointer"
                            onClick={() => handleResultClick(page.path)}
                          >
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${page.iconBg}`}
                            >
                              {page.icon}
                            </div>
                            <div className="ml-3">{page.title}</div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {/* Backend Search Results */}
                {/* Users */}
                {searchResults?.users?.length > 0 && (
                  <>
                    <div className="mb-2 font-medium">Users</div>
                    <div className="mb-5">
                      {searchResults.users.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-darkmode-400 rounded cursor-pointer"
                          onClick={() => handleResultClick("user")}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80">
                            {renderIcon("user")}
                          </div>
                          <div className="ml-3">
                            {user.fname} {user.lname}
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Patients - only shown if we have results */}
                {searchResults?.patients?.length > 0 && (
                  <>
                    <div className="mb-2 font-medium">Patients</div>
                    <div className="mb-5">
                      {searchResults.patients.map((patient: any) => (
                        <div
                          key={patient.id}
                          className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-darkmode-400 rounded cursor-pointer"
                          onClick={() =>
                            handleResultClick("patient", patient.id)
                          }
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/20 dark:bg-success/10 text-success">
                            {renderIcon("patient")}
                          </div>
                          <div className="ml-3">
                            {patient.name}
                            <div className="text-xs text-slate-500">
                              {patient.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Organisations - only shown if we have results */}
                {searchResults?.organisations?.length > 0 && (
                  <>
                    <div className="mb-2 font-medium">Organisations</div>
                    <div className="mb-5">
                      {searchResults.organisations.map((org: any) => (
                        <div
                          key={org.id}
                          className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-darkmode-400 rounded cursor-pointer"
                          onClick={() =>
                            handleResultClick("organisation", org.id)
                          }
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10 dark:bg-warning/20 text-warning">
                            {renderIcon("building")}
                          </div>
                          <div className="ml-3">
                            {org.name}
                            <div className="text-xs text-slate-500">
                              {org.type} • {org.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Investigations - only shown if we have results */}
                {searchResults?.investigations?.length > 0 && (
                  <>
                    <div className="mb-2 font-medium">Investigations</div>
                    <div className="mb-5">
                      {searchResults.investigations.map(
                        (investigation: any) => (
                          <div
                            key={investigation.id}
                            className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-darkmode-400 rounded cursor-pointer"
                            onClick={() =>
                              handleResultClick(
                                "investigation",
                                investigation.id
                              )
                            }
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-info/10 dark:bg-info/20 text-info">
                              {renderIcon("flask")}
                            </div>
                            <div className="ml-3">
                              {investigation.name}
                              <div className="text-xs text-slate-500">
                                {investigation.category} • {investigation.code}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}

              </>
            ) : (
              // Only show "No results" if we've actually performed a search
              query.length >= 3 && (
                <div className="py-4 text-center text-slate-500">
                  No results found for "{query}"
                </div>
              )
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
}

export default GlobalSearch;
