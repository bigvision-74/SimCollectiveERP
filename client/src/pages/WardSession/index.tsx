import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { getWardSesionAction } from "@/actions/patientActions";
import { useSocket } from "@/contexts/SocketContext";
import { useSessionTimer } from "@/helpers/useSessionTimer";
import { t } from "i18next";

interface Patient {
  id: number;
  name: string;
  gender: string;
  date_of_birth: string;
  mrn?: string;
  category?: string;
  scenario_location?: string;
}

interface User {
  id: number;
  fname: string;
  lname: string;
  user_thumbnail: string;
}

interface Zone {
  id: string;
  key: string;
  name: string;
  headerColor: string;
  lightColor: string;
  textColor: string;
  borderColor: string;
  assignedUser: User | null;
  patients: Patient[];
  disabled: boolean;
}

const WardSession = () => {
  const navigate = useNavigate();

  const { globalSession, endSession } = useSocket() || {};

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = Number(globalSession?.currentId);
  const currentUserRole = (localStorage.getItem("role") || "").toLowerCase();

  const zoneConfigs = useMemo(
    () => ({
      zone1: {
        id: "1",
        name: "GROUP 1",
        headerColor: "bg-[#0ea5e9]",
        borderColor: "border-[#0ea5e9]",
        lightColor: "bg-[#0ea5e9]/10",
        textColor: "text-[#0ea5e9]",
      },
      zone2: {
        id: "2",
        name: "GROUP 2",
        headerColor: "bg-[#5b21b6]",
        borderColor: "border-[#5b21b6]",
        lightColor: "bg-[#5b21b6]/10",
        textColor: "text-[#5b21b6]",
      },
      zone3: {
        id: "3",
        name: "GROUP 3",
        headerColor: "bg-[#fa812d]",
        borderColor: "border-[#fa812d]",
        lightColor: "bg-[#fa812d]/10",
        textColor: "text-[#fa812d]",
      },
      zone4: {
        id: "4",
        name: "GROUP 4",
        headerColor: "bg-[#fad12c]",
        borderColor: "border-[#fad12c]",
        lightColor: "bg-[#fad12c]/10",
        textColor: "text-[#fad12c]",
      },
    }),
    []
  );

  useEffect(() => {
    if (!globalSession?.sessionId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const response = await getWardSesionAction(
          String(globalSession.sessionId)
        );

        if (response.success && response.data) {
          const { assignments } = response.data;

          let safeAssignments = assignments;
          if (typeof safeAssignments === "string") {
            try {
              safeAssignments = JSON.parse(safeAssignments);
            } catch (e) {}
          }

          const zoneSource = safeAssignments.zones
            ? safeAssignments.zones
            : safeAssignments;

          const constructedZones: Zone[] = Object.entries(zoneConfigs).map(
            ([key, config]) => {
              const zoneData = zoneSource[key];
              const hasUser =
                zoneData?.user && zoneData.user.id !== "unassigned";

              return {
                ...config,
                key: key,
                assignedUser: zoneData?.user || null,
                patients: zoneData?.patients || [],
                disabled: !hasUser,
              };
            }
          );
          console.log(constructedZones, "ddddddddd");

          setZones(constructedZones);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [globalSession, zoneConfigs]);

  const { displayTime, label, isUrgent } = useSessionTimer(
    globalSession?.startTime || null,
    globalSession?.duration || 0,
    () => {
      if (canEndSession && globalSession?.isActive) {
        endSession?.();
      }
    }
  );

  const canEndSession = useMemo(() => {
    if (!globalSession) return false;
    const { startedBy } = globalSession;

    if (currentUserRole === "admin") return true;

    if (currentUserRole === "faculty" && startedBy === currentUserId) {
      return true;
    }

    return false;
  }, [globalSession, currentUserId, currentUserRole]);

  const handleEndSession = () => {
    endSession?.();
  };

  const getAgeDisplay = (dob: string | undefined) => {
    if (!dob) return "N/A";
    if (dob.length <= 3 && !isNaN(Number(dob))) return `${dob} Yrs`;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return dob;
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return `${Math.abs(ageDate.getUTCFullYear() - 1970)} Yrs`;
  };

  if (!globalSession || loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        {loading ? t("LoadingSessionData") : t("WaitingforSession")}
      </div>
    );
  }

  const isFacultyView =
    currentUserRole === "admin" ||
    currentUserRole === "faculty" ||
    globalSession.assignedRoom === "all";

  const zonesToRender = isFacultyView
    ? zones
    : zones.filter((z) => z.id === globalSession.assignedRoom);

  return (
    <div className="intro-y h-[calc(100vh-100px)] flex flex-col p-6">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {t("LiveSession")}
          </h2>
        </div>

        <div className="flex flex-wrap justify-center xl:justify-end items-center gap-4">
          {canEndSession && (
            <Button
              variant="danger"
              className="shadow-md"
              onClick={handleEndSession}
            >
              {t("end_session")}
            </Button>
          )}

          {!isFacultyView && zonesToRender[0] && (
            <div className="hidden md:flex items-center px-6 py-2 bg-white dark:bg-darkmode-600 rounded-xl border border-slate-200 dark:border-darkmode-400 shadow-sm gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {t("MyZone")}
                </div>
                <div
                  className={clsx(
                    "text-lg font-extrabold leading-none mt-0.5",
                    zonesToRender[0].textColor
                  )}
                >
                  {zonesToRender[0].name}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center p-1 bg-white dark:bg-darkmode-600 rounded-xl border border-slate-200 dark:border-darkmode-400 shadow-sm">
            <div className="flex items-center gap-3 px-5 py-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Lucide icon="Building2" className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {t("Ward")}
                </div>
                <div className="text-base font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {globalSession.wardName}
                </div>
              </div>
            </div>

            <div
              className={clsx(
                "flex items-center gap-3 px-5 py-2 rounded-lg shadow-md ml-2 transition-colors duration-300",
                "bg-danger"
              )}
            >
              <div className="text-white">
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                  {label}
                </div>
                <div className="text-lg font-bold font-mono leading-none tracking-wide">
                  {displayTime}
                </div>
              </div>
              <Lucide icon="Clock" className="w-5 h-5 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isFacultyView ? (
          <FacultyLayout
            zones={zonesToRender}
            navigate={navigate}
            getAge={getAgeDisplay}
          />
        ) : (
          <StudentLayout
            patients={zonesToRender[0]?.patients || []}
            navigate={navigate}
            getAge={getAgeDisplay}
            zoneColor={zonesToRender[0]?.textColor}
            zoneBorder={zonesToRender[0]?.borderColor}
            headerColor={zonesToRender[0]?.headerColor}
            textColor={zonesToRender[0]?.textColor}
            lightColor={zonesToRender[0]?.lightColor}
          />
        )}
      </div>
    </div>
  );
};

interface StudentLayoutProps {
  patients: Patient[];
  navigate: any;
  getAge: (dob: string) => string;
  zoneColor?: string;
  zoneBorder?: string;
  headerColor?: string;
  textColor?: string;
  lightColor?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({
  patients,
  navigate,
  getAge,
  zoneBorder,
  headerColor,
  lightColor,
  textColor,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
      {patients.length === 0 && (
        <div className="col-span-3 flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <Lucide icon="BedDouble" className="w-10 h-10 mb-2 opacity-50" />
          <span>{t("Nopatientsassignedtoyourzone.")}</span>
        </div>
      )}

      {patients.map((patient, index) => (
        <div
          key={patient.id}
          className={clsx(
            "intro-y relative flex flex-col bg-white dark:bg-darkmode-600 rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md",
            zoneBorder
              ? zoneBorder.replace("border-", "border-l-4 border-")
              : "border-slate-200"
          )}
        >
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {t("Bed")} {index + 1}
                </div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                  {patient.name}
                </h3>
              </div>
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border border-slate-100",
                  textColor,
                  lightColor
                )}
              >
                <Lucide icon="User" className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-slate-500 text-sm">
                <Lucide
                  icon="Calendar"
                  className="w-3.5 h-3.5 mr-2 opacity-70"
                />
                {getAge(patient.date_of_birth)} • {patient.gender}
              </div>
              <div className="flex items-center text-slate-500 text-sm">
                <Lucide
                  icon="Activity"
                  className="w-3.5 h-3.5 mr-2 opacity-70"
                />
                {patient.category || "General"}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 dark:bg-darkmode-700/50 border-t border-slate-100 dark:border-darkmode-500 flex justify-end">
            <Button
              className={clsx(
                "text-white border-slate-200 shadow-sm",
                headerColor
              )}
              onClick={() => navigate(`/patients-view/${patient.id}`)}
            >
              {t("View")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface FacultyLayoutProps {
  zones: Zone[];
  navigate: any;
  getAge: (dob: string) => string;
}

const FacultyLayout: React.FC<FacultyLayoutProps> = ({
  zones,
  navigate,
  getAge,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-full pb-10">
      {zones.map((zone) => (
        <div
          key={zone.id}
          className={clsx(
            "flex flex-col h-full min-h-[400px] border-2 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300",
            zone.borderColor,
            zone.disabled && "opacity-40"
          )}
        >
          <div
            className={clsx(
              "px-3 py-2 text-white font-bold flex justify-between items-center shadow-sm",
              zone.headerColor
            )}
          >
            <span className="text-base tracking-wide">{zone.name}</span>
            <Lucide icon="UsersRound" className="w-5 h-5 opacity-80" />
          </div>

          <div
            className={clsx(
              "px-3 py-2 border-b border-slate-100 flex items-center",
              zone.lightColor
            )}
          >
            <div className="w-10 h-10 flex-none image-fit mr-3 border-2 border-white rounded-full shadow-sm">
              <img
                alt="User"
                className="rounded-full"
                src={
                  zone.assignedUser?.user_thumbnail
                    ? zone.assignedUser.user_thumbnail
                    : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                }
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-slate-800 text-sm truncate">
                {String(zone.assignedUser?.id) !== "unassigned" &&
                zone.assignedUser?.fname &&
                zone.assignedUser?.lname
                  ? `${zone.assignedUser.fname} ${zone.assignedUser.lname}`
                  : "Unassigned"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">
                {t("Students")}
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-3 bg-slate-50/30">
            {zone.patients.map((patient, index) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients-view/${patient.id}`)}
                className="group relative cursor-pointer bg-white dark:bg-darkmode-600 p-3 rounded-md shadow-sm border border-slate-200 dark:border-darkmode-400 transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate pr-2 group-hover:text-primary transition-colors">
                    {patient.name}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {t("Bed")}-{index + 1}
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex flex-col gap-0.5 mb-1">
                  <span>
                    {getAge(patient.date_of_birth)} • {patient.gender}
                  </span>
                </div>

                <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-2 group-hover:pt-2 group-hover:border-t group-hover:border-dashed group-hover:border-slate-100 transition-all duration-300">
                  <div className="flex items-center justify-center text-xs font-medium text-primary">
                    {t("ViewPatient")}
                  </div>
                </div>
              </div>
            ))}

            {[...Array(Math.max(0, 3 - zone.patients.length))].map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-12 border-dashed border rounded-lg flex items-center justify-center bg-white/50",
                  zone.borderColor.replace("border-", "border-")
                )}
              >
                <span
                  className={clsx(
                    "text-xs font-medium opacity-60",
                    zone.textColor
                  )}
                >
                  {t("EmptyBed")}-{zone.patients.length + i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WardSession;
