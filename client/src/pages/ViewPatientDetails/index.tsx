import React, { useEffect, useState } from "react";
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
import { getAdminOrgAction } from "@/actions/adminActions";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormCheck } from "@/components/Base/Form";
import { createSessionAction, endSessionAction } from "@/actions/sessionAction";
import { useAppContext } from "@/contexts/sessionContext";

type InvestigationFormData = {
  sessionName: string;
  duration: string; // Duration as string from form (e.g., "30", "45")
};

type FormErrors = Partial<Record<keyof InvestigationFormData, string>>;

type AlertData = {
  variant: "success" | "danger";
  message: string;
};

function ViewPatientDetails() {
  const { id } = useParams<{ id: string }>(); // Type the useParams hook
  const user1 = localStorage.getItem("user");
  const [selectedPick, setSelectedPick] = useState<string>("PatientSummary");
  const [loading, setLoading] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<any>(null); // Replace 'any' with proper patient type if available
  const [userRole, setUserRole] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const { user, sessionInfo, socket, isLoading } = useAppContext();
  const [timer, setTimer] = useState<number | null>(null); // Timer in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const isSessionActive = sessionInfo.isActive && sessionInfo.patientId === id;
  const [showAlert, setShowAlert] = useState<AlertData | null>(null);

  const [formData, setFormData] = useState<InvestigationFormData>({
    sessionName: "",
    duration: "45",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    sessionName: "",
  });

  const durationOptions = [
    { value: "30", label: "30 min" },
    { value: "45", label: "45 min" },
    { value: "60", label: "60 min" },
    { value: "90", label: "90 min" },
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
      setPatientData(response.data);
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

  const handleClose = () => {
    setFormData({
      sessionName: "",
      duration: "45",
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

      // Start timer after successful session creation
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

      setFormData({ sessionName: "", duration: "45" });
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
      localStorage.removeItem("sessionTimer");
      localStorage.removeItem("currentSession");
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const storedTimer = localStorage.getItem("sessionTimer");

    if (storedTimer && isSessionActive) {
      try {
        const { startTime, duration } = JSON.parse(storedTimer);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, duration * 60 - elapsed);

        if (remaining > 0) {
          setTimer(remaining);
          setIsRunning(true);

          interval = setInterval(() => {
            setTimer((prev) => {
              if (prev === null) return 0;
              const newTime = prev - 1;
              if (newTime <= 0) {
                clearInterval(interval!);
                setIsRunning(false);
                localStorage.removeItem("sessionTimer");
                handleEndSession();
                return 0;
              }
              return newTime;
            });
          }, 1000);
        } else {
          localStorage.removeItem("sessionTimer");
          setTimer(0);
          setIsRunning(false);
        }
      } catch (error) {
        console.error("Failed to parse stored timer:", error);
        localStorage.removeItem("sessionTimer");
        setTimer(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, handleEndSession]);

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      {isSessionActive && (
        <div className="flex items-center p-3 my-4 text-white rounded-md intro-y bg-[#0369a1]">
          <Lucide icon="Clock" className="w-6 h-6 mr-3" />
          <div className="flex-grow font-medium">
            {t("session_in_progress")}
          </div>
          {/* <div className="px-3 py-1 mr-4 text-lg bg-white rounded-md text-primary">
            {timer !== null ? formatTime(timer) : "00:00"}
          </div> */}
          {(userRole === "Admin" || userRole === "Faculty") && (
            <Button variant="danger" onClick={handleEndSession}>
              {t("end_session")}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patient_details")}</h2>
        {(userRole === "Admin" || userRole === "Faculty") &&
          !isSessionActive && (
            <Button
              variant="primary"
              onClick={() => {
                setShowModal(true);
              }}
            >
              {t("startSession")}
            </Button>
          )}
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        {/* Sidebar */}
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
              {(userRole === "Admin" || userRole === "Faculty") && (
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
              <PatientNote data={patientData} onShowAlert={handleActionAdd} />
            )}
            {selectedPick === "ObservationsCharts" && patientData && (
              <ObservationsCharts data={patientData} />
            )}
            {selectedPick === "InvestigationReports" && patientData && (
              <InvestigationReports patientId={patientData.id} />
            )}
            {userRole !== "Superadmin" &&
              selectedPick === "RequestInvestigations" &&
              patientData && <RequestInvestigations data={patientData} />}
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
                      name="duration"
                      value={opt.value}
                      checked={formData.duration === opt.value}
                      onChange={handleInputChange}
                      className="form-radio mr-2"
                    />
                    <FormCheck.Label className="font-normal ml-2">
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
