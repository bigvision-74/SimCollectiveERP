import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import clsx from "clsx";
import { WardData, PatientDetail } from "../WardDetails";
import { t } from "i18next";
import { startWardSessionAction } from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";

interface SessionSetupProps {
  wardData: WardData;
  onCancel: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ wardData, onCancel }) => {
  // --- State: Alert Dialog ---
  const [alertData, setAlertData] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  // --- State: Duration ---
  const [selectedDuration, setSelectedDuration] = useState<number | string>("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    null
  );
  const [localDateTimeString, setLocalDateTimeString] = useState("");

  // --- State: Assignments ---
  const [assignments, setAssignments] = useState<{
    [key: string]: PatientDetail[];
  }>({
    unassigned: [...wardData.patients],
    zone1: [],
    zone2: [],
    zone3: [],
    zone4: [],
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);

  const zonesConfig = [
    {
      id: "zone1" as const,
      name: "GROUP 1",
      headerColor: "bg-[#0ea5e9]",
      borderColor: "border-[#0ea5e9]",
      lightColor: "bg-[#0ea5e9]/10",
      hoverColor: "bg-[#0ea5e9]/20",
      textColor: "text-[#0ea5e9]",
      userIndex: 0,
    },
    {
      id: "zone2" as const,
      name: "GROUP 2",
      headerColor: "bg-[#5b21b6]",
      borderColor: "border-[#5b21b6]",
      lightColor: "bg-[#5b21b6]/10",
      hoverColor: "bg-[#5b21b6]/20",
      textColor: "text-[#5b21b6]",
      userIndex: 1,
    },
    {
      id: "zone3" as const,
      name: "GROUP 3",
      headerColor: "bg-[#fa812d]",
      borderColor: "border-[#fa812d]",
      lightColor: "bg-[#fa812d]/10",
      hoverColor: "bg-[#fa812d]/20",
      textColor: "text-[#fa812d]",
      userIndex: 2,
    },
    {
      id: "zone4" as const,
      name: "GROUP 4",
      headerColor: "bg-[#fad12c]",
      borderColor: "border-[#fad12c]",
      lightColor: "bg-[#fad12c]/10",
      hoverColor: "bg-[#fad12c]/20",
      textColor: "text-[#fad12c]",
      userIndex: 3,
    },
  ];

  type AssignmentKey = keyof typeof assignments;

  const durationOptions = [
    { label: "15 Mins", value: 15 },
    { label: "30 Mins", value: 30 },
    { label: "60 Mins", value: 60 },
    { label: "Unlimited", value: "unlimited" },
  ];

  const canStart = selectedDuration !== "";

  // Helper: Format Date to YYYY-MM-DDTHH:mm string
  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper: Get minimum valid date (Now + 61 minutes)
  const getMinDateTimeForInput = () => {
    const now = new Date();
    // Add 61 minutes to enforce "above 60 mins" rule
    const minTime = new Date(now.getTime() + 61 * 60 * 1000);
    return formatForInput(minTime);
  };

  // Calculate duration when date/time is selected
  useEffect(() => {
    if (selectedDateTime) {
      const now = new Date();
      const diffInMs = selectedDateTime.getTime() - now.getTime();
      const diffInMinutes = Math.max(0, Math.floor(diffInMs / (1000 * 60)));
      setCalculatedDuration(diffInMinutes);
    }
  }, [selectedDateTime]);

  const handleDurationChange = (value: string | number) => {
    if (value === "unlimited") {
      setShowCalendar(true);
      setSelectedDuration("unlimited");

      // Default selection to Now + 61 minutes so initial state is valid
      const now = new Date();
      const minDate = new Date(now.getTime() + 61 * 60 * 1000);

      setLocalDateTimeString(formatForInput(minDate));
      setSelectedDateTime(minDate);
    } else {
      setShowCalendar(false);
      setSelectedDateTime(null);
      setCalculatedDuration(null);
      setLocalDateTimeString("");
      setSelectedDuration(Number(value));
    }
  };

  const handleDateTimeChange = (dateString: string) => {
    setLocalDateTimeString(dateString);
    if (dateString) {
      const [datePart, timePart] = dateString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      setSelectedDateTime(localDate);
    } else {
      setSelectedDateTime(null);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to safely access zone by index
  const getZoneId = (index: number): AssignmentKey => {
    const zones: AssignmentKey[] = ["zone1", "zone2", "zone3", "zone4"];
    return zones[index] || "zone1";
  };

  // const handleAutoAssign = () => {
  //   const patients = [...wardData.patients];
  //   const newAssignments = {
  //     unassigned: [] as PatientDetail[],
  //     zone1: [] as PatientDetail[],
  //     zone2: [] as PatientDetail[],
  //     zone3: [] as PatientDetail[],
  //     zone4: [] as PatientDetail[],
  //   };

  //   patients.forEach((patient, index) => {
  //     const zoneIndex = Math.floor(index / 3) % 4;
  //     let zoneId: keyof typeof newAssignments;

  //     switch (zoneIndex) {
  //       case 0:
  //         zoneId = "zone1";
  //         break;
  //       case 1:
  //         zoneId = "zone2";
  //         break;
  //       case 2:
  //         zoneId = "zone3";
  //         break;
  //       case 3:
  //         zoneId = "zone4";
  //         break;
  //       default:
  //         zoneId = "zone1";
  //     }

  //     if (newAssignments[zoneId].length < 3) {
  //       newAssignments[zoneId].push(patient);
  //     } else {
  //       const zones: Array<keyof typeof newAssignments> = [
  //         "zone1",
  //         "zone2",
  //         "zone3",
  //         "zone4",
  //       ];
  //       for (let i = 0; i < 4; i++) {
  //         const nextZoneIndex = (zoneIndex + i) % 4;
  //         const nextZoneId = zones[nextZoneIndex];
  //         if (newAssignments[nextZoneId].length < 3) {
  //           newAssignments[nextZoneId].push(patient);
  //           break;
  //         }
  //       }
  //     }
  //   });
  //   setAssignments(newAssignments);
  // };

  const handleAutoAssign = () => {
    const patients = [...wardData.patients];

    const enabledZones = zonesConfig
      .filter((zone) => {
        const assignedUser = wardData.users[zone.userIndex];
        return !!assignedUser;
      })
      .map((zone) => zone.id);

    const newAssignments = {
      unassigned: [] as PatientDetail[],
      zone1: [] as PatientDetail[],
      zone2: [] as PatientDetail[],
      zone3: [] as PatientDetail[],
      zone4: [] as PatientDetail[],
    };

    if (enabledZones.length === 0) {
      newAssignments.unassigned = patients;
      setAssignments(newAssignments);
      return;
    }

    let zonePointer = 0;
    const MAX_PER_ZONE = 3;

    patients.forEach((patient) => {
      let assigned = false;

      for (let i = 0; i < enabledZones.length; i++) {
        const zoneId = enabledZones[zonePointer % enabledZones.length];

        if (newAssignments[zoneId].length < MAX_PER_ZONE) {
          newAssignments[zoneId].push(patient);
          assigned = true;
          zonePointer++;
          break;
        }

        zonePointer++;
      }

      if (!assigned) {
        newAssignments.unassigned.push(patient);
      }
    });

    setAssignments(newAssignments);
  };

  const handleClearAll = () => {
    // Gather all patients currently in zones
    const patientsInZones: PatientDetail[] = [];

    zonesConfig.forEach((zone) => {
      patientsInZones.push(...assignments[zone.id]);
    });

    // Append them to the existing unassigned patients
    setAssignments((prev) => ({
      unassigned: [...prev.unassigned, ...patientsInZones],
      zone1: [],
      zone2: [],
      zone3: [],
      zone4: [],
    }));
  };

  const handleClearZone = (zoneId: AssignmentKey) => {
    if (assignments[zoneId].length === 0) return;
    setAssignments((prev) => ({
      ...prev,
      unassigned: [...prev.unassigned, ...prev[zoneId]],
      [zoneId]: [],
    }));
  };

  const handleDragStart = (e: React.DragEvent, patientId: string) => {
    e.dataTransfer.setData("patientId", patientId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(patientId);
  };

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    if (targetZoneId !== zoneId) {
      setTargetZoneId(zoneId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    const patientId = e.dataTransfer.getData("patientId");

    setDraggingId(null);
    setTargetZoneId(null);

    if (!patientId) return;

    if (
      targetZone !== "unassigned" &&
      assignments[targetZone as AssignmentKey].length >= 3
    ) {
      setAlertData({
        isOpen: true,
        title: "Action Denied",
        message: "This zone is full (Max 3 patients).",
      });
      return;
    }

    let sourceZone: AssignmentKey | "unassigned" = "unassigned";
    let patientObj: PatientDetail | undefined;

    Object.keys(assignments).forEach((key) => {
      const found = assignments[key as AssignmentKey].find(
        (p) => String(p.id) === String(patientId)
      );
      if (found) {
        sourceZone = key as AssignmentKey;
        patientObj = found;
      }
    });

    if (!patientObj || sourceZone === targetZone) return;

    setAssignments((prev) => {
      const newSourceList = prev[sourceZone].filter(
        (p) => String(p.id) !== String(patientId)
      );
      const newTargetList = [...prev[targetZone as AssignmentKey], patientObj!];
      return {
        ...prev,
        [sourceZone]: newSourceList,
        [targetZone]: newTargetList,
      };
    });
  };

  const handleStartSession = async () => {
    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));

    if (selectedDuration === "") return;

    let finalDuration = selectedDuration;
    if (selectedDuration === "unlimited") {
      // Validate > 60 mins
      if (
        !selectedDateTime ||
        !calculatedDuration ||
        calculatedDuration <= 60
      ) {
        setAlertData({
          isOpen: true,
          title: "Invalid Duration",
          message:
            "For unlimited sessions, please select a time more than 60 minutes from now.",
        });
        return;
      }
      finalDuration = calculatedDuration;
    }

    const formattedAssignments: Record<string, any> = {};

    if (wardData.faculty?.id)
      formattedAssignments["faculty"] = [wardData.faculty.id];
    if (wardData.observer?.id)
      formattedAssignments["Observer"] = [wardData.observer.id];

    zonesConfig.forEach((zone) => {
      const assignedUser = wardData.users[zone.userIndex];
      const userId = assignedUser ? assignedUser.id : "unassigned";
      const patientIds = assignments[zone.id].map((patient) => patient.id);
      formattedAssignments[zone.id] = {
        userId: userId,
        patientIds: patientIds,
      };
    });

    const payload = {
      currentUser: userData.id,
      wardId: wardData.id,
      duration: finalDuration,
      assignments: formattedAssignments,
    };

    try {
      await startWardSessionAction(payload);
    } catch (error) {
      console.log("Error starting ward session: ", error);
    }
  };

  const totalAssigned = zonesConfig.reduce(
    (total, zone) => total + assignments[zone.id].length,
    0
  );

  const hasAssignedPatient = totalAssigned > 0;

  const isStartDisabled =
    !canStart ||
    !hasAssignedPatient ||
    (selectedDuration === "unlimited" &&
      (!selectedDateTime ||
        (calculatedDuration !== null && calculatedDuration <= 60)));

  return (
    <>
      <div className="intro-y flex flex-col p-3 md:p-5 mt-5 min-h-screen lg:h-[calc(100vh-100px)]">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 relative">
          <div className="w-full lg:w-auto flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">{t("setup")}</h2>
              <div className="text-xs text-slate-500 mt-1">
                {t("Dragpatients")}
              </div>
            </div>
          </div>

          {/* Info Pill */}
          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 lg:flex items-center px-4 py-3 lg:px-6 lg:py-2 bg-white dark:bg-darkmode-600 rounded-xl border border-slate-200 dark:border-darkmode-400 shadow-sm gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Lucide icon="Building2" className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {t("Ward")}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {wardData.name}
                </div>
              </div>
            </div>

            <div className="hidden lg:block h-6 w-px bg-slate-100 dark:bg-darkmode-400"></div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={
                    wardData.faculty?.user_thumbnail
                      ? wardData.faculty.user_thumbnail
                      : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                  }
                  alt="Faculty"
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {t("faculty")}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {wardData.faculty
                    ? `${wardData.faculty.fname} ${wardData.faculty.lname}`
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="hidden lg:block h-6 w-px bg-slate-100 dark:bg-darkmode-400"></div>

            <div className="flex items-center gap-3">
              <img
                src={
                  wardData.observer?.user_thumbnail
                    ? wardData.observer.user_thumbnail
                    : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                }
                alt="Observer"
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover grayscale opacity-80 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {t("Observer")}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {wardData.observer
                    ? `${wardData.observer.fname} ${wardData.observer.lname}`
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons & Duration */}
          <div className="flex flex-wrap w-full lg:w-auto items-center gap-3 justify-end">
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedDuration}
                onChange={(e) =>
                  handleDurationChange(
                    e.target.value === "unlimited"
                      ? "unlimited"
                      : Number(e.target.value)
                  )
                }
                className="w-full sm:w-auto appearance-none border border-slate-200 dark:border-darkmode-400 rounded-md px-4 py-2.5 pr-10 bg-white dark:bg-darkmode-600 text-slate-700 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-darkmode-500 min-w-[140px]"
              >
                <option
                  value=""
                  disabled
                  className="text-slate-400 dark:text-slate-500"
                >
                  Duration...
                </option>
                {durationOptions.map((opt) => (
                  <option key={opt.label} value={opt.value} className="py-2">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {showCalendar && (
              <div className="absolute z-50 mt-2 top-full right-0 bg-white dark:bg-darkmode-700 rounded-lg shadow-xl border border-slate-200 dark:border-darkmode-600 p-4 w-full sm:w-[320px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">
                    Select End Date & Time
                  </h3>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setShowCalendar(false);
                      setSelectedDuration("");
                      setSelectedDateTime(null);
                      setLocalDateTimeString("");
                    }}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={localDateTimeString}
                    onChange={(e) => handleDateTimeChange(e.target.value)}
                    min={getMinDateTimeForInput()}
                    onKeyDown={(e) => e.preventDefault()} // Disable typing
                    // --- CHANGED: Added cursor-pointer and onClick handler ---
                    className="w-full border border-slate-300 dark:border-darkmode-400 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    onClick={(e) => {
                      try {
                        if ("showPicker" in e.currentTarget) {
                          e.currentTarget.showPicker();
                        }
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Click the box to select. Must be {">"} 60 mins from now.
                  </div>
                </div>

                {selectedDateTime && (
                  <div className="p-3 bg-slate-50 dark:bg-darkmode-800 rounded-md mb-3">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-bold">
                        {formatDateTime(selectedDateTime)}
                      </span>
                      {calculatedDuration !== null && (
                        <div
                          className={clsx(
                            "text-xs mt-1",
                            calculatedDuration <= 60
                              ? "text-danger"
                              : "text-slate-500"
                          )}
                        >
                          Duration: {calculatedDuration} mins{" "}
                          {calculatedDuration <= 60 &&
                            "(Duration must be more than 60 mins)"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setShowCalendar(false);
                      setSelectedDuration("");
                      setSelectedDateTime(null);
                      setLocalDateTimeString("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={
                      !selectedDateTime ||
                      (calculatedDuration !== null && calculatedDuration <= 60)
                    }
                    onClick={() => {
                      if (
                        selectedDateTime &&
                        calculatedDuration &&
                        calculatedDuration > 60
                      )
                        setShowCalendar(false);
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline-secondary"
                onClick={onCancel}
                className="bg-white shadow-sm flex-1 sm:flex-none justify-center"
              >
                {t("cancel")}
              </Button>

              <div className="relative group flex-1 sm:flex-none">
                <Button
                  variant="primary"
                  disabled={isStartDisabled}
                  onClick={handleStartSession}
                  className={clsx(
                    "shadow-md w-full justify-center transition-all duration-200",
                    isStartDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-lg hover:scale-105"
                  )}
                >
                  {t("Start")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="box flex flex-col lg:flex-row flex-1 overflow-hidden border border-slate-200 dark:border-darkmode-400 shadow-sm rounded-lg">
          {/* Left: Unassigned List */}
          <div
            className={clsx(
              "flex flex-col border-r border-slate-200 dark:border-darkmode-400 transition-colors duration-300",
              "w-full lg:w-64 xl:w-72 shrink-0",
              "h-96 lg:h-auto",
              targetZoneId === "unassigned"
                ? "bg-slate-100 dark:bg-darkmode-700"
                : "bg-slate-50/50 dark:bg-darkmode-800"
            )}
            onDragOver={(e) => handleDragOver(e, "unassigned")}
            onDrop={(e) => handleDrop(e, "unassigned")}
          >
            <>
              <div className="p-4 border-b border-slate-200 dark:border-darkmode-400 font-medium flex items-center justify-between sticky top-0 bg-inherit z-10">
                <span>{t("PatientsList")}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                    {assignments.unassigned.length}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 px-4 py-2 justify-between shrink-0">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAutoAssign}
                  disabled={assignments.unassigned.length === 0}
                  className="text-xs py-1 px-2 h-7"
                >
                  <Lucide icon="Users" className="w-3 h-3 mr-1" />
                  Auto Assign
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={totalAssigned === 0}
                  className="text-xs py-1 px-2 h-7"
                >
                  <Lucide icon="Trash2" className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
              {assignments.unassigned.map((patient) => (
                <DraggableCard
                  key={patient.id}
                  patient={patient}
                  isDragging={draggingId === String(patient.id)}
                  onDragStart={handleDragStart}
                />
              ))}
              {assignments.unassigned.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[100px]">
                  <Lucide
                    icon="CheckCircle"
                    className="w-10 h-10 mb-2 opacity-50"
                  />
                  <span className="text-xs">{t("Allassigned")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Zones Grid */}
          <div className="flex-1 bg-white dark:bg-darkmode-600 p-4 lg:p-6 overflow-y-auto min-h-[500px] lg:min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6 h-full pb-10">
              {zonesConfig.map((zone) => {
                const assignedUser = wardData.users[zone.userIndex];
                const isDisabled = !!assignedUser;
                const isHovered = targetZoneId === zone.id && !isDisabled;
                const isFull = assignments[zone.id].length >= 0;
                const hasPatients = assignments[zone.id].length > 0;
                console.log(assignedUser, "assignedUserassignedUser");
                console.log(isDisabled, "tesssssssssss");
                return (
                  <div
                    key={zone.id}
                    onDragOver={(e) => isDisabled && handleDragOver(e, zone.id)}
                    onDrop={(e) => isDisabled && handleDrop(e, zone.id)}
                    className={clsx(
                      "flex flex-col h-auto lg:h-full min-h-[300px] border-2 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300 ease-in-out relative group",
                      zone.borderColor,
                      isHovered &&
                        clsx(
                          zone.borderColor.replace("border-", "ring-"),
                          "ring-2 ring-offset-2"
                        ),
                      !isDisabled &&
                        "opacity-60 cursor-not-allowed pointer-events-none",
                      isFull && isHovered && "opacity-80 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={clsx(
                        "px-3 py-2 text-white font-bold flex justify-between items-center shadow-sm",
                        zone.headerColor
                      )}
                    >
                      <span className="text-sm tracking-wide">{zone.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {assignments[zone.id].length}/3
                        </span>
                        <Lucide
                          icon="UsersRound"
                          className="w-5 h-5 opacity-80"
                        />
                      </div>
                    </div>

                    <div
                      className={clsx(
                        "px-3 py-2 border-b border-slate-100 flex items-center transition-colors duration-300",
                        isHovered ? zone.hoverColor : zone.lightColor
                      )}
                    >
                      <div className="w-10 h-10 lg:w-12 lg:h-12 flex-none image-fit mr-3 lg:mr-4 border-2 border-white rounded-full shadow-sm">
                        <img
                          alt="User"
                          className="rounded-full"
                          src={
                            assignedUser?.user_thumbnail
                              ? assignedUser.user_thumbnail
                              : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                          }
                        />
                      </div>
                      <div className="flex justify-between items-center w-full min-w-0">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-slate-800 text-sm lg:text-base truncate">
                            {assignedUser
                              ? `${assignedUser.fname} ${assignedUser.lname}`
                              : "Unassigned"}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {t("Students")}
                          </div>
                        </div>
                        {hasPatients && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleClearZone(zone.id)}
                            className="w-6 h-6 p-0 flex items-center justify-center shrink-0"
                            title={`Clear ${zone.name}`}
                          >
                            <Lucide icon="X" className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div
                      className={clsx(
                        "flex-1 p-3 lg:p-4 space-y-2 lg:space-y-3 transition-colors duration-300",
                        isHovered ? "bg-slate-50" : "bg-white"
                      )}
                    >
                      {assignments[zone.id].map((patient) => (
                        <DraggableCard
                          key={patient.id}
                          patient={patient}
                          isDragging={draggingId === String(patient.id)}
                          onDragStart={handleDragStart}
                          isCompact
                        />
                      ))}

                      {[...Array(3 - assignments[zone.id].length)].map(
                        (_, i) => (
                          <div
                            key={i}
                            className={clsx(
                              "h-12 lg:h-14 border-dashed rounded-lg flex items-center justify-center transition-all duration-300",
                              isHovered
                                ? clsx(
                                    zone.borderColor,
                                    "bg-white border-[1px]"
                                  )
                                : "border-slate-200 bg-slate-50 border-[2px]"
                            )}
                          >
                            <Lucide
                              icon="Bed"
                              className={clsx(
                                "w-4 h-4 mr-2",
                                isHovered ? zone.textColor : "text-slate-400"
                              )}
                            />
                            <span
                              className={clsx(
                                "text-xs font-medium transition-colors",
                                isHovered ? zone.textColor : "text-slate-400"
                              )}
                            >
                              {t("Bed")} {assignments[zone.id].length + i + 1}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Alert Dialog Component */}
      <Dialog
        open={alertData.isOpen}
        onClose={() => setAlertData({ ...alertData, isOpen: false })}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="AlertCircle"
              className="w-16 h-16 text-warning mx-auto mt-3"
            />
            <div className="text-3xl mt-5">{alertData.title}</div>
            <div className="text-slate-500 mt-2">{alertData.message}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="primary"
              type="button"
              className="w-24"
              onClick={() => setAlertData({ ...alertData, isOpen: false })}
            >
              Ok
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

// --- Updated DraggableCard (Menu Removed) ---
const DraggableCard = ({
  patient,
  onDragStart,
  isDragging,
  isCompact = false,
}: {
  patient: PatientDetail;
  onDragStart: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  isCompact?: boolean;
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleDragStartEvent = (e: React.DragEvent) => {
    if (cardRef.current) {
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.width = "280px";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 50, 30);
      setTimeout(() => document.body.removeChild(clone), 0);
    }
    onDragStart(e, String(patient.id));
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStartEvent}
      className={clsx(
        "bg-white dark:bg-darkmode-600 p-2 lg:p-3 rounded-md shadow-sm border border-slate-200 dark:border-darkmode-400 transition-all hover:shadow-md hover:border-slate-300",
        isDragging
          ? "opacity-50 ring-2 ring-primary"
          : "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 w-full">
          <div className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
            {patient.name}
          </div>

          {!isCompact && (
            <div className="mt-1 text-xs text-slate-500 flex flex-col">
              <span>
                {patient.gender} • {patient.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SessionSetup;
