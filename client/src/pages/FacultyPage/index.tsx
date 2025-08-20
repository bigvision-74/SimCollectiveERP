import _ from "lodash";
import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import { TinySliderElement } from "@/components/Base/TinySlider";
import Lucide from "@/components/Base/Lucide";
import ReportDonutChart from "@/components/ReportDonutChart";
import ReportPieChart from "@/components/ReportPieChart";
import { t } from "i18next";
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
        </div>
      </div>
    </div>
  );
}

export default Main;
