import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserAction } from "@/actions/userActions";
import { getOrgAction } from "@/actions/organisationAction";
import {
  getAllPatientsAction,
  getAssignedPatientsAction,
} from "@/actions/patientActions";
import { getSessionByUserIdAction } from "@/actions/sessionAction";
import { User, Building2, Mail, Search } from "lucide-react";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";
import { getAdminAllCountAction } from "@/actions/userActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import {
  getRequestInvestigationByIdAction,
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

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  category: string;
  type: string;
}

type PatientStatsEntry = {
  label: string;
  daily: number;
  weekly: number;
  monthly: number;
};

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

type DashboardEntry = {
  name: string;
  count: number;
};

type AgeGroupData = {
  name: string;
  value: number;
  color: string;
};

function Main() {
  const username = localStorage.getItem("user");

  const [user, setUser] = useState<any>({});
  const [orgProfile, setOrgProfile] = useState("");
  const [orgName, setOrgName] = useState("");
  const [organisationId, setOrgId] = useState("");
  const [patientStats, setPatientStats] = useState<PatientStatsEntry[]>([]);
  const [dashboardData, setdashboardData] = useState<DashboardEntry[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationEntry[]>(
    [],
  );
  const [ageGroups, setAgeGroups] = useState<AgeGroupData[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!username) return;

    try {
      const userData = await getUserAction(username);
      setUser(userData);

      if (userData.organisation_id) {
        const orgData = await getOrgAction(parseInt(userData.organisation_id));
        setOrgProfile(orgData.organisation_icon || "");
        setOrgName(orgData.name);
        setOrgId(orgData.organisation_id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

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

  const fetchSessionStats = async () => {
    try {
      const userEmail = localStorage.getItem("user") || "";
      if (!userEmail) return;

      const org = await getAdminOrgAction(userEmail);
      const userId = org.id;

      const records = await getSessionByUserIdAction(userId);

      const formattedData = records.map((item: any) => ({
        month: dayjs(item.month).format("MMM YYYY"), // Dec 2025
        sessionCount: item.sessionCount || 0,
        wardSessionCount: item.wardSessionCount || 0,
      }));

      setPatientStats(formattedData);
    } catch (err) {
      console.error("Error fetching session stats", err);
    }
  };

  // fetch all pending and complete request
  const fetchInvestigations = async () => {
    try {
      const userEmail = localStorage.getItem("user") || "";
      if (!userEmail) return;

      const org = await getAdminOrgAction(userEmail);
      const userId = org.id;
      const res = await getRequestInvestigationByIdAction(userId);
      console.log("Investigations fetched:", res);
      setInvestigations(res.investigations);
    } catch (err) {
      console.error("Error fetching investigations:", err);
    }
  };

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
        },
      );

      setAgeGroups(formatted);
    } catch (err) {
      console.error("Error calculating age groups", err);
    }
  };

  // THIS IS USE FOR DISPLAY COMPLEET OR PENDING DATA IN PERCENTAGE  Investigation Status
  const pendingCount = investigations.filter(
    (i) => i.status === "pending",
  ).length;
  const completeCount = investigations.filter(
    (i) => i.status === "complete",
  ).length;
  const total = pendingCount + completeCount;

  const getPercentage = (count: number) =>
    total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";

  useEffect(() => {
    fetchUsers();
    fetchSessionStats();
    fetchInvestigations();
    calculateAgeDistribution();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      {/* User Card */}
      {/* User Card - Responsive */}
      {/* <div className="col-span-12 sm:col-span-12">
        <div className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-white floating-left">
          {user.fname}
        </div>
      </div> */}
      <div className="col-span-12 sm:col-span-6 mt-5">
        <div className="bg-white dark:bg-darkmode-600 rounded-xl shadow p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-gray-300 shadow">
            <img
              src={
                user.user_thumbnail
                  ? user.user_thumbnail?.startsWith("http")
                    ? user.user_thumbnail
                    : `/images/${user.user_thumbnail || "default-user.png"}`
                  : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
              }
              alt="User"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/default-user.png")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="truncate">
                {user.fname} {user.lname}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 flex items-center truncate">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="truncate">
                {user.isTempMail == "1" ? "---" : user.uemail}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Card - Responsive */}
      <div className="col-span-12 sm:col-span-6 mt-5">
        <div className="bg-white dark:bg-darkmode-600 rounded-xl shadow p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-gray-300 shadow">
            <img
              src={
                orgProfile
                  ? orgProfile?.startsWith("http")
                    ? orgProfile
                    : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${orgProfile}`
                  : "https://insightxr.s3.eu-west-2.amazonaws.com/image/KXyX-4KFD-SICCode6512Companies_OperatorsofNonresidentialBuildingsCompanies.png"
              }
              alt="Org"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/default-org.png")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="truncate">{orgName || "Loading..."}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              {t("organisation_id")}: {organisationId}
            </div>
          </div>
        </div>
      </div>

      {/* BEGIN: Patient Statistics */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-6 mt-5">
        <div className="flex items-center h-10 intro-y">
          <h2 className="mr-5 text-lg font-medium truncate">
            {t("sessionsStats")}
          </h2>
        </div>
        <div className="p-5 mt-5 rounded-lg bg-white shadow-md intro-y">
          <div className="w-full h-[300px]">
            {patientStats.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                {t("Nosessionsvailable")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={patientStats}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessionCount" fill="#6b37bd" name="Sessions" />
                  <Bar
                    dataKey="wardSessionCount"
                    fill="#fa812d"
                    name="Ward Sessions"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      {/* END: Patient Statistics */}

      {/* BEGIN: Investigation Status */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 mt-5">
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
                {pendingCount}
              </span>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-2 h-2 mr-3 rounded-full bg-primary"></div>
              <span className="truncate">{t("Complete")}</span>
              <span className="ml-auto font-medium">
                {completeCount}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* END: Investigation Status */}

      {/* BEGIN: Age distribution Status */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 mt-5">
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
    </div>
  );
}

export default Main;
