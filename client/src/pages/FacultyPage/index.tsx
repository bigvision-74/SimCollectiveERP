import _ from "lodash";
import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import { TinySliderElement } from "@/components/Base/TinySlider";
import Lucide from "@/components/Base/Lucide";
import ReportDonutChart from "@/components/ReportDonutChart";
import ReportPieChart from "@/components/ReportPieChart";
import { t } from "i18next";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import {
  getAllActiveSessionsAction,
  endSessionAction,
} from "@/actions/sessionAction";
import Alert from "@/components/Base/Alert";
import { getAdminAllCountAction } from "@/actions/userActions";
import { useNavigate } from "react-router-dom";
import { getAdminOrgAction } from "@/actions/adminActions";
import {
  getAllTypeRequestInvestigationAction,
  getPatientsByUserOrgAction,
} from "@/actions/patientActions";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DashboardEntry = {
  name: string;
  count: number;
};

function Main() {
  const navigate = useNavigate();
  const [dashboardData, setdashboardData] = useState<DashboardEntry[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const importantNotesRef = useRef<TinySliderElement>();
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const prevImportantNotes = () => {
    importantNotesRef.current?.tns.goTo("prev");
  };
  const nextImportantNotes = () => {
    importantNotesRef.current?.tns.goTo("next");
  };

  // fetch pateint detaile for display detail is bar grhap base of daily weeak
  type PatientStatsEntry = {
    label: string;
    daily: number;
    weekly: number;
    monthly: number;
  };

  type Sessions = {
    name: string;
    patient_name: number;
    patient: number;
    id: number;
  };

  // this is use for invastigation chart
  type InvestigationEntry = {
    id: number;
    patient_id: number;
    request_by: number;
    category: string;
    test_name: string;
    status: string;
    created_at: string;
    updated_at: string;
  };

  // this is use for display age percentage chart
  type AgeGroupData = {
    name: string;
    value: number;
    color: string;
  };

  const [patientStats, setPatientStats] = useState<PatientStatsEntry[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationEntry[]>(
    []
  );
  const [activeSessionsList, setActiveSessionsList] = useState<Sessions[]>([]);
  const [filteredactiveSessionsList, setFilteredActiveSessionsList] = useState<
    Sessions[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [ageGroups, setAgeGroups] = useState<AgeGroupData[]>([]);

  const height = 213;
  const groupColors = {
    "0-16": "#0ea5e9", // Tailwind 'info' ~ sky-500
    "17-30": "#fa812d", // Tailwind 'primary' ~ blue-500
    "31-50": "#fad12c", // Tailwind 'pending' ~ yellow-400
    "51+": "#6b37bd", // Tailwind 'warning' ~ orange-500
  };

  // fetch org name and user count
  const fetchUsers = async () => {
    try {
      const useremail = localStorage.getItem("user") || "";
      const org = await getAdminOrgAction(useremail);

      // Set name and ID from `org` (NOT from `data`)
      setOrgName(org.name || "");
      setOrgId(org.orgid || "");

      const data = await getAdminAllCountAction(org.orgid, useremail);

      setdashboardData(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getCount = (name: string) => {
    const item = dashboardData.find((d) => d.name === name);
    return item?.count ?? 0;
  };

  // GET PATIENT DETAIAL BASE OF ADMIN ORGINATIONS
  const fetchPatientStats = async () => {
    try {
      const userEmail = localStorage.getItem("user") || "";
      if (!userEmail) return;

      const org = await getAdminOrgAction(userEmail);
      const userId = org.id;

      const records = await getPatientsByUserOrgAction(userId);

      const now = dayjs();
      let daily = 0;
      let weekly = 0;
      let monthly = 0;

      records.forEach((patient: any) => {
        if (!patient.created_at) return;

        const created = dayjs(patient.created_at);

        if (created.isSame(now, "day")) daily += 1;
        if (created.isSame(now, "week")) weekly += 1;
        if (created.isSame(now, "month")) monthly += 1;
      });

      const chartData: PatientStatsEntry[] = [
        {
          label: "Patients",
          daily,
          weekly,
          monthly,
        },
      ];

      setPatientStats(chartData);
    } catch (err) {
      console.error("Error fetching patient stats", err);
    }
  };

  // fetch all pending and complete request
  const fetchInvestigations = async () => {
    try {
      const res = await getAllTypeRequestInvestigationAction();
      setInvestigations(res);
    } catch (err) {
      console.error("Error fetching investigations:", err);
    }
  };

  const handleEndSession = async (sessionId: any) => {
    try {
      sessionStorage.removeItem("activeSession");
      await endSessionAction(sessionId);
      fetchActiveSessions();
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const userEmail = localStorage.getItem("user") || "";
      if (!userEmail) return;

      const orgData = await getAdminOrgAction(userEmail);
      const orgId = orgData.orgid;
      const Data = await getAllActiveSessionsAction(orgId);
      const filteredData = Array.isArray(Data)
        ? Data.filter((session) => Number(session.createdBy) === Number(orgData.id))
        : [];
      console.log(filteredData, "filteredData");
      setActiveSessionsList(filteredData);
    } catch (err) {
      console.error("Error fetching investigations:", err);
    }
  };

  const propertiesToSearch = ["name", "patient_name"];

  useEffect(() => {
    if (Array.isArray(activeSessionsList)) {
      const filtered = activeSessionsList.filter((activeSessions) => {
        return propertiesToSearch.some((prop) =>
          activeSessions[prop as keyof Sessions]
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });

      setFilteredActiveSessionsList(filtered);
    }
  }, [currentPage, itemsPerPage, searchQuery, activeSessionsList]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // fetching all patient details for display pateint by age
  const calculateAgeDistribution = async () => {
    try {
      const userEmail = localStorage.getItem("user") || "";
      if (!userEmail) return;

      const org = await getAdminOrgAction(userEmail);
      const userId = org.id;

      const patients = await getPatientsByUserOrgAction(userId);
      const now = dayjs();

      const ageGroupBuckets: { [key: string]: number } = {
        "0-16": 0,
        "17-30": 0,
        "31-50": 0,
        "51+": 0,
      };

      patients.forEach((patient: any) => {
        const dob = patient.date_of_birth;
        if (!dob) return;
        const age = now.diff(dayjs(dob), "year");

        if (age <= 16) ageGroupBuckets["0-16"]++;
        else if (age <= 30) ageGroupBuckets["17-30"]++;
        else if (age <= 50) ageGroupBuckets["31-50"]++;
        else ageGroupBuckets["51+"]++;
      });

      const total = patients.length;

      const formatted = Object.entries(ageGroupBuckets).map(
        ([range, count]) => {
          const key = range as keyof typeof groupColors;
          return {
            name: range,
            value:
              total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
            color: groupColors[key], // ✅ Hex code for chart
          };
        }
      );

      setAgeGroups(formatted);
    } catch (err) {
      console.error("Error calculating age groups", err);
    }
  };

  // THIS IS USE FOR DISPLAY COMPLEET OR PENDING DATA IN PERCENTAGE  Investigation Status
  const pendingCount = investigations.filter(
    (i) => i.status === "pending"
  ).length;
  const completeCount = investigations.filter(
    (i) => i.status === "complete"
  ).length;
  const total = pendingCount + completeCount;

  const getPercentage = (count: number) =>
    total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";

  useEffect(() => {
    fetchUsers();
    fetchPatientStats();
    fetchActiveSessions();
    fetchInvestigations();
    calculateAgeDistribution();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 2xl:col-span-12">
        <div className="grid grid-cols-12 gap-6">
          {/* BEGIN: General Report */}
          <div className="col-span-12 mt-8">
            {showSuccessAlert && (
              <Alert variant="soft-success" className="flex items-center mb-2">
                <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />{" "}
                {t("successLogin")}
              </Alert>
            )}
            <div className="flex justify-between h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                {t("org")} - {orgName}
              </h2>
              <div className="flex">
                <Lucide
                  icon="RefreshCcw"
                  className="w-5 h-5 mr-4 cursor-pointer text-primary"
                  onClick={() => {
                    window.location.reload();
                  }}
                />
                {/* <Lucide
                  icon="Settings"
                  className="w-5 h-5 mr-3 text-primary cursor-pointer"
                  onClick={() => {
                    navigate(`/admin-organisation-settings/${orgId}`);
                  }}
                /> */}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 mt-5">
              <div className="col-span-12 sm:col-span-5 xl:col-span-6 intro-y">
                <div
                  className={clsx([
                    "relative zoom-in",
                    "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                  ])}
                >
                  <div
                    className="p-5 box"
                    onClick={() => {
                      navigate("/patients");
                    }}
                  >
                    <div className="flex">
                      <Lucide
                        icon="Box"
                        className="w-[28px] h-[28px] text-warning"
                      />
                      <div className="ml-auto"></div>
                    </div>
                    <div className="mt-6 text-3xl font-medium leading-8">
                      {getCount("patients")}
                    </div>
                    <div className="mt-1 text-base text-slate-500">
                      {t("total_patients")}
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="col-span-12 sm:col-span-5 xl:col-span-6 intro-y">
                <div
                  className={clsx([
                    "relative zoom-in",
                    "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                  ])}
                >
                  <div
                    className="p-5 box"
                    onClick={() => {
                      navigate("/admin-user");
                    }}
                  >
                    <div className="flex">
                      <Lucide
                        icon="Users"
                        className="w-[28px] h-[28px] text-primary"
                      />
                    </div>
                    <div className="mt-6 text-3xl font-medium leading-8">
                      {getCount("users")}
                    </div>
                    <div className="mt-1 text-base text-slate-500">
                      {t("total_users")}
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
          {/* END: General Report */}

          {/* BEGIN: Patient Statistics */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-6">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                {t("PatientStatistics")}
              </h2>
            </div>
            <div className="p-5 mt-5 rounded-lg bg-white shadow-md intro-y">
              <div className="w-full h-[300px]">
                {patientStats.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    {t("Nopatientdataavailable")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={patientStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barCategoryGap="20%"
                    >
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="daily" fill="#6b37bd" name="Daily" />
                      <Bar dataKey="weekly" fill="#fad12c" name="Weekly" />
                      <Bar dataKey="monthly" fill="#fa812d" name="Monthly" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          {/* END: Patient Statistics */}

          {/* BEGIN: Investigation Status */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                {t("InvestigationStatus")}
              </h2>
            </div>

            <div className="p-5 mt-5 intro-y box">
              {/* Center the chart horizontally */}
              <div className="flex justify-center items-center h-[213px]">
                <ResponsiveContainer width={250} height={213}>
                  <PieChart>
                    <Pie
                      data={
                        total > 0
                          ? [
                              { name: "Pending", value: pendingCount },
                              { name: "Complete", value: completeCount },
                            ]
                          : [{ name: "No Data", value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {total > 0 ? (
                        <>
                          <Cell key="pending" fill="#fa812d" />
                          <Cell key="complete" fill="#6b37bd" />
                        </>
                      ) : (
                        <Cell key="no-data" fill="#e2e8f0" />
                      )}
                    </Pie>
                    {total > 0 && <Tooltip />}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mx-auto mt-8 w-52 sm:w-auto">
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-3 rounded-full bg-pending"></div>
                  <span className="truncate">{t("Pending")}</span>
                  <span className="ml-auto font-medium">
                    {getPercentage(pendingCount)}
                  </span>
                </div>
                <div className="flex items-center mt-4">
                  <div className="w-2 h-2 mr-3 rounded-full bg-primary"></div>
                  <span className="truncate">{t("Complete")}</span>
                  <span className="ml-auto font-medium">
                    {getPercentage(completeCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* END: Investigation Status */}

          {/* BEGIN: Age distribution Status */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                {t("age_distribution")}
              </h2>
            </div>
            <div className="p-5 mt-5 intro-y box">
              <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                  <Pie
                    data={
                      ageGroups.length > 0 && ageGroups.some((g) => g.value > 0)
                        ? ageGroups
                        : [{ name: "No Data", value: 1, color: "#e2e8f0" }] // light gray
                    }
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={false}
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {(ageGroups.length > 0 && ageGroups.some((g) => g.value > 0)
                      ? ageGroups
                      : [{ color: "#e2e8f0" }]
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {total > 0 && <Tooltip />}
                </PieChart>
              </ResponsiveContainer>

              <div className="mx-auto mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
                {ageGroups.map((group, i) => (
                  <div key={i} className="flex items-center min-w-0">
                    <div
                      className="flex-shrink-0 w-2 h-2 mr-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <span className="truncate">{group.name} Years old</span>
                    <span className="ml-auto font-medium">{group.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* END: Age distribution Status */}

          {/* Session List Table */}
          <div className="col-span-12 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("sessions_list")}</h2>
              <div className="relative w-full sm:w-64 ml-auto">
                <FormInput
                  type="text"
                  className="w-full pr-10 !box"
                  placeholder={t("Search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3 text-gray-400" />
              </div>
            </div>

            <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
              <Table className="border-spacing-y-[10px] border-separate mt-5">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="border-b-0 whitespace-nowrap">
                      #
                    </Table.Th>
                    <Table.Th className="border-b-0 whitespace-nowrap">
                      {t("session_name")}
                    </Table.Th>
                    <Table.Th className="border-b-0 whitespace-nowrap">
                      {t("patient_name")}
                    </Table.Th>
                    <Table.Th className="border-b-0 whitespace-nowrap">
                      {t("action")}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredactiveSessionsList.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={8} className="text-center">
                        {t("no_active_sessions_found")}
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    filteredactiveSessionsList.map((sessions, index) => (
                      <Table.Tr>
                        <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                          {indexOfFirstItem + index + 1}
                        </Table.Td>
                        <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                          {sessions.name}
                        </Table.Td>
                        <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                          {sessions.patient_name}
                        </Table.Td>
                        <Table.Td
                          className={clsx([
                            "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                            "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                          ])}
                        >
                          <div className="flex items-center">
                            {/* view patient detail button  */}
                            {/* <Link
                              to={`/patients-view/${sessions.patient}`}
                              className="flex items-center mr-3"
                            >
                              <Lucide icon="Eye" className="w-4 h-4 mr-1" />{" "}
                              {t("view")}
                            </Link> */}

                            <div
                              onClick={() => {
                                handleEndSession(sessions.id);
                              }}
                              className="flex items-center mr-3 cursor-pointer"
                            >
                              <Lucide
                                icon="MonitorX"
                                className="w-4 h-4 mr-1"
                              />
                              {t("end_session")}
                            </div>
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </div>

            {/* Pagination & Items per page */}
            {filteredactiveSessionsList.length > 0 && (
              <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4 mt-6">
                {/* Pagination */}
                <div className="flex-1">
                  <Pagination className="w-full sm:w-auto sm:mr-auto flex flex-wrap gap-1">
                    <Pagination.Link onPageChange={() => setCurrentPage(1)}>
                      <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                    </Pagination.Link>

                    <Pagination.Link
                      onPageChange={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    >
                      <Lucide icon="ChevronLeft" className="w-4 h-4" />
                    </Pagination.Link>

                    {(() => {
                      const totalPages = Math.ceil(
                        filteredactiveSessionsList.length / itemsPerPage
                      );
                      const pages = [];
                      const maxPagesToShow = 5;
                      const ellipsisThreshold = 2;

                      pages.push(
                        <Pagination.Link
                          key={1}
                          active={currentPage === 1}
                          onPageChange={() => setCurrentPage(1)}
                        >
                          1
                        </Pagination.Link>
                      );

                      if (currentPage > ellipsisThreshold + 1) {
                        pages.push(
                          <span key="ellipsis-start" className="px-3 py-2">
                            ...
                          </span>
                        );
                      }

                      for (
                        let i = Math.max(2, currentPage - ellipsisThreshold);
                        i <=
                        Math.min(
                          totalPages - 1,
                          currentPage + ellipsisThreshold
                        );
                        i++
                      ) {
                        pages.push(
                          <Pagination.Link
                            key={i}
                            active={currentPage === i}
                            onPageChange={() => setCurrentPage(i)}
                          >
                            {i}
                          </Pagination.Link>
                        );
                      }

                      if (currentPage < totalPages - ellipsisThreshold) {
                        pages.push(
                          <span key="ellipsis-end" className="px-3 py-2">
                            ...
                          </span>
                        );
                      }

                      if (totalPages > 1) {
                        pages.push(
                          <Pagination.Link
                            key={totalPages}
                            active={currentPage === totalPages}
                            onPageChange={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Pagination.Link>
                        );
                      }

                      return pages;
                    })()}

                    <Pagination.Link
                      onPageChange={() =>
                        setCurrentPage((prev) =>
                          prev <
                          Math.ceil(activeSessionsList.length / itemsPerPage)
                            ? prev + 1
                            : prev
                        )
                      }
                    >
                      <Lucide icon="ChevronRight" className="w-4 h-4" />
                    </Pagination.Link>

                    <Pagination.Link
                      onPageChange={() =>
                        setCurrentPage(
                          Math.ceil(activeSessionsList.length / itemsPerPage)
                        )
                      }
                    >
                      <Lucide icon="ChevronsRight" className="w-4 h-4" />
                    </Pagination.Link>
                  </Pagination>
                </div>

                {/* Showing entries */}
                <div className="hidden mx-auto md:block text-slate-500 text-sm">
                  {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                  {Math.min(indexOfLastItem, activeSessionsList.length)}{" "}
                  {t("of")} {activeSessionsList.length} {t("entries")}
                </div>

                {/* Items per page */}
                <div className="flex-1 flex justify-end">
                  <FormSelect
                    className="w-20 mt-3 !box sm:mt-0"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </FormSelect>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
