import { useState, useEffect } from "react";
import { Dialog } from "@/components/Base/Headless";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormCheck,
} from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";
import {
  generateObservationsAction,
  addObservationAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import { useAppContext } from "@/contexts/sessionContext";
import {
  getUserOrgIdAction,
  getAiCreditsAction,
  updateAiCreditsAction,
} from "@/actions/userActions";
import { useRef } from "react";
import Alerts from "@/components/Alert";

interface Props {
  open: boolean;
  onClose: () => void;
  onShowAlert: (message: string, variant: "success" | "danger") => void;
  patientId: number;
  age: string;
  condition?: string;
  onRefresh: () => void;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted",
  ) => void;
}

const AIObservationModal: React.FC<Props> = ({
  open,
  onClose,
  onShowAlert,
  patientId,
  age,
  condition: initialCondition = "",
  onRefresh,
  onDataUpdate,
}) => {
  // Form State
  const [scenarioType, setScenarioType] = useState("Normal");
  const [condition, setCondition] = useState(initialCondition);
  const [patientAge, setPatientAge] = useState(age);
  const [startTime, setStartTime] = useState("");
  const [intervals, setIntervals] = useState("");
  const [numberOfRecords, setNumberOfRecords] = useState(1);

  // Data State
  const [generatedObservations, setGeneratedObservations] = useState<any[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false); // Saving state
  const [showLoadingLines, setShowLoadingLines] = useState(false);
  const [generateFailed, setGenerateFailed] = useState(false);

  // Credit Management State
  const [aiCredits, setAICredits] = useState("");
  const [aiUsedCredits, setAIUsedCredits] = useState("");
  const [orgId, setOrgId] = useState("");
  const userRole = localStorage.getItem("role");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const { sessionInfo } = useAppContext();
  let loadingTimeout: NodeJS.Timeout;

  // --- Credit Logic Calculation ---
  const isSuperAdmin = userRole === "Superadmin";
  const totalCredits = Number(aiCredits ? aiCredits : 5000);
  const usedCredits = Number(aiUsedCredits ? aiUsedCredits : 0);
  const calculatedRemaining = isSuperAdmin
    ? 9999
    : Math.max(0, totalCredits - usedCredits);

  const alertRef = useRef<HTMLDivElement | null>(null);

  // --- Fetchers ---
  const fetchCredits = async () => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      if (!data1) {
        console.error("ID is undefined");
        return;
      }
      const credits = await getAiCreditsAction(Number(data1.organisation_id));
      setAICredits(credits.credits);
      setAIUsedCredits(credits.usedCredits);
    } catch (error) {
      console.error("Error fetching AI credits:", error);
    }
  };

  const fetchOrg = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setOrgId(userData.orgid);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (userRole !== "Superadmin") {
      fetchOrg();
      fetchCredits();
    }
  }, []);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  useEffect(() => {
    setPatientAge(age);
  }, [age]);

  useEffect(() => {
    if (!open) {
      setGeneratedObservations([]);
      setSelectedIndexes([]);
      setGenerateFailed(false);
      setShowLoadingLines(false);
      setLoading(false);
    }
  }, [open]);

  const [formErrors, setFormErrors] = useState({
    condition: false,
    age: false,
    intervals: false,
    startTime: false,
  });

  const validateForm = () => {
    const errors = {
      condition: condition.trim() === "",
      intervals: intervals.trim() === "",
      age: patientAge.toString().trim() === "",
      startTime: startTime === "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleGenerate = async () => {
    // --- 1. Credit Validation ---
    if (!isSuperAdmin) {
      if (calculatedRemaining <= 0) {
        onShowAlert(t("No credits remaining. Please contact admin."), "danger");
        return;
      }
      if (numberOfRecords > calculatedRemaining) {
        onShowAlert(
          `${t("Insufficient credits.")} ${t("You only have")} ${calculatedRemaining} ${t("remaining")}.`,
          "danger",
        );
        return;
      }
    }

    if (!validateForm()) return;

    setGenerateFailed(false);
    setLoading(true);
    setGeneratedObservations([]);
    setSelectedIndexes([]);

    // Show nice animation after 1.5s
    loadingTimeout = setTimeout(() => {
      setShowLoadingLines(true);
    }, 1500);

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      const payload = {
        scenarioType,
        condition,
        startTime,
        intervals,
        age: patientAge,
        count: numberOfRecords,
        org: isSuperAdmin ? "0" : data1.organisation_id,
      };

      const response = await generateObservationsAction(payload);

      if (
        Array.isArray(response) ||
        (response?.data && Array.isArray(response.data))
      ) {
        // --- 2. Update Credits on Success ---
        // Ensure we have an orgId (fetch logic sets it, but superadmin might skip it)
        const targetOrgId =
          orgId ||
          (await getAdminOrgAction(String(localStorage.getItem("user")))).orgid;

        // await updateAiCreditsAction(Number(targetOrgId), numberOfRecords);
        fetchCredits(); // Refresh UI

        const dataToSet = Array.isArray(response) ? response : response.data;
        setGeneratedObservations(dataToSet);
        setSelectedIndexes(dataToSet.map((_: any, i: number) => i));
      } else {
        console.error("Unexpected response format", response);
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error generating patients:", err.response?.data?.message);

      setShowAlert({
        variant: "danger",
        message: err.response?.data?.message,
      });

      // 👇 scroll inside modal
      setTimeout(() => {
        alertRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      setTimeout(() => {
        setShowAlert(null);
      }, 5000);

      setGenerateFailed(true);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
      setShowLoadingLines(false);
    }
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSave = async () => {
    if (selectedIndexes.length === 0) return;
    setLoading2(true);

    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));
      const selectedObs = selectedIndexes.map((i) => generatedObservations[i]);

      for (let i = 0; i < selectedObs.length; i++) {
        const item = selectedObs[i];

        const timeOffset = (selectedObs.length - 1 - i) * 15;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const timestamp = new Date(
          Date.now() - timeOffset * 60000,
        ).toISOString();

        const obsPayload = {
          patient_id: patientId,
          observations_by: userData.uid,
          organisation_id: userData.orgid,
          sessionId: sessionInfo.sessionId,
          time_stamp: item.timestamp,
          created_at: undefined,

          respiratoryRate: String(item.respiratoryRate),
          o2Sats: String(item.o2Sats),
          oxygenDelivery: String(item.oxygenDelivery),
          bloodPressure: String(item.bloodPressure),
          pulse: String(item.pulse),
          consciousness: String(item.consciousness),
          temperature: String(item.temperature),

          news2Score: String(item.news2Score ?? "0"),
          pews2: String(item.pewsScore ?? "0"),
          mews2: String(item.mewsScore ?? "0"),
        };

        await addObservationAction(obsPayload as any);

        // Notify
        const payloadData = {
          title: `Observation Added`,
          body: `A New Observation Added by ${userData.username}`,
          created_by: userData.uid,
          patient_id: patientId,
        };

        if (sessionInfo && sessionInfo.sessionId) {
          await sendNotificationToAddNoteAction(
            payloadData,
            userData.orgid,
            sessionInfo.sessionId,
          );
        }
      }

      onShowAlert(t("Observations saved successfully"), "success");
      if (onDataUpdate) {
        onDataUpdate("Observations", "added");
      }
      onRefresh();
      setSelectedIndexes([]);
      setGeneratedObservations([]);
      onClose();
    } catch (err) {
      console.error("Error saving observations:", err);
      onShowAlert(t("Failed to save observations"), "danger");
    } finally {
      setLoading2(false);
    }
  };

  return (
    <Dialog
      size="xl"
      open={open}
      onClose={() => {
        setSelectedIndexes([]);
        setGeneratedObservations([]);
      }}
      static
    >
      <Dialog.Panel className="p-10 relative">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (loading || loading2) return;
            onClose();
          }}
          className="absolute top-0 right-0 mt-3 mr-3"
        >
          <Lucide icon="X" className="w-6 h-6 text-slate-400" />
        </a>

        {showAlert && (
          <div ref={alertRef}>
            <Alerts data={showAlert} />
          </div>
        )}

        <div className="intro-y box mt-3">
          <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">
              {t("Generate Observations with AI")}
            </h2>

            {/* --- Credit Display Badge --- */}
            {!isSuperAdmin && (
              <div className="flex items-center gap-3 mt-3 sm:mt-0 text-xs sm:text-sm font-medium animate-fade-in">
                <div className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-darkmode-600 border border-slate-200 dark:border-darkmode-400 text-slate-600 dark:text-slate-300">
                  <span>{t("total_credits")}: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {totalCredits}
                  </span>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-md border ${
                    calculatedRemaining < 5
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-primary/10 border-primary/20 text-primary"
                  }`}
                >
                  <span>{t("remaining")}: </span>
                  <span className="font-bold">{calculatedRemaining}</span>
                </div>
              </div>
            )}
          </div>

          {!isSuperAdmin && calculatedRemaining <= 0 && (
            <div className="flex items-center p-4 mb-2 border rounded-md border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50">
              <Lucide
                icon="AlertOctagon"
                className="w-6 h-6 text-red-500 mr-3 flex-shrink-0"
              />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  {t("CreditLimitReached")}
                </h3>
                <div className="mt-1 text-xs text-red-700 dark:text-red-400">
                  {t("generatenewobservations")}
                </div>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            <div>
              <FormLabel className="block font-medium mb-1">
                {t("Medical Condition / Diagnosis")}
              </FormLabel>
              <FormInput
                value={condition}
                disabled
                onChange={(e) => {
                  setCondition(e.target.value);
                  setFormErrors((prev) => ({ ...prev, condition: false }));
                }}
                className={formErrors.condition ? "border-red-500" : ""}
                placeholder="e.g. Sepsis, COPD, Post-Surgical, Pneumonia"
              />
              {formErrors.condition && (
                <p className="text-red-500 text-sm mt-1">
                  {t("Condition is required")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("Clinical State")}
                </FormLabel>
                <FormSelect
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                >
                  <option value="Normal">{t("Normal / Stable")}</option>
                  <option value="Deteriorating">{t("Deteriorating")}</option>
                  <option value="Acute">{t("Acute / Critical")}</option>
                </FormSelect>
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("Patient Age")}
                </FormLabel>
                <FormInput
                  value={patientAge}
                  disabled
                  onChange={(e) => {
                    setPatientAge(e.target.value);
                    setFormErrors((prev) => ({ ...prev, age: false }));
                  }}
                  className={formErrors.age ? "border-red-500" : ""}
                />
                {formErrors.age && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("Age is required")}
                  </p>
                )}
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("Start Time")}
                </FormLabel>
                <FormInput
                  name="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setFormErrors((prev) => ({ ...prev, startTime: false }));
                  }}
                  className={formErrors.startTime ? "border-red-500" : ""}
                />
                {formErrors.startTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("Start Time is required")}
                  </p>
                )}
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("Time Interval")}
                </FormLabel>
                <FormSelect
                  name="intake"
                  value={intervals}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIntervals(value);
                    setFormErrors((prev) => ({ ...prev, intervals: false }));
                  }}
                  className={`form-select w-full ${
                    formErrors.intervals ? "border-danger" : ""
                  }`}
                >
                  <option value="">{t("Select")}</option>
                  <option value="15mins">15 mins</option>
                  <option value="30mins">30 mins</option>
                </FormSelect>
                {formErrors.intervals && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("Time Interval is required")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FormLabel className="block font-medium mb-1">
                {t("NumberofObs")}
              </FormLabel>
              <FormInput
                type="number"
                value={numberOfRecords}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) val = 1;
                  const effectiveLimit = isSuperAdmin
                    ? 5
                    : Math.min(5, calculatedRemaining);

                  if (val > effectiveLimit) val = effectiveLimit;
                  if (!isSuperAdmin && val <= 0 && calculatedRemaining > 0)
                    val = 1;

                  setNumberOfRecords(val);
                }}
                min={1}
                max={isSuperAdmin ? 3 : Math.min(3, calculatedRemaining)}
                disabled={!isSuperAdmin && calculatedRemaining <= 0}
              />
            </div>

            <div className="text-right pt-4">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={
                  loading || (!isSuperAdmin && calculatedRemaining <= 0)
                }
              >
                {loading ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  <>
                    <Lucide icon="Sparkles" className="w-4 h-4 mr-2" />
                    {t("Generate")}
                  </>
                )}
              </Button>

              {showLoadingLines && (
                <div className="mt-4 text-center animate-fade-in">
                  <div className="inline-flex flex-col items-center space-y-3">
                    <div className="relative w-16 h-16 mb-2">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lucide
                          icon="Activity"
                          className="w-8 h-8 text-purple-600 animate-pulse"
                        />
                      </div>
                      <svg
                        className="absolute inset-0 w-full h-full text-purple-200 animate-spin-slow"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray="10, 20"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t("Simulating vitals based on condition...")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* {generateFailed && (
              <div className="p-2 text-center text-red-500">
                {t("Failed to generate observations. Please try again.")}
              </div>
            )} */}
          </div>

          {!loading && generatedObservations.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold mb-4 pl-5">
                {t("Review Generated Data")}
              </h3>

              <div className="grid gap-4 max-h-[400px] overflow-y-auto px-5 pb-5">
                {generatedObservations.map((obs, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-white dark:bg-darkmode-600 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 border-b pb-2 gap-2">
                      <div className="flex items-center">
                        <FormCheck.Input
                          type="checkbox"
                          checked={selectedIndexes.includes(index)}
                          onChange={() => handleCheckboxChange(index)}
                          className="mr-3 cursor-pointer"
                        />
                        <span className="font-semibold text-primary">
                          {t("Observation")} #{index + 1}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {/* Vitals */}
                      <div>
                        <span className="block text-xs text-slate-500">
                          Respiratory Rate
                        </span>
                        <span className="font-medium">
                          {obs.respiratoryRate} /min
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          O2 Sats
                        </span>
                        <span className="font-medium">{obs.o2Sats}%</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          O2 Delivery
                        </span>
                        <span
                          className="font-medium truncate"
                          title={obs.oxygenDelivery}
                        >
                          {obs.oxygenDelivery}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          Blood Pressure
                        </span>
                        <span className="font-medium">{obs.bloodPressure}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          Pulse
                        </span>
                        <span className="font-medium">{obs.pulse} BPM</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          Temp
                        </span>
                        <span className="font-medium">{obs.temperature}°C</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs text-slate-500">
                          GCS (Glasgow Coma Score)
                        </span>
                        <span className="font-medium">{obs.consciousness}</span>
                      </div>

                      {/* --- SCORES ADDED HERE --- */}
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold mb-0.5">
                          NEWS2
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">
                          {obs.news2Score ?? "0"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold mb-0.5">
                          PEWS
                        </span>
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded border border-green-200">
                          {obs.pewsScore ?? "0"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-semibold mb-0.5">
                          MEWS
                        </span>
                        <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded border border-orange-200">
                          {obs.mewsScore ?? "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedIndexes.length > 0 && (
                <div className="p-5 text-right bg-slate-50 rounded-b-lg">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={loading2}
                  >
                    {loading2 ? (
                      <div className="loader">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    ) : (
                      <>
                        {t("Save Selected")} ({selectedIndexes.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default AIObservationModal;
