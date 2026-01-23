import React, { useMemo } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { useSessionTimer } from "@/helpers/useSessionTimer";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { t } from "i18next";

const GlobalSessionBadge = () => {
  const { globalSession, endSession } = useSocket() || {};
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentUserRole = (localStorage.getItem("role") || "").toLowerCase();
  const currentUserId = globalSession?.currentId || localStorage.getItem("uid");

  const canEndSession = useMemo(() => {
    if (!globalSession) return false;

    if (currentUserRole === "admin" || currentUserRole === "superadmin")
      return true;

    if (
      currentUserRole === "faculty" &&
      globalSession.startedBy === Number(currentUserId)
    ) {
      return true;
    }

    return false;
  }, [globalSession, currentUserId, currentUserRole]);


  const { displayTime, label, isUrgent } = useSessionTimer(
    globalSession?.startTime || null,
    globalSession?.duration || 0,
    () => {
      if (canEndSession && globalSession?.isActive) {
        console.log("⏳ Timer expired on frontend. Auto-ending session...");
        endSession?.();
      }
    }
  );

  if (!globalSession?.isActive) return null;

  const assignedRoom = searchParams.get("room");
  const isFacultyView =
    currentUserRole === "admin" ||
    currentUserRole === "faculty" ||
    assignedRoom === "all";

  const handleManualEndSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    endSession?.();
  };

  // Helper to handle navigation
  const handleNavigate = () => {
    navigate(
      `/ward-session/${globalSession.sessionId}?room=${globalSession.assignedRoom}`
    );
  };

  return (
    <div className="justify-items-end">
      <div className="flex flex-wrap items-center gap-4 p-2">
        
        {/* End Session Button - Clicking this will NOT redirect */}
        {canEndSession && (
          <Button
            variant="danger"
            className="shadow-md h-10 px-4"
            onClick={handleManualEndSession}
          >
            {t("end_session")}
          </Button>
        )}

        {/* 1. User/Role Pill - Added click handler here */}
        {!isFacultyView && (
          <div 
            onClick={handleNavigate}
            className="hidden md:flex items-center px-4 py-2 bg-white dark:bg-darkmode-600 rounded-xl border border-slate-200 dark:border-darkmode-400 shadow-sm gap-3 cursor-pointer hover:shadow-md transition-all"
          >
            {globalSession.myThumbnail && (
              <img
                src={globalSession.myThumbnail}
                className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                alt="Me"
              />
            )}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {t("MyZone")}
              </div>
              <div
                className={clsx(
                  "text-lg font-extrabold leading-none mt-0.5",
                  globalSession.myZoneColor || "text-slate-700"
                )}
              >
                {globalSession.myZoneName || "Assigned"}
              </div>
            </div>
          </div>
        )}

        {/* 2. Ward & Timer Pill - Added click handler here */}
        <div 
          onClick={handleNavigate}
          className="flex items-center p-1 bg-white dark:bg-darkmode-600 rounded-xl border border-slate-200 dark:border-darkmode-400 shadow-sm cursor-pointer hover:shadow-md transition-all"
        >
          {/* Ward Info */}
          <div className="flex items-center gap-3 px-5 py-2 border-r border-dashed border-slate-200 dark:border-darkmode-400 mr-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Lucide icon="Building2" className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {t("Ward")}
              </div>
              <div className="text-base font-bold text-slate-700 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {globalSession.wardName}
              </div>
            </div>
          </div>

          {/* Highlighted Timer */}
          <div
            className={clsx(
              "flex items-center gap-3 px-5 py-2 rounded-lg shadow-md ml-1 transition-colors duration-300",
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
  );
};

export default GlobalSessionBadge;