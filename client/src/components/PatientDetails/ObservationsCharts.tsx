import React, { useEffect, useState } from "react";
import Button from "../Base/Button";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import { Observation } from "@/types/observation";
import {
  addObservationAction,
  getObservationsByIdAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";

import { FormInput, FormLabel } from "@/components/Base/Form";
import Alerts from "@/components/Alert";

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
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // 🔁 Fetch Observations
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
  };

  const handleSave = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      const obsPayload = {
        ...newObservation,
        patient_id: data.id,
        observations_by: userData.uid,
      };

      const saved = await addObservationAction(obsPayload);

      // ✅ Map snake_case keys to camelCase
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
        message: "Observations save successfully!",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Failed to save observation", err);
      setShowAlert({
        variant: "danger",
        message: "Failed to save observation",
      });
      setTimeout(() => setShowAlert(null), 3000);
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

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="p-4 bg-white shadow rounded-md">
        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`pb-2 font-semibold ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Buttons */}

        {(userRole === "admin" || userRole === "Superadmin") && (
          <div className="flex space-x-3 mb-4">
            <Button className="bg-primary text-white" onClick={handleAddClick}>
              {t("add_observations")}
            </Button>
          </div>
        )}

        {/* Add Observation Form */}
        {showForm && (
          <div className="p-4 border rounded-md mb-4 bg-gray-50">
            <h4 className="font-semibold mb-2"> {t("new_observation")}</h4>
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
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button className="bg-primary text-white" onClick={handleSave}>
                {t("save")}
              </Button>
              <Button
                className="bg-primary text-white"
                onClick={() => setShowForm(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Observation Table */}
        <div className="overflow-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-100">Vitals</th>
                {observations.map((obs, i) => (
                  <th key={i} className="p-2 border bg-gray-100">
                    {new Date(obs.created_at ?? "").toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
        </div>
      </div>
    </>
  );
};

export default ObservationsCharts;
