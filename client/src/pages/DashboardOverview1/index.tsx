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
import { getAllDetailsCountAction } from "@/actions/userActions";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import axios from "axios";
import { getAllPatientsAction } from "@/actions/patientActions";
import { TinySliderElement } from "@/components/Base/TinySlider";

type DashboardEntry = {
  name: string;
  count: number;
};

function Main() {
  const [salesReportFilter, setSalesReportFilter] = useState<string>();
  const [dashboardData, setdashboardData] = useState<DashboardEntry[]>([]);
  const importantNotesRef = useRef<TinySliderElement>();
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

  const [patientStats, setPatientStats] = useState<PatientStatsEntry[]>([]);

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

  const getCount = (name: string) => {
    const item = dashboardData.find((d) => d.name === name);
    return item?.count ?? 0;
  };

  useEffect(() => {
    fetchUsers();
    fetchPatientStats();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 2xl:col-span-12">
        <div className="grid grid-cols-12 gap-6">
          {/* BEGIN: General Report */}
          <div className="col-span-12 mt-8">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                General Report
              </h2>
              <a href="" className="flex items-center ml-auto text-primary">
                <Lucide icon="RefreshCcw" className="w-4 h-4 mr-3" /> Reload
                Data
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
                        Total Users
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
                        Total Organisations
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
                  <Link to="#" className="block">
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
                        Total Patients
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* END: General Report */}

          {/* BEGIN: Sales Report */}
          <div className="col-span-12 mt-8 lg:col-span-6">
            <div className="items-center block h-10 intro-y sm:flex">
              <h2 className="mr-5 text-lg font-medium truncate">
                Sales Report
              </h2>
              <div className="relative mt-3 sm:ml-auto sm:mt-0 text-slate-500">
                <Lucide
                  icon="Calendar"
                  className="absolute inset-y-0 left-0 z-10 w-4 h-4 my-auto ml-3"
                />
                <Litepicker
                  value={salesReportFilter}
                  onChange={(e) => {
                    setSalesReportFilter(e.target.value);
                  }}
                  options={{
                    autoApply: false,
                    singleMode: false,
                    numberOfColumns: 2,
                    numberOfMonths: 2,
                    showWeekNumbers: true,
                    dropdowns: {
                      minYear: 1990,
                      maxYear: null,
                      months: true,
                      years: true,
                    },
                  }}
                  className="pl-10 sm:w-56 !box"
                />
              </div>
            </div>
            <div className="p-5 mt-12 intro-y box sm:mt-5">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex">
                  <div>
                    <div className="text-lg font-medium text-primary dark:text-slate-300 xl:text-xl">
                      $15,000
                    </div>
                    <div className="mt-0.5 text-slate-500">This Month</div>
                  </div>
                  <div className="w-px h-12 mx-4 border border-r border-dashed border-slate-200 dark:border-darkmode-300 xl:mx-5"></div>
                  <div>
                    <div className="text-lg font-medium text-slate-500 xl:text-xl">
                      $10,000
                    </div>
                    <div className="mt-0.5 text-slate-500">Last Month</div>
                  </div>
                </div>
                <Menu className="mt-5 md:ml-auto md:mt-0">
                  <Menu.Button
                    as={Button}
                    variant="outline-secondary"
                    className="font-normal"
                  >
                    Filter by Category
                    <Lucide icon="ChevronDown" className="w-4 h-4 ml-2" />
                  </Menu.Button>
                  <Menu.Items className="w-40 h-32 overflow-y-auto">
                    <Menu.Item>PC & Laptop</Menu.Item>
                    <Menu.Item>Smartphone</Menu.Item>
                    <Menu.Item>Electronic</Menu.Item>
                    <Menu.Item>Photography</Menu.Item>
                    <Menu.Item>Sport</Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>
              <div
                className={clsx([
                  "relative",
                  "before:content-[''] before:block before:absolute before:w-16 before:left-0 before:top-0 before:bottom-0 before:ml-10 before:mb-7 before:bg-gradient-to-r before:from-white before:via-white/80 before:to-transparent before:dark:from-darkmode-600",
                  "after:content-[''] after:block after:absolute after:w-16 after:right-0 after:top-0 after:bottom-0 after:mb-7 after:bg-gradient-to-l after:from-white after:via-white/80 after:to-transparent after:dark:from-darkmode-600",
                ])}
              >
                <ReportLineChart height={275} className="mt-6 -mb-6" />
              </div>
            </div>
          </div>
          {/* END: Sales Report */}

          {/* BEGIN: Weekly Top Seller */}
          <div className="col-span-12 mt-8 sm:col-span-6 lg:col-span-3">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                Weekly Top Seller
              </h2>
              <a href="" className="ml-auto truncate text-primary">
                Show More
              </a>
            </div>
            <div className="p-5 mt-5 intro-y box">
              <div className="mt-3">
                <ReportPieChart height={213} />
              </div>
              <div className="mx-auto mt-8 w-52 sm:w-auto">
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-3 rounded-full bg-primary"></div>
                  <span className="truncate">17 - 30 Years old</span>
                  <span className="ml-auto font-medium">62%</span>
                </div>
                <div className="flex items-center mt-4">
                  <div className="w-2 h-2 mr-3 rounded-full bg-pending"></div>
                  <span className="truncate">31 - 50 Years old</span>
                  <span className="ml-auto font-medium">33%</span>
                </div>
                <div className="flex items-center mt-4">
                  <div className="w-2 h-2 mr-3 rounded-full bg-warning"></div>
                  <span className="truncate">&gt;= 50 Years old</span>
                  <span className="ml-auto font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
          {/* END: Weekly Top Seller */}

          {/* BEGIN: Sales Report */}
          <div className="col-span-12 mt-8 sm:col-span-6 lg:col-span-3">
            <div className="flex items-center h-10 intro-y">
              <h2 className="mr-5 text-lg font-medium truncate">
                Sales Report
              </h2>
              <a href="" className="ml-auto truncate text-primary">
                Show More
              </a>
            </div>
            <div className="p-5 mt-5 intro-y box">
              <div className="mt-3">
                <ReportDonutChart height={213} />
              </div>
              <div className="mx-auto mt-8 w-52 sm:w-auto">
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-3 rounded-full bg-primary"></div>
                  <span className="truncate">17 - 30 Years old</span>
                  <span className="ml-auto font-medium">62%</span>
                </div>
                <div className="flex items-center mt-4">
                  <div className="w-2 h-2 mr-3 rounded-full bg-pending"></div>
                  <span className="truncate">31 - 50 Years old</span>
                  <span className="ml-auto font-medium">33%</span>
                </div>
                <div className="flex items-center mt-4">
                  <div className="w-2 h-2 mr-3 rounded-full bg-warning"></div>
                  <span className="truncate">&gt;= 50 Years old</span>
                  <span className="ml-auto font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
          {/* END: Sales Report */}
        </div>

        {/* BEGIN: Patient Statistics Chart */}
         <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 mt-8 lg:col-span-6">
        <div className="col-span-12 mt-8 sm:col-span-6 lg:col-span-3">
          <div className="flex items-center h-10 intro-y">
            <h2 className="mr-5 text-lg font-medium truncate">
              Patient Statistics
            </h2>
          </div>
          <div className="p-5 mt-5 intro-y box">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patientStats}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="daily" fill="#4285F4" name="Daily" />
                <Bar dataKey="weekly" fill="#34A853" name="Weekly" />
                <Bar dataKey="monthly" fill="#FBBC05" name="Monthly" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* </div> */}
        </div>
        </div>
        </div>
        {/* END: Patient Statistics Chart */}
      </div>
    </div>
  );
}

export default Main;
