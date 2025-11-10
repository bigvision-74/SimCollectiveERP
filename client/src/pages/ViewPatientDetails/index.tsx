import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { useParams } from "react-router-dom";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import { getPatientByIdAction } from "@/actions/patientActions";
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
import { FormInput, FormLabel, FormCheck } from "@/components/Base/Form";
import {
  createSessionAction,
  endSessionAction,
  deletePatienSessionDataAction,
} from "@/actions/sessionAction";
import { useAppContext } from "@/contexts/sessionContext";
import { messaging } from "../../../firebaseConfig";
import { onMessage } from "firebase/messaging";
import { io, Socket } from "socket.io-client";
import env from "../../../env";

type InvestigationFormData = {
  sessionName: string;
  duration: string;
};

type FormErrors = Partial<Record<keyof InvestigationFormData, string>>;

type AlertData = {
  variant: "success" | "danger";
  message: string;
};

function ViewPatientDetails() {
  const { id } = useParams<{ id: string }>(); // Type the useParams hook
  const startedBy = localStorage.getItem("startedBy");
  const user1 = localStorage.getItem("user");
  const [selectedPick, setSelectedPick] = useState<string>("PatientSummary");
  const [loading, setLoading] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<any>(null); // Replace 'any' with proper patient type if available
  const [userRole, setUserRole] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loginId, setLoginId] = useState("");
  const [timer, setTimer] = useState<number | null>(null); // Timer in seconds
  const [session, setSession] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<AlertData | null>(null);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const { socket, user, sessionInfo, participants, fetchParticipants } =
    useAppContext();
  const isSessionActive = sessionInfo.isActive && sessionInfo.patientId;
  const [formData, setFormData] = useState<InvestigationFormData>({
    sessionName: "",
    duration: "15",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    sessionName: "",
  });
  const socket1 = useRef<Socket | null>(null);

  useEffect(() => {
    socket1.current = io("wss://sockets.mxr.ai:5000", {
      transports: ["websocket"],
    });

    socket1.current.on("connect", () => {
      console.log("Socket connected");
    });
    socket1.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    return () => {
      socket1.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !id) {
      return;
    }

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
      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || "You have a new notification.";

      if (!payload.data?.payload) {
        console.error("Payload is missing");
        return;
      }

      try {
        const parsedPayload = JSON.parse(payload.data.payload);
        const patientId = parsedPayload?.[0]?.patient_id;

        if (patientId) {
          setReportRefreshKey((prev) => prev + 1);
        } else {
          console.warn("Patient ID not found in payload");
        }
      } catch (err) {
        console.error("Failed to parse payload or fetch reports:", err);
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
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

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
    const response = await deletePatienSessionDataAction(Number(id));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("patient", id || "");
      formDataToSend.append("name", formData.sessionName);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("createdBy", user1 || "");

      const response = await createSessionAction(formDataToSend);
      // const socketData = {
      //   device_type: "App",
      //   session_id: response.id,
      //   patient_id: id,
      //   session_name: formData.sessionName,
      // };
      // socket1.current?.emit(
      //   "PlayAnimationEventEPR",
      //   JSON.stringify(socketData, null, 2),
      //   (ack: any) => {
      //     console.log("✅ ACK from server:", ack);
      //   }
      // );

      const durationInSeconds = parseInt(formData.duration) * 60;
      setTimer(durationInSeconds);
      setIsRunning(true);

      localStorage.setItem(
        "sessionTimer",
        JSON.stringify({
          startTime: Date.now(),
          duration: parseInt(formData.duration),
        })
      );

      handleActionAdd({
        variant: "success",
        message: t("session_started_successfully"),
      });

      setFormData({ sessionName: "", duration: "15" });
      setShowModal(false);
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

  const handleEndSession = async () => {
    if (!sessionInfo.sessionId) return;
    try {
      setTimer(0);
      setIsRunning(false);
      localStorage.removeItem("activeSession");
      await endSessionAction(sessionInfo.sessionId);
      handleActionAdd({
        variant: "success",
        message: t("session_ended_successfully"),
      });
    } catch (error) {
      handleActionAdd({
        variant: "danger",
        message: t("session_end_fail"),
      });
    }
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
                <Button
                  variant="primary"
                  className="w-full sm:w-auto mr-3"
                  onClick={() => handleDeleteDetails()}
                >
                  {t("reset")}
                </Button>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => setShowModal(true)}
                >
                  {t("startSession")}
                </Button>
              </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5 space-y-2">
              {/* Patient Summary Tab */}
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

              {/* Patient Note Tab */}
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

              {/* Observations & Charts Tab */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "ObservationsCharts"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("ObservationsCharts")}
              >
                <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">
                  {t("observations_charts")}
                </div>
              </div>

              {/* Request Investigations Tab */}
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
                  <Lucide icon="SearchSlash" className="w-4 h-4 mr-2" />
                  <div className="flex-1 truncate">
                    {t("request_investigations")}
                  </div>
                </div>
              )}

              {/* Investigation Reports Tab */}
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

              {/* Prescriptions  Tab */}
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
                  userEmail === "avin@yopmail.com")) && (
                <>
                  <div
                    className={`flex items-center px-4 py-2 cursor-pointer ${
                      selectedPick === "Virtual"
                        ? "text-white rounded-lg bg-primary"
                        : ""
                    }`}
                    onClick={() => handleClick("Virtual")}
                  >
                    <Lucide icon="FileText" className="w-4 h-4 mr-2" />
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
              />
            )}
            {selectedPick === "ObservationsCharts" && patientData && (
              <ObservationsCharts
                data={patientData}
                key={reportRefreshKey}
                onShowAlert={handleActionAdd}
              />
            )}
            {selectedPick === "InvestigationReports" && patientData && (
              <InvestigationReports
                key={reportRefreshKey}
                patientId={patientData.id}
              />
            )}
            {userRole !== "Superadmin" &&
              selectedPick === "RequestInvestigations" &&
              patientData && (
                <RequestInvestigations
                  data={patientData}
                  key={reportRefreshKey}
                  onShowAlert={handleActionAdd}
                />
              )}
            {selectedPick === "Prescriptions" && patientData && (
              <Prescriptions
                key={reportRefreshKey}
                patientId={patientData.id}
                onShowAlert={handleActionAdd}
              />
            )}
            {selectedPick === "Virtual" && patientData && (
              <Virtual key={reportRefreshKey} patientId={patientData.id} />
            )}
          </div>
        </div>
      </div>

      <Dialog size="xl" open={showModal} onClose={handleClose}>
        <Dialog.Panel className="p-5 md:p-10">
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 mt-3 mr-3 text-gray-500 hover:text-gray-700"
            aria-label={t("close")}
          >
            <Lucide icon="X" className="w-6 h-6" />
          </button>
          <div className="relative">
            <form onSubmit={handleSubmit} className="box p-5">
              <div className="mb-4">
                <FormLabel htmlFor="sessionName">{t("sessionName")}</FormLabel>
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
              <div className="mb-4">
                <FormLabel htmlFor="duration" className="mt-5">
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
