import _ from "lodash";
import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Litepicker from "@/components/Base/Litepicker";
import ReportDonutChart from "@/components/ReportDonutChart";
import ReportLineChart from "@/components/ReportLineChart";
import ReportPieChart from "@/components/ReportPieChart";
import { Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import Tippy from "@/components/Base/Tippy";
import { FormCheck, FormSelect } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import {
  getAllDetailsCountAction,
  getSubscriptionDetailsAction,
} from "@/actions/userActions";
import { Link } from "react-router-dom";
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
import dayjs from "dayjs";
import { getAllPatientsAction } from "@/actions/patientActions";
import { TinySliderElement } from "@/components/Base/TinySlider";
import { getAllTypeRequestInvestigationAction } from "@/actions/patientActions";
import { t } from "i18next";

type DashboardEntry = {
  name: string;
  count: number;
};

type SubscriptionData = {
  orgName: string;
  username: string;
  plantype: string;
  created_at: string;
  planType: string;
  purchaseOrder: string;
  status: string;
  lastLogin: string;
};

function Main() {
  const [salesReportFilter, setSalesReportFilter] = useState<string>();
  const [SubscriptionData, setSubscriptionData] = useState<SubscriptionData[]>(
    []
  );
  const [dashboardData, setdashboardData] = useState<DashboardEntry[]>([]);
  const importantNotesRef = useRef<TinySliderElement>();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading1, setLoading1] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
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
  const [ageGroups, setAgeGroups] = useState<AgeGroupData[]>([]);

  const height = 213; // Adjust as needed
  const groupColors = {
    "0-16": "#0ea5e9", // Tailwind 'info' ~ sky-500
    "17-30": "#fa812d", // Tailwind 'primary' ~ blue-500
    "31-50": "#fad12c", // Tailwind 'pending' ~ yellow-400
    "51+": "#6b37bd", // Tailwind 'warning' ~ orange-500
  };

  const ageChartData = ageGroups.map((group) => ({
    name: group.name,
    value: group.value,
  }));

  const fetchPatientStats = async () => {
    try {
      const records = await getAllPatientsAction();
      const now = dayjs();

      let daily = 0;
      let weekly = 0;
      let monthly = 0;

      records.forEach((patient: any) => {
        if (!patient.created_at) return;

        const created = dayjs(patient.created_at);

        // Daily - today
        if (created.isSame(now, "day")) {
          daily += 1;
        }

        // Weekly - same ISO week
        if (created.isSame(now, "week")) {
          weekly += 1;
        }

        // Monthly - same calendar month
        if (created.isSame(now, "month")) {
          monthly += 1;
        }
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

  const fetchUsers = async () => {
    try {
      const data = await getAllDetailsCountAction();
      setdashboardData(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscriptionData = SubscriptionData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const fetchSubscriptionDetails = async () => {
    try {
      const data1 = await getSubscriptionDetailsAction();
      setSubscriptionData(data1);
      setTotalPages(Math.ceil(data1.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getCount = (name: string) => {
    const item = dashboardData.find((d) => d.name === name);
    return item?.count ?? 0;
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function calculateEndDate(startDateString: string, planType: string) {
    const date = new Date(startDateString);

    switch (planType) {
      case "free":
        date.setMonth(date.getMonth() + 1);
        break;
      case "1 Year Licence":
        date.setFullYear(date.getFullYear() + 1);
        break;
      case "5 Year Licence":
        date.setFullYear(date.getFullYear() + 5);
        break;
    }

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // fetch all pending and complete request
  const fetchInvestigations = async () => {
    try {
      const res = await getAllTypeRequestInvestigationAction();
      setInvestigations(res);
    } catch (err) {
      console.error("Error fetching investigations:", err);
    }
  };

  // fetching all patient details for display pateint by age
  const calculateAgeDistribution = async () => {
    try {
      const patients = await getAllPatientsAction();
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

  useEffect(() => {
    fetchUsers();
    fetchPatientStats();
    fetchInvestigations();
    calculateAgeDistribution();
    fetchSubscriptionDetails();
  }, []);

  const pendingCount = investigations.filter(
    (i) => i.status === "pending"
  ).length;
  const completeCount = investigations.filter(
    (i) => i.status === "complete"
  ).length;
  const total = pendingCount + completeCount;

  const getPercentage = (count: number) =>
    total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 2xl:col-span-12">
        <div className="grid grid-cols-12 gap-6">
          {/* BEGIN: General Report */}
          <div className="col-span-12 mt-8">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                {t("GeneralReport")}
              </h2>
              <a href="" className="flex items-center ml-auto text-primary">
                <Lucide icon="RefreshCcw" className="w-4 h-4 mr-3" />
                {t("Reload")}
              </a>
            </div>
            <div className="grid grid-cols-12 gap-6 mt-5">
              <div className="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div
                  className={clsx([
                    "relative zoom-in",
                    "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                  ])}
                >
                  <Link to="/users" className="block">
                    <div className="p-5 box">
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
                        {t("TotalUsers")}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div
                  className={clsx([
                    "relative zoom-in",
                    "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                  ])}
                >
                  <Link to="/organisations" className="block">
                    <div className="p-5 box">
                      <div className="flex">
                        <Lucide
                          icon="CreditCard"
                          className="w-[28px] h-[28px] text-pending"
                        />
                      </div>
                      <div className="mt-6 text-3xl font-medium leading-8">
                        {getCount("organisations")}
                      </div>
                      <div className="mt-1 text-base text-slate-500">
                        {t("TotalOrganisations")}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div
                  className={clsx([
                    "relative zoom-in",
                    "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                  ])}
                >
                  <Link to="/patients" className="block">
                    <div className="p-5 box">
                      <div className="flex">
                        <Lucide
                          icon="ClipboardList"
                          className="w-[28px] h-[28px] text-warning"
                        />
                      </div>
                      <div className="mt-6 text-3xl font-medium leading-8">
                        {getCount("patients")}
                      </div>
                      <div className="mt-1 text-base text-slate-500">
                        {t("TotalPatients")}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* END: General Report */}

          {/* BEGIN: Statistics Row */}
          <div className="col-span-12 mt-8">
            <div className="grid grid-cols-12 gap-6">
              {/* Patient Statistics */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-6">
                <div className="flex items-center h-10 intro-y">
                  <h2 className="mr-5 text-lg font-medium truncate">
                    {t("PatientStatistics")}
                  </h2>
                </div>
                <div className="p-5 mt-5 intro-y box">
                  <div className="w-full h-[300px] focus:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={patientStats}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
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
                  </div>
                </div>
              </div>

              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <div className="flex items-center h-10 intro-y">
                  <h2 className="mr-5 text-lg font-medium truncate">
                    {t("InvestigationStatus")}
                  </h2>
                </div>
                <div className="p-5 mt-5 intro-y box">
                  {/* Responsive chart container */}
                  <div className="flex justify-center items-center h-[213px]">
                    <div
                      className="w-full"
                      style={{ height: "213px", minWidth: "250px" }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Pending", value: pendingCount },
                              { name: "Complete", value: completeCount },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell key="pending" fill="#fa812d" />
                            <Cell key="complete" fill="#6b37bd" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mx-auto mt-8 w-52 sm:w-auto">
                    <div className="flex items-center">
                      <div className="w-2 h-2 mr-3 rounded-full bg-pending"></div>
                      <span className="truncate"> {t("Pending")}</span>
                      <span className="ml-auto font-medium">
                        {getPercentage(pendingCount)}
                      </span>
                    </div>
                    <div className="flex items-center mt-4">
                      <div className="w-2 h-2 mr-3 rounded-full bg-primary"></div>
                      <span className="truncate"> {t("Complete")}</span>
                      <span className="ml-auto font-medium">
                        {getPercentage(completeCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age distribution Status  */}
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
                        data={ageGroups}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label={false}
                        stroke="#ffffff"
                        strokeWidth={3}
                      >
                        {ageGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mx-auto mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
                    {ageGroups.map((group, i) => (
                      <div key={i} className="flex items-center min-w-0">
                        <div
                          className="flex-shrink-0 w-2 h-2 mr-2 rounded-full"
                          style={{ backgroundColor: group.color }}
                        ></div>
                        <span className="truncate">
                          {group.name} {t("Yearsold")}
                        </span>
                        <span className="ml-auto font-medium">
                          {group.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END: Statistics Row */}

          {/* BEGIN: Subscription Table */}
          <div className="col-span-12 overflow-auto intro-y lg:overflow-auto organisationTable">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium">
                {t("PaymentDetails")}
              </h2>
            </div>
            <Table className="border-spacing-y-[10px] border-separate -mt-2">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="border-b-0 whitespace-nowrap">
                    #
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("name")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("org_name")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("planType")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("startDate")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("endDate")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("PurchaseOrder")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("status")}
                  </Table.Th>
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("lastLogin")}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {currentSubscriptionData.map((Subscription, key) => (
                  <Table.Tr className="intro-x">
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {key + 1}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.username}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.orgName}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.planType}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {formatDate(Subscription.created_at)}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {calculateEndDate(
                        Subscription.created_at,
                        Subscription.planType
                      )}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.purchaseOrder
                        ? Subscription.purchaseOrder
                        : "---"}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.status}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {Subscription.lastLogin ? formatDate(Subscription.lastLogin) : "---"}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
          {SubscriptionData.length > 0 && (
            <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap mt-5">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>

                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5;
                  const ellipsisThreshold = 2;

                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => handlePageChange(1)}
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
                    Math.min(totalPages - 1, currentPage + ellipsisThreshold);
                    i++
                  ) {
                    pages.push(
                      <Pagination.Link
                        key={i}
                        active={currentPage === i}
                        onPageChange={() => handlePageChange(i)}
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
                        onPageChange={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Pagination.Link>
                    );
                  }

                  return pages;
                })()}

                {/* Next Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage + 1)}
                >
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>

                {/* Last Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>

              {/* Items Per Page Selector */}
              <FormSelect
                className="w-20 mt-3 !box sm:mt-0"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
          )}
          {/* END: Subscription Table*/}
        </div>
      </div>
    </div>
  );
}

export default Main;
