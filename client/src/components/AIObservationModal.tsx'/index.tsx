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
import { useAppContext } from "@/contexts/sessionContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onShowAlert: (message: string, variant: "success" | "danger") => void;
  patientId: number;
  age: string;
  condition?: string;
  onRefresh: () => void;
}

const AIObservationModal: React.FC<Props> = ({
  open,
  onClose,
  onShowAlert,
  patientId,
  age,
  condition: initialCondition = "",
  onRefresh,
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

  const { sessionInfo } = useAppContext();
  let loadingTimeout: NodeJS.Timeout;

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
    if (!validateForm()) return;

    setGenerateFailed(false);
    setLoading(true);
    setGeneratedObservations([]);
    setSelectedIndexes([]);

    // Show nice animation after 1.5s
    loadingTimeout = setTimeout(() => {
      setShowLoadingLines(true);
    }, 1500);

    try {
      const payload = {
        scenarioType,
        condition,
        startTime,
        intervals,
        age: patientAge,
        count: numberOfRecords,
      };

      const response = await generateObservationsAction(payload);

      if (Array.isArray(response)) {
        setGeneratedObservations(response);
        setSelectedIndexes(response.map((_, i) => i));
      } else if (response?.data && Array.isArray(response.data)) {
        setGeneratedObservations(response.data);
        setSelectedIndexes(response.data.map((_: any, i: number) => i));
      } else {
        console.error("Unexpected response format", response);
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error generating observations:", err);
      setGenerateFailed(true);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
      setShowLoadingLines(false);
    }
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
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
        const timestamp = new Date(
          Date.now() - timeOffset * 60000
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
      }

      onShowAlert(t("Observations saved successfully"), "success");
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

        <div className="intro-y box mt-3">
          <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">
              {t("Generate Observations with AI")}
            </h2>
          </div>

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
              <FormSelect
                value={numberOfRecords}
                onChange={(e) => setNumberOfRecords(parseInt(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </FormSelect>
            </div>

            <div className="text-right pt-4">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={loading}
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

            {generateFailed && (
              <div className="p-2 text-center text-red-500">
                {t("Failed to generate observations. Please try again.")}
              </div>
            )}
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
                          Consciousness
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
