import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { useParams } from "react-router-dom";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import {
  getPatientByIdAction,
  getAvailableUsersAction,
} from "@/actions/patientActions";
import Button from "@/components/Base/Button";
import PatientSummary from "@/components/PatientDetails/patientSummary";
import PatientNote from "@/components/PatientDetails/patientNote";
import ObservationsCharts from "@/components/PatientDetails/ObservationsCharts";
import RequestInvestigations from "@/components/PatientDetails/RequestInvestigations";
import InvestigationReports from "@/components/PatientDetails/InvestigationReports";
import Prescriptions from "@/components/PatientDetails/Prescriptions";
import Virtual from "@/components/PatientDetails/Virtual";
import { getAdminOrgAction } from "@/actions/adminActions";
import { Dialog } from "@/components/Base/Headless";
import {
  FormInput,
  FormLabel,
  FormCheck,
  FormSelect,
} from "@/components/Base/Form";
import {
  createSessionAction,
  deletePatienSessionDataAction,
} from "@/actions/sessionAction";
import { useAppContext } from "@/contexts/sessionContext";
import { messaging } from "../../../firebaseConfig";
import { onMessage } from "firebase/messaging";
import { useSocket } from "@/contexts/SocketContext";

// --- Types ---

type InvestigationFormData = {
  sessionName: string;
  duration: string;
  end_date: string;
  selectedFaculty: string;
  selectedObserver: string;
  selectedStudents: string[];
  patientType: string;
  roomType: string;
};

type FormErrors = Partial<Record<keyof InvestigationFormData, string>>;

type AlertData = {
  variant: "success" | "danger";
  message: string;
};

// --- MultiSelect Component (Adapted from Reference) ---

interface MultiSelectProps<T> {
  options: T[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  maxLimit?: number;
}

const MultiSelectDropdown = <T,>({
  options,
  selectedIds,
  onChange,
  getLabel,
  getId,
  placeholder = "Select...",
  maxLimit,
}: MultiSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      if (maxLimit && selectedIds.length >= maxLimit) {
        // Optional: Trigger a toast or alert here if needed
        return;
      }
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full border rounded px-3 py-2 cursor-pointer bg-white dark:bg-darkmode-800 flex justify-between items-center",
          "border-slate-200 shadow-sm transition duration-200 ease-in-out dark:border-darkmode-400"
        )}
      >
        <span
          className={clsx(
            "truncate",
            selectedIds.length === 0 && "text-slate-400"
          )}
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} ${t("selected")}`
            : placeholder}
        </span>
        <Lucide icon="ChevronDown" className="w-4 h-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkmode-800 border border-slate-200 dark:border-darkmode-400 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">
              {t("Nooptionsavailable")}
            </div>
          ) : (
            <div className="p-2">
              {options.map((option) => {
                const id = getId(option);
                const isSelected = selectedIds.includes(id);
                // Disable unselected items if max limit reached
                const isDisabled =
                  !isSelected && maxLimit && selectedIds.length >= maxLimit;

                return (
                  <div
                    key={id}
                    className={clsx(
                      "flex items-center p-2 rounded transition-colors",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-slate-100 dark:hover:bg-darkmode-700 cursor-pointer"
                    )}
                    onClick={(e) => {
                      if (isDisabled) return;
                      const target = e.target as HTMLElement;
                      if (
                        target.tagName === "INPUT" ||
                        target.tagName === "LABEL"
                      ) {
                        return;
                      }
                      handleCheckboxChange(id);
                    }}
                  >
                    <FormCheck className="flex items-center w-full">
                      <FormCheck.Input
                        id={`checkbox-${id}`}
                        type="checkbox"
                        className="mr-2 border cursor-pointer"
                        checked={isSelected}
                        disabled={!!isDisabled}
                        onChange={() => handleCheckboxChange(id)}
                      />
                      <FormCheck.Label
                        htmlFor={`checkbox-${id}`}
                        className="cursor-pointer select-none w-full"
                      >
                        {getLabel(option)}
                      </FormCheck.Label>
                    </FormCheck>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export type OnUpdateCallback = (
  category: string,
  action: "added" | "updated" | "deleted" | "requested"
) => void;

function ViewPatientDetails() {
  const { id } = useParams<{ id: string }>();
  const user1 = localStorage.getItem("user");
  const [selectedPick, setSelectedPick] = useState<string>("PatientSummary");
  const [loading, setLoading] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loginId, setLoginId] = useState("");
  const [timer, setTimer] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<AlertData | null>(null);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const { socket, sessionInfo } = useAppContext();
  const isSessionActive = sessionInfo.isActive && sessionInfo.patientId;
  const [patientType, setPatientType] = useState("");
  const [roomType, setRoomType] = useState("");

  const [formData, setFormData] = useState<InvestigationFormData>({
    sessionName: "",
    duration: "15",
    end_date: "",
    selectedFaculty: "",
    selectedObserver: "",
    selectedStudents: [],
    patientType: "",
    roomType: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    sessionName: "",
    roomType: "",
    patientType: "",
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [orgId, setOrgId] = useState("");

  const patientTypes = ["Child", "Oldman", "Woman"];
  const rooms = ["OT"];

  const {
    globalSession,
    triggerPatientUpdate,
    lastUpdateSignal,
    getPatientZone,
  } = useSocket() || {};

  const facultyList = Array.isArray(availableUsers)
    ? availableUsers.filter((u: any) => u.role === "Faculty")
    : [];

  const observerList = Array.isArray(availableUsers)
    ? availableUsers.filter((u: any) => u.role === "Observer")
    : [];

  const studentList = Array.isArray(availableUsers)
    ? availableUsers.filter((u: any) => u.role === "User")
    : [];

  const selectedStudentObjects = studentList.filter((s) =>
    formData.selectedStudents.includes(String(s.id))
  );

  useEffect(() => {
    if (!lastUpdateSignal || !id) return;
    if (String(lastUpdateSignal.patientId) === String(id)) {
      setReportRefreshKey((prev) => prev + 1);
      fetchPatient();
    }
  }, [lastUpdateSignal, id]);

  const isPatientInWardSession = React.useMemo(() => {
    if (!globalSession?.isActive || !id) return false;
    const allowedIds = globalSession.activePatientIds || [];
    if (allowedIds.includes("all")) return true;
    return allowedIds.some(
      (allowedId: any) => String(allowedId) === String(id)
    );
  }, [globalSession, id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("subscribeToPatientUpdates", { patientId: id });
    const handleRefresh = () => {
      setReportRefreshKey((prev) => prev + 1);
    };
    socket.on("refreshPatientData", handleRefresh);
    return () => {
      socket.off("refreshPatientData", handleRefresh);
    };
  }, [socket, id]);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      if (!payload.data?.payload) return;
      try {
        const parsedPayload = JSON.parse(payload.data.payload);
        if (parsedPayload?.[0]?.patient_id) {
          setReportRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to parse payload:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  const durationOptions = [
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
    { value: "45", label: "45 min" },
    { value: "60", label: "60 min" },
    { value: "unlimited", label: "Unlimited" },
  ];

  const handleClick = (option: string) => {
    setSelectedPick(option);
    localStorage.setItem("selectedPick", option);
  };

  const handleActionAdd = (alertData: AlertData) => {
    setShowAlert(alertData);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };

  useEffect(() => {
    const selectedOption = localStorage.getItem("selectedPick");
    setSelectedPick(selectedOption || "PatientSummary");
  }, []);

  const fetchPatient = async () => {
    try {
      const response = await getPatientByIdAction(Number(id));
      const useremail = localStorage.getItem("user");
      const org = await getAdminOrgAction(String(useremail));

      setUserRole(org.role);
      setUserEmail(org.uemail);
      setPatientData(response.data);
      setLoginId(org.uid);
      setOrgId(org.organisation_id);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchAvailableUsers = async () => {
    try {
      if (orgId) {
        const response = await getAvailableUsersAction(orgId);
        setAvailableUsers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching available users", error);
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
  }, [orgId]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    if (!formData.sessionName.trim()) {
      errors.sessionName = t("session_name_required");
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleDeleteDetails = async () => {
    await deletePatienSessionDataAction(Number(id));
    setSelectedPick("PatientSummary");
    handleActionAdd({
      variant: "success",
      message: t("Details_reset_successfully"),
    });
  };

  const handleClose = () => {
    setFormData({
      sessionName: "",
      duration: "15",
      end_date: "",
      selectedFaculty: "",
      selectedObserver: "",
      selectedStudents: [],
      patientType: "",
      roomType: "",
    });
    setFormErrors({
      sessionName: "",
    });
    setShowModal(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // --- Handlers for Custom Inputs ---

  const handleStudentsChange = (newIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      selectedStudents: newIds,
    }));
  };

  const handleRemoveStudent = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.filter(
        (id) => id !== String(studentId)
      ),
    }));
  };

  // ----------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      let durationToSend = formData.duration;

      if (formData.duration === "unlimited" && formData.end_date) {
        const now = new Date();
        const endDate = new Date(formData.end_date);
        const diffMs = endDate.getTime() - now.getTime();
        if (diffMs > 0) {
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          const diffMinutes = Math.round(diffDays * 24 * 60);
          durationToSend = diffMinutes.toString();
        }
      }

      // --- Construct Assignment JSON ---
      const assignmentsObj: any = {
        faculty: [],
        Observer: [],
      };

      if (userRole === "Admin" && formData.selectedFaculty) {
        assignmentsObj.faculty.push(Number(formData.selectedFaculty));
      } else if (userRole === "Faculty") {
        assignmentsObj.faculty.push(Number(loginId));
      }

      if (formData.selectedObserver) {
        assignmentsObj.Observer.push(Number(formData.selectedObserver));
      }

      // Map students to zones
      formData.selectedStudents.forEach((studentId, index) => {
        const zoneKey = `zone${index + 1}`;
        assignmentsObj[zoneKey] = {
          userId: Number(studentId),
          patientIds: [],
        };
      });

      formDataToSend.append("assignments", JSON.stringify(assignmentsObj));
      formDataToSend.append("patient", id || "");
      formDataToSend.append("name", formData.sessionName);
      formDataToSend.append("duration", durationToSend);
      formDataToSend.append("createdBy", user1 || "");
      formDataToSend.append("patientType", formData.patientType || "");
      formDataToSend.append("roomType", formData.roomType || "");

      const res = await createSessionAction(formDataToSend);

      localStorage.setItem("virtualSessionId", res.virtualSessionId);

      const durationInSeconds = parseInt(durationToSend) * 60;
      setTimer(durationInSeconds);
      localStorage.setItem(
        "sessionTimer",
        JSON.stringify({
          startTime: Date.now(),
          duration: parseInt(durationToSend),
        })
      );

      handleActionAdd({
        variant: "success",
        message: t("session_started_successfully"),
      });

      handleClose();
    } catch (error) {
      console.error("Error starting session", error);
      handleActionAdd({
        variant: "danger",
        message: t("failed_to_start_session"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate: OnUpdateCallback = (category, action) => {
    setReportRefreshKey((prev) => prev + 1);
    if (!triggerPatientUpdate || !id) return;

    let targetRoom = getPatientZone ? getPatientZone(id) : null;
    if (!targetRoom && globalSession?.assignedRoom) {
      if (globalSession.assignedRoom !== "all") {
        targetRoom = String(globalSession.assignedRoom);
      }
    }

    triggerPatientUpdate({
      patientId: id,
      patientName: patientData?.name || "Patient",
      assignedRoom: targetRoom || "all",
      category: category,
      action: action,
    });
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col sm:flex-row items-center mt-8 intro-y">
        <h2 className="w-full sm:w-auto text-lg font-medium sm:mr-auto">
          {t("patient_details")}
        </h2>

        <div className="w-full sm:w-auto flex justify-end sm:justify-start mt-4 sm:mt-0">
          {(userRole === "Admin" || userRole === "Faculty") &&
            !isSessionActive && (
              <>
                {!isPatientInWardSession && (
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto mr-3"
                    onClick={() => handleDeleteDetails()}
                  >
                    {t("reset")}
                  </Button>
                )}

                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => setShowModal(true)}
                  disabled={isPatientInWardSession}
                >
                  {t("startSession")}
                </Button>
              </>
            )}
        </div>
      </div>
      {isPatientInWardSession &&
        (userRole === "Admin" || userRole === "Faculty") && (
          <div className="px-3 py-2 text-warning-dark text-sm font-medium flex items-center justify-end">
            <Lucide icon="AlertCircle" className="w-4 h-4 mr-2" />
            {t("alreadyWard")}
          </div>
        )}

      <div className="grid grid-cols-11 gap-5 mt-2 intro-y">
        {/* Left Side Navigation */}
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5 space-y-2">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "PatientSummary"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("PatientSummary")}
              >
                <Lucide icon="User" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("patient_summary")}</div>
              </div>

              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "PatientNote"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("PatientNote")}
              >
                <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("patient_note")}</div>
              </div>

              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "ObservationsCharts"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("ObservationsCharts")}
              >
                <Lucide icon="BarChart3" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">
                  {t("observations_charts")}
                </div>
              </div>

              {(userRole === "Admin" ||
                userRole === "Faculty" ||
                userRole === "User") && (
                <div
                  className={`flex items-center px-4 py-2 cursor-pointer ${
                    selectedPick === "RequestInvestigations"
                      ? "text-white rounded-lg bg-primary"
                      : ""
                  }`}
                  onClick={() => handleClick("RequestInvestigations")}
                >
                  <Lucide icon="MessageCirclePlus" className="w-4 h-4 mr-2" />
                  <div className="flex-1 truncate">
                    {t("request_investigations")}
                  </div>
                </div>
              )}

              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "InvestigationReports"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("InvestigationReports")}
              >
                <Lucide icon="SearchSlash" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">
                  {t("investigation_reports")}
                </div>
              </div>

              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "Prescriptions"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("Prescriptions")}
              >
                <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("prescriptions")}</div>
              </div>

              {(userRole === "Superadmin" ||
                (userRole === "Faculty" &&
                  (userEmail === "avin@yopmail.com" ||
                    userEmail === "jwutest@yopmail.com"))) && (
                // (userRole === "Faculty" && userEmail === "facultynew@yopmail.com")) &&
                <>
                  <div
                    className={`flex items-center px-4 py-2 cursor-pointer ${
                      selectedPick === "Virtual"
                        ? "text-white rounded-lg bg-primary"
                        : ""
                    }`}
                    onClick={() => handleClick("Virtual")}
                  >
                    <Lucide icon="Monitor" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("virtual")}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            {selectedPick === "PatientSummary" && patientData && (
              <PatientSummary data={patientData} />
            )}
            {selectedPick === "PatientNote" && patientData && (
              <PatientNote
                data={patientData}
                key={reportRefreshKey}
                onShowAlert={handleActionAdd}
                onDataUpdate={handleContentUpdate}
              />
            )}
            {selectedPick === "ObservationsCharts" && patientData && (
              <ObservationsCharts
                data={patientData}
                key={reportRefreshKey}
                onShowAlert={handleActionAdd}
                onDataUpdate={handleContentUpdate}
              />
            )}
            {selectedPick === "InvestigationReports" && patientData && (
              <InvestigationReports
                key={reportRefreshKey}
                patientId={patientData.id}
                onDataUpdate={handleContentUpdate}
              />
            )}
            {userRole !== "Superadmin" &&
              selectedPick === "RequestInvestigations" &&
              patientData && (
                <RequestInvestigations
                  data={patientData}
                  key={reportRefreshKey}
                  onShowAlert={handleActionAdd}
                  onDataUpdate={handleContentUpdate}
                />
              )}
            {selectedPick === "Prescriptions" && patientData && (
              <Prescriptions
                key={reportRefreshKey}
                patientId={patientData.id}
                onShowAlert={handleActionAdd}
                onDataUpdate={handleContentUpdate}
              />
            )}
            {selectedPick === "Virtual" && patientData && (
              <Virtual key={reportRefreshKey} patientId={patientData.id} />
            )}
          </div>
        </div>
      </div>

      <Dialog size="xl" open={showModal} onClose={handleClose}>
        <Dialog.Panel className="p-8">
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 mt-3 mr-3 text-gray-500 hover:text-gray-700"
            aria-label={t("close")}
          >
            <Lucide icon="X" className="w-6 h-6" />
          </button>
          <div className="relative">
            <div className="border-b border-slate-200/60 dark:border-darkmode-400 py-3 mb-5">
              <div className="text-base font-medium truncate">
                {t("Start Session")}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="">
              {/* Session Name */}
              <div className="mb-5">
                <FormLabel htmlFor="sessionName" className="font-bold">
                  {t("sessionName")} <span className="text-danger">*</span>
                </FormLabel>
                <FormInput
                  id="sessionName"
                  name="sessionName"
                  placeholder={t("enter_session_name")}
                  value={formData.sessionName}
                  onChange={handleInputChange}
                  className={clsx("w-full", {
                    "border-danger": formErrors.sessionName,
                  })}
                />
                {formErrors.sessionName && (
                  <p className="mt-1 text-sm text-danger">
                    {formErrors.sessionName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {userRole === "Admin" && (
                  <div>
                    <FormLabel htmlFor="selectedFaculty" className="font-bold">
                      {t("SelectFaculty")}
                    </FormLabel>
                    <FormSelect
                      id="selectedFaculty"
                      name="selectedFaculty"
                      value={formData.selectedFaculty}
                      onChange={handleInputChange}
                    >
                      <option value="">{t("SelectFacultyMember")}</option>
                      {facultyList.map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.fname} {user.lname}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                )}

                {/* 2. Observer Selection */}
                <div>
                  <FormLabel htmlFor="selectedObserver" className="font-bold">
                    {t("SelectObserver")}{" "}
                    <span className="text-xs text-gray-500 font-normal">
                      ({t("Optional")})
                    </span>
                  </FormLabel>
                  <FormSelect
                    id="selectedObserver"
                    name="selectedObserver"
                    value={formData.selectedObserver}
                    onChange={handleInputChange}
                  >
                    <option value="">{t("SelectObserver")}</option>
                    {observerList.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.fname} {user.lname}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                {/* 3. Users/Students Selection (Max 3) */}
                <div className="col-span-1 md:col-span-2">
                  <FormLabel htmlFor="selectedStudents" className="font-bold">
                    {t("SelectUsers")} ({t("Max 3")})
                  </FormLabel>

                  <MultiSelectDropdown
                    options={studentList}
                    selectedIds={formData.selectedStudents}
                    onChange={handleStudentsChange}
                    getId={(u) => String(u.id)}
                    getLabel={(u) => `${u.fname} ${u.lname} (${u.username})`}
                    placeholder={t("Select up to 3 users")}
                    maxLimit={3}
                  />

                  {/* Tag Display Area */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-slate-500 font-bold">
                        {t("SelectedUsers")} ({formData.selectedStudents.length}
                        /3):
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedStudentObjects.length > 0 ? (
                        selectedStudentObjects.map((user: any) => (
                          <div
                            key={user.id}
                            className="relative group bg-green-50 border border-green-200 text-green-700 rounded px-3 py-2 text-xs font-medium flex items-center justify-between transition-all"
                          >
                            <span className="mr-2">
                              {user.fname} {user.lname}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveStudent(String(user.id))
                              }
                              className="text-green-700 transition-colors hover:text-green-900"
                            >
                              <Lucide icon="X" className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-xs italic p-2 border border-dashed rounded bg-slate-50 w-full">
                          {t("No users assigned yet")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* --- END NEW SECTION --- */}

              {(userEmail === "avin@yopmail.com" ||
                userEmail === "jwutest@yopmail.com") && (
                <>
                  {/* Patient Type */}
                  <div>
                    <label className="block font-medium mb-1">
                      Patient Type
                    </label>
                    <FormSelect
                      value={formData.patientType}
                      name="patientType"
                      onChange={(e) => {
                        setPatientType(e.target.value);
                        handleInputChange(e);
                      }}
                      className={formErrors.patientType ? "border-red-500" : ""}
                    >
                      <option value="">Select Patient Type</option>
                      {patientTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block font-medium mb-1 mt-5">
                      Room Type
                    </label>
                    <FormSelect
                      value={formData.roomType}
                      name="roomType"
                      onChange={(e) => {
                        setRoomType(e.target.value);
                        handleInputChange(e);
                      }}
                      className={formErrors.roomType ? "border-red-500" : ""}
                    >
                      <option value="">Select Room</option>
                      {rooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                </>
              )}

              {/* Duration Section */}
              <div className="mb-4 mt-5">
                <FormLabel htmlFor="duration" className="font-bold">
                  {t("duration")}
                </FormLabel>
                {durationOptions.map((opt) => (
                  <FormCheck key={opt.value} className="mt-2">
                    <FormCheck.Input
                      type="radio"
                      id={`duration-${opt.value}`}
                      name="duration"
                      value={opt.value}
                      checked={formData.duration === opt.value}
                      onChange={handleInputChange}
                      className="form-radio mr-2"
                    />
                    <FormCheck.Label
                      htmlFor={`duration-${opt.value}`}
                      className="font-normal ml-2"
                    >
                      {opt.label}
                    </FormCheck.Label>
                  </FormCheck>
                ))}

                {formData.duration === "unlimited" && (
                  <div className="mt-4">
                    <FormLabel htmlFor="end_date" className="font-bold">
                      {t("endDate")}
                    </FormLabel>
                    <FormInput
                      type="datetime-local"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date || ""}
                      onChange={handleInputChange}
                      // 1. Add cursor-pointer class
                      className="form-control cursor-pointer"
                      // 2. Open picker on click
                      onClick={(e) => {
                        try {
                          if ("showPicker" in e.currentTarget) {
                            e.currentTarget.showPicker();
                          }
                        } catch (err) {
                          console.log(err);
                        }
                      }}
                      // 3. Set Minimum to current local time
                      min={(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(now.getDate()).padStart(2, "0");
                        const hours = String(now.getHours()).padStart(2, "0");
                        const minutes = String(now.getMinutes()).padStart(
                          2,
                          "0"
                        );
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })()}
                      // 4. Prevent manual typing
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8 space-x-3">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {t("save")}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default ViewPatientDetails;
