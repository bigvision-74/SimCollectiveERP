import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import env from "../../env";
import { getWardSesionAction } from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import { Dialog } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { t } from "i18next";

interface SessionContextData {
  isActive: boolean;
  sessionId: string | number;
  assignedRoom: string;
  wardName: string;
  startTime: string;
  duration: number | string;
  myZoneName?: string;
  myZoneColor?: string;
  myThumbnail?: string;
  allowedPatientIds: (string | number)[];
  activePatientIds: (string | number)[]; // The list of ALL patients in the session
  startedBy: number;
  startedByRole: string;
  currentId: string;
}

interface UpdateSignal {
  timestamp: number;
  patientId: string | number;
  action: "added" | "updated" | "deleted" | "requested";
  category: string;
}

interface TriggerUpdatePayload {
  patientId: string | number;
  patientName: string;
  assignedRoom: string;
  category: string;
  action: "added" | "updated" | "deleted" | "requested";
}

interface SocketContextType {
  socket: Socket | null;
  globalSession: SessionContextData | null;
  triggerPatientUpdate: (data: TriggerUpdatePayload) => void;
  lastUpdateSignal: UpdateSignal | null;
  getPatientZone: (patientId: string | number) => string | null;
  endSession: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketManager = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [globalSession, setGlobalSession] = useState<SessionContextData | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState("");
  const [patientZoneMap, setPatientZoneMap] = useState<Record<string, string>>(
    {}
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [lastUpdateSignal, setLastUpdateSignal] = useState<UpdateSignal | null>(
    null
  );

  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem("username");
  const rawRole = localStorage.getItem("role") || "user";
  const userRole = rawRole.toLowerCase();

  const parseSessionAssignments = (assignments: any) => {
    const map: Record<string, string> = {};
    let safeAssignments = assignments;
    if (typeof safeAssignments === "string") {
      try {
        safeAssignments = JSON.parse(safeAssignments);
      } catch (e) {}
    }
    const zoneSource =
      safeAssignments &&
      typeof safeAssignments === "object" &&
      "zones" in safeAssignments
        ? safeAssignments.zones
        : safeAssignments;

    if (zoneSource) {
      Object.entries(zoneSource).forEach(([key, val]: [string, any]) => {
        if (key.startsWith("zone")) {
          const zoneId = key.replace("zone", "");
          if (val.patients && Array.isArray(val.patients)) {
            val.patients.forEach((p: any) => {
              map[String(p.id)] = zoneId;
            });
          }
        }
      });
    }
    setPatientZoneMap(map);
  };

  useEffect(() => {
    if (username) {
      const newSocket = io(`${env.REACT_APP_BACKEND_URL}/ward`, {
        auth: { username },
        transports: ["websocket"],
      });
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) socket.disconnect();
      setSocket(null);
      setGlobalSession(null);
    }
  }, [username]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (username) {
        try {
          const userData = await getAdminOrgAction(String(username));
          setCurrentUserId(String(userData.uid || userData.id));
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchUserData();
  }, [username]);

  useEffect(() => {
    if (!socket) return;

    const handleStartSession = async (data: any) => {
      try {
        socket.emit("join_active_session", { sessionId: data.sessionId });
        setGlobalSession((prev) => {
          if (prev?.sessionId === data.sessionId && prev?.isActive) return prev;
          return null;
        });

        const res = await getWardSesionAction(data.sessionId);

        if (!res.success) {
          console.error("Failed to fetch session data");
          return;
        }

        const { session, ward, assignments } = res.data;

        parseSessionAssignments(assignments);

        let myZoneName = "General";
        let myZoneColor = "text-slate-700";
        let myThumbnail = localStorage.getItem("userThumbnail") || "";
        let allowedIds: (string | number)[] = [];
        let allActivePatientIds: (string | number)[] = [];

        let safeAssignments = assignments;
        if (typeof safeAssignments === "string") {
          try {
            safeAssignments = JSON.parse(safeAssignments);
          } catch (e) {
            console.error("Failed to parse assignments:", e);
            safeAssignments = { zones: {} };
          }
        }

        // --- FIXED LOGIC: EXTRACT ACTIVE PATIENT IDS ---
        // We do this OUTSIDE the user-specific room check so it populates for everyone.
        const zoneSource = safeAssignments.zones || safeAssignments;

        if (zoneSource && typeof zoneSource === "object") {
          // Iterate over "zone1", "zone2", etc.
          Object.values(zoneSource).forEach((zone: any) => {
            if (zone?.patients && Array.isArray(zone.patients)) {
              zone.patients.forEach((p: any) => {
                // Collect IDs if they exist
                if (p?.id) {
                  allActivePatientIds.push(p.id);
                }
              });
            }
          });
        }
        // ----------------------------------------------

        const zoneColors: Record<string, string> = {
          "1": "text-[#0ea5e9]",
          "2": "text-[#5b21b6]",
          "3": "text-[#fa812d]",
          "4": "text-[#fad12c]",
        };

        if (data.assignedRoom && data.assignedRoom !== "all") {
          const zoneKey = `zone${data.assignedRoom}`;
          const zoneData = zoneSource ? zoneSource[zoneKey] : undefined;

          myZoneName = `GROUP ${data.assignedRoom}`;
          myZoneColor = zoneColors[data.assignedRoom] || "text-primary";

          if (zoneData?.patients && Array.isArray(zoneData.patients)) {
            allowedIds = zoneData.patients
              .map((p: any) => p.id)
              .filter((id: any) => id != null);
          }
        } else {
          allowedIds = ["all"];
          myZoneName = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        }

        function toLocalDateTime(serverDateTime: string): string {
          const iso = serverDateTime.replace(" ", "T");
          const date = new Date(iso);

          const pad = (n: number, z: number = 2): string =>
            String(n).padStart(z, "0");

          return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
              date.getDate()
            )} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
              date.getSeconds()
            )}.` +
            `${pad(date.getMilliseconds(), 3)}`
          );
        }

        console.log(toLocalDateTime(session.start_time),"bbbbbbbbbbbbbbbbbbbbbbbbbbb")
        console.log(session.start_time,"start_timestart_timestart_timestart_time")

        setGlobalSession({
          isActive: true,
          sessionId: data.sessionId,
          assignedRoom: data.assignedRoom,
          wardName: ward?.name || "Active Session",
          startTime: session.start_time,
          duration: session.duration,
          myZoneName,
          myZoneColor,
          myThumbnail,
          allowedPatientIds: allowedIds,
          activePatientIds: allActivePatientIds, // Now populated correctly
          startedBy: Number(data.startedBy) || 0,
          startedByRole: (data.startedByRole || "").toLowerCase(),
          currentId: currentUserId,
        });

        const targetPath = `/ward-session/${data.sessionId}`;
        if (!location.pathname.startsWith(targetPath)) {
          navigate(targetPath);
        }
      } catch (error) {
        console.error("Session start error:", error);
      }
    };

    const handleEndSession = () => {
      setGlobalSession(null);
      setPatientZoneMap({});

      let redirectPath = "/";
      if (userRole === "student" || userRole === "user")
        redirectPath = "/dashboard-user";
      else if (userRole === "observer") redirectPath = "/patient-list";
      else redirectPath = "/wards";

      navigate(redirectPath, { replace: true });
    };

    const handlePatientUpdate = (data: any) => {
      setLastUpdateSignal({
        timestamp: Date.now(),
        patientId: data.patientId,
        action: data.action,
        category: data.category,
      });
      if (String(data.performedByUserId) === String(currentUserId)) return;
      setNotificationData(data);
      setIsDialogOpen(true);
    };

    socket.on("start_ward_session", handleStartSession);
    socket.on("end_ward_session", handleEndSession);
    socket.on("patient_data_updated", handlePatientUpdate);

    return () => {
      socket.off("start_ward_session", handleStartSession);
      socket.off("end_ward_session", handleEndSession);
      socket.off("patient_data_updated", handlePatientUpdate);
    };
  }, [socket, navigate, userRole, currentUserId, location.pathname]);

  // ... rest of the component (useEffect for route protection, Dialog, etc.) ...

  // (Include the rest of your existing useEffects and return statement here)
  useEffect(() => {
    if (!username) return;

    if (!socket) return;

    const currentPath = location.pathname;
    const isRestrictedPage = currentPath.startsWith("/ward-session/");

    const hasActiveSession = globalSession && globalSession.isActive;
    if (isRestrictedPage && !hasActiveSession) {
      let redirectPath = "/";
      if (userRole === "student" || userRole === "user") {
        redirectPath = "/dashboard-user";
      } else if (userRole === "observer") {
        redirectPath = "/patient-list";
      } else {
        redirectPath = "/wards";
      }

      navigate(redirectPath, { replace: true });
    }
  }, [globalSession, location.pathname, userRole, navigate, username, socket]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isDialogOpen) {
      timeoutId = setTimeout(() => {
        setIsDialogOpen(false);
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isDialogOpen]);

  const triggerPatientUpdate = (details: TriggerUpdatePayload) => {
    if (!socket || !globalSession?.isActive) return;
    const payload = {
      sessionId: globalSession.sessionId,
      performedByUserId: currentUserId,
      performerRole: userRole,
      performerName: username,
      ...details,
    };
    socket.emit("trigger_patient_update", payload);
    setLastUpdateSignal({
      timestamp: Date.now(),
      patientId: details.patientId,
      action: details.action,
      category: details.category,
    });
  };

  const endSession = useCallback(() => {
    if (socket && globalSession?.sessionId) {
      socket.emit("end_ward_session_manual", {
        sessionId: globalSession.sessionId,
      });
    }
  }, [socket, globalSession]);

  const getPatientZone = useCallback(
    (patientId: string | number) => {
      const pid = String(patientId);
      return patientZoneMap[pid] || null;
    },
    [patientZoneMap]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        globalSession,
        triggerPatientUpdate,
        lastUpdateSignal,
        getPatientZone,
        endSession,
      }}
    >
      {children}
      <Dialog
        open={isDialogOpen}
        onClose={setIsDialogOpen}
        className="z-[9999]"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white dark:bg-darkmode-600 p-6 rounded shadow-lg relative animate-fadeIn">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(false);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <Lucide icon="BellRing" className="w-6 h-6" />
              </div>

              <div className="text-center">
                <Dialog.Title className="text-lg font-semibold mb-2 inline-block">
                  {notificationData?.category}{" "}
                  {notificationData?.action === "added"
                    ? t("added")
                    : notificationData?.action === "requested"
                    ? "requested"
                    : "Updated"}
                </Dialog.Title>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-bold text-slate-800 dark:text-white">
                  {notificationData?.performerName}
                </span>{" "}
                ({notificationData?.performerRole}) has{" "}
                {notificationData?.action} a{" "}
                {notificationData?.category.toLowerCase()}.
              </p>

              {notificationData?.patientName && (
                <div className="mt-2 inline-block bg-slate-100 dark:bg-darkmode-400 border border-slate-200 dark:border-darkmode-400 px-3 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("Patient1")} {notificationData.patientName}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline-secondary"
                className="w-full"
                onClick={() => setIsDialogOpen(false)}
              >
                {t("Dismiss")}
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (
                    notificationData?.category === "Investigation" &&
                    notificationData?.action === "requested" &&
                    userRole === "faculty"
                  ) {
                    navigate(
                      `/investigations-requests/${notificationData.patientId}`
                    );
                  } else {
                    navigate(`/patients-view/${notificationData.patientId}`);
                  }

                  setIsDialogOpen(false);
                }}
              >
                {t("viewdetails")}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
