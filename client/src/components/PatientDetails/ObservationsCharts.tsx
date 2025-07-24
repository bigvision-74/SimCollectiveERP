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
import { getAdminOrgAction } from "@/actions/adminActions";
import { FormInput, FormLabel } from "@/components/Base/Form";
import Alerts from "@/components/Alert";

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

const ObservationsCharts: React.FC<Props> = ({ data }) => {
  const [activeTab, setActiveTab] = useState("Observations");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newObservation, setNewObservation] = useState(defaultObservation);
  const [userRole, setUserRole] = useState("");
  const [showGridChart, setShowGridChart] = useState(false);
  const [fluidInput, setFluidInput] = useState({ intake: "", output: "" });
  const [fluidEntries, setFluidEntries] = useState<
    { intake: string; output: string; timestamp: Date }[]
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

    // Respiratory Rate validation
    if (!newObservation.respiratoryRate) {
      newErrors.respiratoryRate = "Respiratory rate is required";
      isValid = false;
    } else if (isNaN(Number(newObservation.respiratoryRate))) {
      newErrors.respiratoryRate = "Must be a number";
      isValid = false;
    } else if (Number(newObservation.respiratoryRate) < 0) {
      newErrors.respiratoryRate = "Cannot be negative";
      isValid = false;
    }

    // O2 Sats validation
    if (!newObservation.o2Sats) {
      newErrors.o2Sats = "O2 Sats is required";
      isValid = false;
    } else if (isNaN(Number(newObservation.o2Sats))) {
      newErrors.o2Sats = "Must be a number";
      isValid = false;
    } else if (
      Number(newObservation.o2Sats) < 0 ||
      Number(newObservation.o2Sats) > 100
    ) {
      newErrors.o2Sats = "Must be between 0-100";
      isValid = false;
    }

    // SpO2 Scale validation
    if (!newObservation.spo2Scale) {
      newErrors.spo2Scale = "SpO2 Scale is required";
      isValid = false;
    }

    // Oxygen Delivery validation
    if (!newObservation.oxygenDelivery) {
      newErrors.oxygenDelivery = "Oxygen delivery is required";
      isValid = false;
    }

    // Blood Pressure validation
    if (!newObservation.bloodPressure) {
      newErrors.bloodPressure = "Blood pressure is required";
      isValid = false;
    } else if (!/^\d+\/\d+$/.test(newObservation.bloodPressure)) {
      newErrors.bloodPressure = "Format: systolic/diastolic (e.g. 120/80)";
      isValid = false;
    }

    // Pulse validation
    if (!newObservation.pulse) {
      newErrors.pulse = "Pulse is required";
      isValid = false;
    } else if (isNaN(Number(newObservation.pulse))) {
      newErrors.pulse = "Must be a number";
      isValid = false;
    } else if (Number(newObservation.pulse) < 0) {
      newErrors.pulse = "Cannot be negative";
      isValid = false;
    }

    // Consciousness validation
    if (!newObservation.consciousness) {
      newErrors.consciousness = "Consciousness is required";
      isValid = false;
    }

    // Temperature validation
    if (!newObservation.temperature) {
      newErrors.temperature = "Temperature is required";
      isValid = false;
    } else if (isNaN(Number(newObservation.temperature))) {
      newErrors.temperature = "Must be a number";
      isValid = false;
    } else {
      const temp = Number(newObservation.temperature);
      if (temp < 25) {
        newErrors.temperature = "Temperature too low (minimum 25°C)";
        isValid = false;
      } else if (temp > 45) {
        newErrors.temperature = "Temperature too high (maximum 45°C)";
        isValid = false;
      } else if (temp < 35 || temp > 41) {
        newErrors.temperature =
          "Warning: Abnormal temperature (normal range: 35-41°C)";
        // This is a warning rather than an error, so we don't set isValid to false
      }
    }

    // NEWS2 Score validation
    if (!newObservation.news2Score) {
      newErrors.news2Score = "NEWS2 Score is required";
      isValid = false;
    } else if (isNaN(Number(newObservation.news2Score))) {
      newErrors.news2Score = "Must be a number";
      isValid = false;
    } else if (Number(newObservation.news2Score) < 0) {
      newErrors.news2Score = "Cannot be negative";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const response = await getObservationsByIdAction(data.id);
        setObservations(response);

        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));
        setUserRole(userData.role);
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

      setObservations([formatted, ...observations]);
      setNewObservation(defaultObservation);
      setShowForm(false);
      setShowAlert({
        variant: "success",
        message: "Observations saved successfully!",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Failed to save observation", err);
      setShowAlert({
        variant: "danger",
        message: "Failed to save observation",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const vitals = [
    { key: "respiratoryRate", label: "Respiratory rate" },
    { key: "o2Sats", label: "O2 Sats (%)" },
    { key: "spo2Scale", label: "SpO2 Scale" },
    { key: "oxygenDelivery", label: "Oxygen delivery" },
    { key: "bloodPressure", label: "Blood pressure (mm/Hg)" },
    { key: "pulse", label: "Pulse (BPM)" },
    { key: "consciousness", label: "Consciousness" },
    { key: "temperature", label: "Temperature (Celsius)" },
    { key: "news2Score", label: "NEWS2 score" },
  ];

  // 👇 Chart parsing logic
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

  // fluid data logc
  // const handleSaveFluid = async () => {
  //   if (!fluidInput.intake && !fluidInput.output) return;

  //   try {
  //     const userEmail = localStorage.getItem("user");
  //     const userData = await getAdminOrgAction(String(userEmail));

  //     const payload: {
  //       patient_id: string;
  //       observations_by: string;
  //       fluid_intake: string;
  //       fluid_output: string;
  //     } = {
  //       patient_id: String(data.id),
  //       observations_by: String(userData.uid),
  //       fluid_intake: fluidInput.intake || "0",
  //       fluid_output: fluidInput.output || "0",
  //     };
  //     const saved = await saveFluidBalanceAction(payload);

  //     const newEntry = {
  //       intake: saved.fluid_intake,
  //       output: saved.fluid_output,
  //       timestamp: saved.created_at,
  //     };

  //     // setFluidEntries([newEntry, ...fluidEntries]);
  //     setFluidEntries((prev) => [newEntry, ...prev]);
  //     setFluidInput({ intake: "", output: "" });

  //     setShowAlert({
  //       variant: "success",
  //       message: "Fluid record saved successfully!",
  //     });
  //     setTimeout(() => setShowAlert(null), 3000);
  //   } catch (error) {
  //     console.error("Failed to save fluid balance", error);
  //     setShowAlert({
  //       variant: "danger",
  //       message: "Failed to save fluid record",
  //     });
  //     setTimeout(() => setShowAlert(null), 3000);
  //   }
  // };

  const handleSaveFluid = async () => {
    const newErrors = {
      intake: "",
      output: "",
    };

    let isValid = true;
    if (!fluidInput.intake && !fluidInput.output) {
      newErrors.intake = "At least one value is required";
      newErrors.output = "At least one value is required";
      isValid = false;
    } else {
      if (fluidInput.intake && isNaN(Number(fluidInput.intake))) {
        newErrors.intake = "Must be a number";
        isValid = false;
      }
      if (fluidInput.output && isNaN(Number(fluidInput.output))) {
        newErrors.output = "Must be a number";
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
      };

      setFluidEntries([newEntry, ...fluidEntries]);
      setFluidEntries((prev) => [newEntry, ...prev]);
      setFluidInput({ intake: "", output: "" });

      setShowAlert({
        variant: "success",
        message: "Fluid record saved successfully!",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to save fluid balance", error);
      setShowAlert({
        variant: "danger",
        message: "Failed to save fluid record",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fluidData = await getFluidBalanceByPatientIdAction(data.id);

        const formattedFluid = fluidData.map((entry: any) => ({
          intake: entry.fluid_intake,
          output: entry.fluid_output,
          timestamp: entry.created_at,
        }));

        setFluidEntries(formattedFluid);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setFluidEntries([]);
        } else {
          console.error("Failed to fetch fluid balance", err);
        }
      }
    };

    if (data?.id) fetchData();
  }, [data?.id]);

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="p-4 bg-white shadow rounded-md">
        {/* Tabs */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`pb-2 font-semibold ${
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Observation Form */}
        {showForm && (
          <div className="p-4 border rounded-md mb-4 bg-gray-50">
            <h4 className="font-semibold mb-2">{t("new_observation")}</h4>
            <div className="grid grid-cols-2 gap-4">
              {vitals.map((vital) => (
                <div key={vital.key}>
                  <FormLabel htmlFor={vital.key} className="font-normal">
                    {vital.label}
                  </FormLabel>
                  <FormInput
                    name={vital.key}
                    value={newObservation[vital.key as keyof Observation] ?? ""}
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

        {/* Observation Table */}
        {activeTab === "Observations" && (
          <div className="overflow-auto">
            <div className="flex justify-start space-x-4 mb-4">
              {(userRole === "admin" || userRole === "Superadmin") && (
                <Button
                  className="bg-primary text-white"
                  onClick={handleAddClick}
                >
                  {t("add_observations")}
                </Button>
              )}
              <Button
                className="bg-white border text-primary"
                onClick={() => setShowGridChart(!showGridChart)}
              >
                {showGridChart ? "Hide Chart View" : "Chart view"}
              </Button>
              <Button
                className="bg-white border text-primary"
                onClick={() => alert("Trigger & escalation info")}
              >
                Trigger & escalation info
              </Button>
            </div>

            {showGridChart ? (
              <div className="overflow-auto border border-gray-300">
                <div className="overflow-auto bg-white rounded-md p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Charts</h3>
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
                      { key: "pulse", label: "Pulse (BPM)", color: "#f1c40f" },
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
                        Blood Pressure (mm/Hg)
                      </h4>
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
              </div>
            ) : (
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr>
                    <th className="p-2 border bg-gray-100">Vitals</th>
                    {observations.map((obs, i) => (
                      <th key={i} className="p-2 border bg-gray-100">
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
          <div className="overflow-auto bg-white rounded-md p-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Observation Charts</h3>
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
                    <Line type="monotone" dataKey="value" stroke="#FF5733" />
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
                    <Line type="monotone" dataKey="value" stroke="#3498db" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Blood Pressure */}
              <div>
                <h4 className="font-semibold mb-2">Blood Pressure (mm/Hg)</h4>
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
          <div className="overflow-auto bg-white rounded-md p-4 shadow-md">
            {/* Only admin/superadmin can add entries */}
            {(userRole === "admin" || userRole === "Superadmin") && (
              <>
                <h3 className="text-lg font-semibold mb-4">Fluid Balance</h3>

                {/* Fluid Input Form */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <FormLabel htmlFor="intake" className="font-normal">
                      Fluid Intake (ml)
                    </FormLabel>
                    <FormInput
                      name="intake"
                      type="number"
                      min="0"
                      value={fluidInput.intake}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          // Only allow numbers
                          setFluidInput({ ...fluidInput, intake: value });
                          setFluidErrors((prev) => ({ ...prev, intake: "" }));
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
                      Fluid Output (ml)
                    </FormLabel>
                    <FormInput
                      name="output"
                      type="number"
                      min="0"
                      value={fluidInput.output}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          // Only allow numbers
                          setFluidInput({ ...fluidInput, output: value });
                          setFluidErrors((prev) => ({ ...prev, output: "" }));
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
                      !!fluidErrors.intake || !!fluidErrors.output || loading2
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

            {/* Fluid Balance Table */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">
                Fluid Records
              </h3>
              <span className="text-sm text-gray-600">
                Net Balance:{" "}
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
                  <th className="p-2 border bg-gray-100">Time</th>
                  <th className="p-2 border bg-gray-100">Intake (ml)</th>
                  <th className="p-2 border bg-gray-100">Output (ml)</th>
                </tr>
              </thead>
              <tbody>
                {fluidEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      No fluid balance records found.
                    </td>
                  </tr>
                ) : (
                  fluidEntries.map((entry, index) => (
                    <tr key={index}>
                      <td className="p-2 border">
                        {new Date(entry.timestamp).toLocaleString("en-GB")}
                      </td>
                      <td className="p-2 border text-center">{entry.intake}</td>
                      <td className="p-2 border text-center">{entry.output}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ObservationsCharts;
