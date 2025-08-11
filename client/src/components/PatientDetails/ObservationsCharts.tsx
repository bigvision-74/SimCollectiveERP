import React, { useEffect, useState } from "react";
import Button from "../Base/Button";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import { Observation } from "@/types/observation";
import {
  addObservationAction,
  getObservationsByIdAction,
  saveFluidBalanceAction,
  getFluidBalanceByPatientIdAction,
} from "@/actions/patientActions";
import {
  getAdminOrgAction,
  getFacultiesByIdAction,
} from "@/actions/adminActions";
import { FormInput, FormLabel } from "@/components/Base/Form";
import Alerts from "@/components/Alert";
import SubscriptionModal from "../SubscriptionModal.tsx";
import Lucide from "../Base/Lucide";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: Patient;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

const tabs = ["Observations", "Charting", "Fluid balance"];

const defaultObservation: Observation = {
  respiratoryRate: "",
  o2Sats: "",
  spo2Scale: "-",
  oxygenDelivery: "",
  bloodPressure: "",
  pulse: "",
  consciousness: "",
  temperature: "",
  news2Score: "",
  created_at: undefined,
};

const ObservationsCharts: React.FC<Props> = ({ data, onShowAlert }) => {
  const userrole = localStorage.getItem("role");
  const [activeTab, setActiveTab] = useState("Observations");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newObservation, setNewObservation] = useState(defaultObservation);
  const [userRole, setUserRole] = useState("");
  const [showGridChart, setShowGridChart] = useState(false);
  const [fluidInput, setFluidInput] = useState({ intake: "", output: "" });
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [fluidEntries, setFluidEntries] = useState<
    {
      intake: string;
      output: string;
      timestamp: Date;
      observer_fname: string;
      observer_lname: string;
    }[]
  >([]);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [fluidErrors, setFluidErrors] = useState({
    intake: "",
    output: "",
  });
  const [errors, setErrors] = useState({
    respiratoryRate: "",
    o2Sats: "",
    spo2Scale: "",
    oxygenDelivery: "",
    bloodPressure: "",
    pulse: "",
    consciousness: "",
    temperature: "",
    news2Score: "",
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      respiratoryRate: "",
      o2Sats: "",
      spo2Scale: "",
      oxygenDelivery: "",
      bloodPressure: "",
      pulse: "",
      consciousness: "",
      temperature: "",
      news2Score: "",
    };

    if (!newObservation.respiratoryRate) {
      newErrors.respiratoryRate = t("Respiratoryraterequired");
      isValid = false;
    } else if (isNaN(Number(newObservation.respiratoryRate))) {
      newErrors.respiratoryRate = t("Mustbenumber");
      isValid = false;
    } else if (Number(newObservation.respiratoryRate) < 0) {
      newErrors.respiratoryRate = t("Cannotbenegative");
      isValid = false;
    }

    if (!newObservation.o2Sats) {
      newErrors.o2Sats = t("O2Satsrequired");
      isValid = false;
    } else if (isNaN(Number(newObservation.o2Sats))) {
      newErrors.o2Sats = t("Mustbenumber");
      isValid = false;
    } else if (
      Number(newObservation.o2Sats) < 0 ||
      Number(newObservation.o2Sats) > 100
    ) {
      newErrors.o2Sats = t("Mustbetween100");
      isValid = false;
    }

    if (!newObservation.spo2Scale) {
      newErrors.spo2Scale = t("SpO2Scalerequired");
      isValid = false;
    }

    if (!newObservation.oxygenDelivery) {
      newErrors.oxygenDelivery = t("Oxygendeliveryrequired");
      isValid = false;
    }

    if (!newObservation.bloodPressure) {
      newErrors.bloodPressure = t("Bloodpressurerequired");
      isValid = false;
    } else if (!/^\d+\/\d+$/.test(newObservation.bloodPressure)) {
      newErrors.bloodPressure = t("Formatsystolicdiastolic");
      isValid = false;
    }

    if (!newObservation.pulse) {
      newErrors.pulse = t("Pulserequired");
      isValid = false;
    } else if (isNaN(Number(newObservation.pulse))) {
      newErrors.pulse = t("Mustbenumber");
      isValid = false;
    } else if (Number(newObservation.pulse) < 0) {
      newErrors.pulse = t("Cannotbenegative");
      isValid = false;
    }

    if (!newObservation.consciousness) {
      newErrors.consciousness = t("Consciousnessrequired");
      isValid = false;
    }

    if (!newObservation.temperature) {
      newErrors.temperature = t("Temperaturerequired");
      isValid = false;
    } else if (isNaN(Number(newObservation.temperature))) {
      newErrors.temperature = t("Mustbenumber");
      isValid = false;
    } else {
      const temp = Number(newObservation.temperature);
      if (temp < 35) {
        newErrors.temperature = t("Temperaturetoolow25");
        isValid = false;
      } else if (temp > 41) {
        newErrors.temperature = t("Temperaturetoohigh41");
        isValid = false;
      } else if (temp < 35 || temp > 41) {
        newErrors.temperature = t("WarningAbnormalnormalrange");
      }
    }

    if (!newObservation.news2Score) {
      newErrors.news2Score = t("NEWS2Scorerequired");
      isValid = false;
    } else if (isNaN(Number(newObservation.news2Score))) {
      newErrors.news2Score = t("Mustbenumber");
      isValid = false;
    } else if (Number(newObservation.news2Score) < 0) {
      newErrors.news2Score = t("Cannotbenegative");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));
        setUserRole(userData.role);
        setSubscriptionPlan(userData.planType || "Free");

        if (userData.planType !== "Free") {
          const response = await getObservationsByIdAction(data.id);
          setObservations(response);
        }
      } catch (err) {
        console.error("Failed to fetch observations", err);
      }
    };

    if (data?.id) fetchObservations();
  }, [data?.id]);

  const handleAddClick = () => setShowForm(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewObservation({ ...newObservation, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      const obsPayload = {
        ...newObservation,
        patient_id: data.id,
        observations_by: userData.uid,
      };

      const saved = await addObservationAction(obsPayload);

      const formatted: Observation = {
        id: saved.id,
        patient_id: saved.patient_id,
        respiratoryRate: saved.respiratory_rate,
        o2Sats: saved.o2_sats,
        spo2Scale: saved.spo2_scale,
        oxygenDelivery: saved.oxygen_delivery,
        bloodPressure: saved.blood_pressure,
        pulse: saved.pulse,
        consciousness: saved.consciousness,
        temperature: saved.temperature,
        news2Score: saved.news2_score,
        created_at: saved.created_at,
      };

      const userData1 = await getAdminOrgAction(String(userEmail));

      const facultiesIds = await getFacultiesByIdAction(
        Number(userData1.orgid)
      );

      if (Array.isArray(facultiesIds) && facultiesIds.length > 0) {
        await sendNotificationToAddNoteAction(facultiesIds, userData1.uid, [
          obsPayload,
        ]);
      }

      // await sendNotificationToAddNoteAction(facultiesIds, userData1.uid, [
      //   obsPayload,
      // ]);

      setObservations([formatted, ...observations]);
      setNewObservation(defaultObservation);
      setShowForm(false);
      onShowAlert({
        variant: "success",
        message: t("Observationssavedsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Failed to save observation", err);
      onShowAlert({
        variant: "danger",
        message: t("Failedsaveobservation"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const vitals = [
    { key: "respiratoryRate", label: t("Respiratoryrate") },
    { key: "o2Sats", label: t("O2Sats") },
    { key: "spo2Scale", label: t("SpO2Scale") },
    { key: "oxygenDelivery", label: t("Oxygendelivery") },
    { key: "bloodPressure", label: t("Bloodpressure") },
    { key: "pulse", label: t("Pulse") },
    { key: "consciousness", label: t("Consciousness") },
    { key: "temperature", label: t("Temperature") },
    { key: "news2Score", label: t("NEWS2score") },
  ];

  const parseChartData = (key: keyof Observation, isBP = false) => {
    return observations.map((obs) => {
      const label = new Date(obs.created_at ?? "").toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });

      const val = obs[key];

      if (isBP && typeof val === "string") {
        const [systolic, diastolic] = val.split("/").map(Number);
        return { name: label, systolic, diastolic };
      }

      return { name: label, value: Number(val) };
    });
  };

  const netBalance = fluidEntries.reduce((acc, entry) => {
    const intake = parseInt(entry.intake || "0");
    const output = parseInt(entry.output || "0");
    return acc + (intake - output);
  }, 0);

  const handleSaveFluid = async () => {
    const newErrors = {
      intake: "",
      output: "",
    };

    let isValid = true;
    if (!fluidInput.intake && !fluidInput.output) {
      newErrors.intake = t("Atleastrequired");
      newErrors.output = t("Atleastrequired");
      isValid = false;
    } else {
      if (fluidInput.intake && isNaN(Number(fluidInput.intake))) {
        newErrors.intake = t("Mustbenumber");
        isValid = false;
      }
      if (fluidInput.output && isNaN(Number(fluidInput.output))) {
        newErrors.output = t("Mustbenumber");
        isValid = false;
      }
    }

    setFluidErrors(newErrors);
    if (!isValid) return;
    setLoading2(true);

    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      const payload = {
        patient_id: String(data.id),
        observations_by: String(userData.uid),
        fluid_intake: fluidInput.intake || "0",
        fluid_output: fluidInput.output || "0",
      };

      const saved = await saveFluidBalanceAction(payload);
      const newEntry = {
        intake: saved.fluid_intake,
        output: saved.fluid_output,
        timestamp: saved.created_at,
        observer_fname: userData.fname,
        observer_lname: userData.lname,
      };

      const userData1 = await getAdminOrgAction(String(userEmail));

      const facultiesIds = await getFacultiesByIdAction(
        Number(userData1.orgid)
      );

      // await sendNotificationToAddNoteAction(facultiesIds, userData1.uid, [
      //   payload,
      // ]);

      if (Array.isArray(facultiesIds) && facultiesIds.length > 0) {
        await sendNotificationToAddNoteAction(facultiesIds, userData1.uid, [
          payload,
        ]);
      }

      setFluidEntries([newEntry, ...fluidEntries]);
      setFluidInput({ intake: "", output: "" });

      onShowAlert({
        variant: "success",
        message: t("Fluidrecordsavedsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to save fluid balance", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedsavefluidrecord"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // if (subscriptionPlan !== "Free") {
        const fluidData = await getFluidBalanceByPatientIdAction(data.id);
        const formattedFluid = fluidData.map((entry: any) => ({
          intake: entry.fluid_intake,
          output: entry.fluid_output,
          timestamp: entry.created_at,
          observer_fname: entry.observer_fname,
          observer_lname: entry.observer_lname,
        }));
        setFluidEntries(formattedFluid);
        // }
        console.log(formattedFluid, "formattedFluid");
      } catch (err: any) {
        if (err.response?.status === 404) {
          setFluidEntries([]);
        } else {
          console.error("Failed to fetch fluid balance", err);
        }
      }
    };

    if (data?.id) fetchData();
  }, [data?.id, subscriptionPlan]);

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  const upgradePrompt = (featureName: string) => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center border border-blue-100 my-4">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Lucide icon="Lock" className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-3">
        {featureName} {t("Locked")}
      </h3>
      <p className="text-blue-700 mb-6">{t("Thisfeatureonlyavailable")}</p>
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setShowUpsellModal(true)}
          variant="primary"
          className="px-6"
        >
          {t("ViewPlans")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* {showAlert && <Alerts data={showAlert} />} */}
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />
      <div className="p-3">
        {/* Responsive Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1 sm:px-0 sm:py-0 sm:pb-2 text-sm sm:text-base font-semibold ${
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  setShowForm(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Observation Form */}
        {showForm &&
          (userRole === "Superadmin" || subscriptionPlan !== "Free") && (
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
              <h4 className="font-semibold mb-2">{t("new_observation")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vitals.map((vital) => (
                  <div key={vital.key}>
                    <FormLabel htmlFor={vital.key} className="font-normal">
                      {vital.label}
                    </FormLabel>

                    <FormInput
                      name={vital.key}
                      value={
                        newObservation[vital.key as keyof Observation] ?? ""
                      }
                      onChange={handleInputChange}
                      className={
                        errors[vital.key as keyof typeof errors]
                          ? "border-danger"
                          : ""
                      }
                    />
                    {errors[vital.key as keyof typeof errors] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[vital.key as keyof typeof errors]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button className="bg-primary text-white" onClick={handleSave}>
                  {loading ? (
                    <div className="loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : (
                    t("save")
                  )}
                </Button>
                <Button
                  className="bg-primary text-white"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({
                      respiratoryRate: "",
                      o2Sats: "",
                      spo2Scale: "",
                      oxygenDelivery: "",
                      bloodPressure: "",
                      pulse: "",
                      consciousness: "",
                      temperature: "",
                      news2Score: "",
                    });
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}

        {subscriptionPlan === "Free" && userrole === "Admin" ? (
          upgradePrompt(activeTab)
        ) : (
          <>
            {/* Observation Table */}
            {activeTab === "Observations" && (
              <div className="overflow-x-auto p-2">
                <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-4">
                  {(userRole === "Admin" ||
                    userRole === "Superadmin" ||
                    userRole === "User") && (
                    <Button
                      className="bg-primary text-white w-full sm:w-auto"
                      onClick={handleAddClick}
                    >
                      {t("add_observations")}
                    </Button>
                  )}
                  <Button
                    className="bg-white border text-primary w-full sm:w-auto"
                    onClick={() => setShowGridChart(!showGridChart)}
                  >
                    {showGridChart ? t("HideChartView") : t("Chartview")}
                  </Button>
                  <Button
                    className="bg-white border text-primary w-full sm:w-auto"
                    onClick={() => alert("Trigger & escalation info")}
                  >
                    {t("Triggerescalationinfo")}
                  </Button>
                </div>

                {showGridChart ? (
                  <div className="overflow-auto border border-gray-300">
                    <div className="overflow-auto bg-white rounded-md p-4 shadow-md">
                      <h3 className="text-lg font-semibold mb-4">
                        {t("Charts")}
                      </h3>
                      <div className="grid gap-8">
                        {[
                          {
                            key: "respiratoryRate",
                            label: "Respirations",
                            color: "#FF5733",
                          },
                          {
                            key: "o2Sats",
                            label: "O2 Saturation (%)",
                            color: "#3498db",
                          },
                          {
                            key: "pulse",
                            label: "Pulse (BPM)",
                            color: "#f1c40f",
                          },
                          {
                            key: "temperature",
                            label: "Temperature (Celsius)",
                            color: "#d35400",
                          },
                          {
                            key: "news2Score",
                            label: "NEWS2 Score",
                            color: "#c0392b",
                          },
                        ].map(({ key, label, color }) => (
                          <div key={key}>
                            <h4 className="font-semibold mb-2">{label}</h4>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart
                                data={parseChartData(key as keyof Observation)}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={color}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ))}

                        {/* Blood Pressure */}
                        <div>
                          <h4 className="font-semibold mb-2">
                            {t("BloodPressure")}
                          </h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                              data={parseChartData("bloodPressure", true)}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="systolic"
                                stroke="#8e44ad"
                                name="Systolic"
                              />
                              <Line
                                type="monotone"
                                dataKey="diastolic"
                                stroke="#27ae60"
                                name="Diastolic"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 border bg-gray-100">
                          {t("Vitals")}
                        </th>
                        {observations.map((obs, i) => (
                          <th
                            key={i}
                            className="p-2 border bg-gray-100 text-center"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-600">
                                {new Date(obs.created_at ?? "").toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>

                              <p className="text-xs text-gray-500 mt-2">
                                {t("by")}:- {obs.observer_fname}{" "}
                                {obs.observer_lname}
                              </p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {vitals.map((vital) => (
                        <tr key={vital.key}>
                          <td className="p-2 border font-medium bg-gray-50">
                            {vital.label}
                          </td>
                          {observations.map((obs, i) => (
                            <td key={i} className="p-2 border text-center">
                              {obs[vital.key as keyof Observation]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Chart View */}
            {activeTab === "Charting" && (
              <div className="overflow-auto">
                <h3 className="text-lg font-semibold mb-4">
                  {t("ObservationCharts")}
                </h3>
                <div className="grid gap-8">
                  {/* Respiration */}
                  <div>
                    <h4 className="font-semibold mb-2">Respirations</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={parseChartData("respiratoryRate")}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#FF5733"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* O2 Sats */}
                  <div>
                    <h4 className="font-semibold mb-2">O2 Saturation (%)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={parseChartData("o2Sats")}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3498db"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Blood Pressure */}
                  <div>
                    <h4 className="font-semibold mb-2">{t("BloodPressure")}</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={parseChartData("bloodPressure", true)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="systolic"
                          stroke="#8e44ad"
                          name="Systolic"
                        />
                        <Line
                          type="monotone"
                          dataKey="diastolic"
                          stroke="#27ae60"
                          name="Diastolic"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Fluid balance View */}
            {activeTab === "Fluid balance" && (
              <div className="overflow-auto">
                {(userRole === "Admin" ||
                  userRole === "Superadmin" ||
                  userRole === "User") && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("FluidBalance")}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <FormLabel htmlFor="intake" className="font-normal">
                          {t("FluidIntake")}
                        </FormLabel>
                        <FormInput
                          name="intake"
                          type="number"
                          min="0"
                          value={fluidInput.intake}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setFluidInput({ ...fluidInput, intake: value });
                              setFluidErrors((prev) => ({
                                ...prev,
                                intake: "",
                              }));
                            }
                          }}
                          className={fluidErrors.intake ? "border-danger" : ""}
                          placeholder="Enter intake volume"
                        />
                        {fluidErrors.intake && (
                          <p className="text-red-500 text-xs mt-1">
                            {fluidErrors.intake}
                          </p>
                        )}
                      </div>
                      <div>
                        <FormLabel htmlFor="output" className="font-normal">
                          {t("FluidOutput")}
                        </FormLabel>
                        <FormInput
                          name="output"
                          type="number"
                          min="0"
                          value={fluidInput.output}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setFluidInput({ ...fluidInput, output: value });
                              setFluidErrors((prev) => ({
                                ...prev,
                                output: "",
                              }));
                            }
                          }}
                          className={fluidErrors.output ? "border-danger" : ""}
                          placeholder="Enter output volume"
                        />
                        {fluidErrors.output && (
                          <p className="text-red-500 text-xs mt-1">
                            {fluidErrors.output}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mb-6">
                      <Button
                        className="bg-primary text-white"
                        onClick={handleSaveFluid}
                        disabled={
                          !!fluidErrors.intake ||
                          !!fluidErrors.output ||
                          loading2
                        }
                      >
                        {loading2 ? (
                          <div className="loader">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        ) : (
                          t("saveEntry")
                        )}
                      </Button>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {t("FluidRecords")}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {t("NetBalance")}:{" "}
                    <span
                      className={`font-semibold ${
                        netBalance > 0
                          ? "text-green-600"
                          : netBalance < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {netBalance} ml
                    </span>
                  </span>
                </div>

                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border text-left bg-gray-100">
                        {t("Time")}
                      </th>
                      <th className="p-2 border text-left bg-gray-100">
                        {t("Intake")}
                      </th>
                      <th className="p-2 border text-left bg-gray-100">
                        {t("Output")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluidEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-4 text-center text-gray-500"
                        >
                          {t("Nofluidrecordsfound")}
                        </td>
                      </tr>
                    ) : (
                      fluidEntries.map((entry, index) => (
                        <tr key={index}>
                          <td className="p-2 border">
                            <div className="flex justify-between items-center">
                              <span>
                                {new Date(entry.timestamp).toLocaleString(
                                  "en-GB"
                                )}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {t("by")}:- {entry.observer_fname}{" "}
                                {entry.observer_lname}
                              </span>
                            </div>
                          </td>

                          <td className="p-2 border">{entry.intake}</td>
                          <td className="p-2 border">{entry.output}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ObservationsCharts;
