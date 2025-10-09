import React, { useEffect, useState } from "react";
import Button from "../Base/Button";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import { Observation } from "@/types/observation";
import {
  addObservationAction,
  getObservationsByIdAction,
  getFluidBalanceByIdAction,
  saveFluidBalanceAction,
  getFluidBalanceByPatientIdAction,
  getExportDataAction,
} from "@/actions/patientActions";
import {
  getAdminOrgAction,
  getFacultiesByIdAction,
} from "@/actions/adminActions";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/Base/Form";
import Alerts from "@/components/Alert";
import SubscriptionModal from "../SubscriptionModal.tsx";
import Lucide from "../Base/Lucide";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import { useAppContext } from "@/contexts/sessionContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";
import "./style.css";
import { Timestamp } from "firebase/firestore";
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
  oxygenDelivery: "",
  bloodPressure: "",
  pulse: "",
  consciousness: "",
  temperature: "",
  news2Score: "",
  created_at: undefined,
  time_stamp: undefined,
};

type Fluids = {
  intake: string;
  type: string;
  units: string;
  duration: string;
  route: string;
  timestamp: string;
  notes: string;
  id?: number;
  patient_id?: number;
  created_at?: any;
  formatted_timestamp?: any;
  fname?: any;
  lname?: any;
};

const ObservationsCharts: React.FC<Props> = ({ data, onShowAlert }) => {
  const userrole = localStorage.getItem("role");
  const [activeTab, setActiveTab] = useState("Observations");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showForm1, setShowForm1] = useState(false);
  const [newObservation, setNewObservation] = useState(defaultObservation);
  const [fluidBalance, setFluidBalance] = useState<Fluids[]>([]);
  const [userRole, setUserRole] = useState("");
  const [showGridChart, setShowGridChart] = useState(false);
  const [fluidInput, setFluidInput] = useState<Fluids>({
    intake: "",
    type: "",
    units: "500",
    duration: "",
    route: "",
    timestamp: "",
    notes: "",
  });
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const { sessionInfo } = useAppContext();
  const [customTimestamp, setCustomTimestamp] = useState<string>("");
  const [fluidEntries, setFluidEntries] = useState<
    {
      intake: string;
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
    type: "",
    units: "",
    duration: "",
    route: "",
    timestamp: "",
    notes: "",
  });
  const [errors, setErrors] = useState({
    respiratoryRate: "",
    o2Sats: "",
    oxygenDelivery: "",
    bloodPressure: "",
    pulse: "",
    consciousness: "",
    temperature: "",
    news2Score: "",
    timestamp: "",
  });

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);

    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);

    const currentDate = new Date();

    return currentDate > expirationDate;
  }

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      respiratoryRate: "",
      o2Sats: "",
      oxygenDelivery: "",
      bloodPressure: "",
      pulse: "",
      consciousness: "",
      temperature: "",
      news2Score: "",
      timestamp: "",
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

    // if (!newObservation.news2Score) {
    //   newErrors.news2Score = t("NEWS2Scorerequired");
    //   isValid = false;
    // } else
    if (isNaN(Number(newObservation.news2Score))) {
      newErrors.news2Score = t("Mustbenumber");
      isValid = false;
    } else if (Number(newObservation.news2Score) < 0) {
      newErrors.news2Score = t("Cannotbenegative");
      isValid = false;
    }

    // Validate timestamp
    // if (customTimestamp) {
    //   const timestampDate = new Date(customTimestamp);
    //   if (isNaN(timestampDate.getTime())) {
    //     newErrors.timestamp = t("Invaliddateformat");
    //     isValid = false;
    //   }
    // }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));

        setUserRole(userData.role);
        setSubscriptionPlan(userData.planType);
        setPlanDate(userData.planDate);

        // if (userData.planType !== "free") {
        const response = await getObservationsByIdAction(
          data.id,
          userData.orgid
        );
        setObservations(response);
        // }
      } catch (err) {
        console.error("Failed to fetch observations", err);
      }
    };

    if (data?.id) fetchObservations();
  }, [data?.id]);

  const calculateNEWS2 = (data: any) => {
    let score = 0;

    const respRate = Number(data.respiratoryRate);
    const o2Sats = Number(data.o2Sats);
    const bp = Number(data.bloodPressure);
    const pulse = Number(data.pulse);
    const temp = Number(data.temperature);
    const oxygenDelivery = data.oxygenDelivery?.toLowerCase();
    const consciousness = data.consciousness?.toLowerCase();

    // Respiratory Rate
    if (respRate <= 8 || respRate >= 25) score += 3;
    else if (respRate >= 21 && respRate <= 24) score += 2;
    else if (respRate >= 9 && respRate <= 11) score += 1;

    // O2 Saturations
    if (o2Sats <= 91) score += 3;
    else if (o2Sats >= 92 && o2Sats <= 93) score += 2;
    else if (o2Sats >= 94 && o2Sats <= 95) score += 1;

    // Oxygen delivery
    if (oxygenDelivery && oxygenDelivery !== "room air") score += 2;

    // Blood Pressure
    if (bp <= 90 || bp >= 220) score += 3;
    else if (bp >= 91 && bp <= 100) score += 2;
    else if (bp >= 101 && bp <= 110) score += 1;

    // Pulse
    if (pulse <= 40 || pulse >= 131) score += 3;
    else if (pulse >= 111 && pulse <= 130) score += 2;
    else if ((pulse >= 41 && pulse <= 50) || (pulse >= 91 && pulse <= 110))
      score += 1;

    // Consciousness
    if (consciousness && consciousness !== "alert") score += 3;

    // Temperature
    if (temp <= 35 || temp >= 39.1) score += 3;
    else if (temp >= 38.1 && temp <= 39.0) score += 2;
    else if (temp >= 35.1 && temp <= 36.0) score += 1;

    return score;
  };

  useEffect(() => {
    const fetchFuildBalance = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));

        setUserRole(userData.role);
        setSubscriptionPlan(userData.planType);
        setPlanDate(userData.planDate);

        const response = await getFluidBalanceByIdAction(
          data.id,
          userData.orgid
        );
        setFluidBalance(response);
      } catch (err) {
        console.error("Failed to fetch fluid", err);
      }
    };

    if (data?.id) fetchFuildBalance();
  }, [data?.id]);

  const handleAddClick1 = () => setShowForm1(true);

  const handleAddClick = () => {
    setCustomTimestamp("");
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewObservation((prev) => {
      const updated = { ...prev, [name]: value };

      // If user changed any vital field (not the score itself)
      if (name !== "news2Score") {
        const calculatedScore = calculateNEWS2(updated);
        updated.news2Score = calculatedScore.toString();
      }

      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomTimestamp(value);
    setErrors((prev) => ({ ...prev, timestamp: "" }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      // const timestamp = customTimestamp
      //   ? new Date(customTimestamp).toISOString()
      //   : new Date().toISOString();

      // Timestamp logic
      const timestamp = customTimestamp
        ? customTimestamp // user can type anything manually
        : new Date().toISOString(); // fallback to current time

      const obsPayload = {
        ...newObservation,
        patient_id: data.id,
        observations_by: userData.uid,
        organisation_id: userData.orgid,
        sessionId: sessionInfo.sessionId,
        time_stamp: timestamp,
      };

      const saved = await addObservationAction(obsPayload);

      const formatted: Observation = {
        id: saved.id,
        patient_id: saved.patient_id,
        respiratoryRate: saved.respiratory_rate,
        o2Sats: saved.o2_sats,
        oxygenDelivery: saved.oxygen_delivery,
        bloodPressure: saved.blood_pressure,
        pulse: saved.pulse,
        consciousness: saved.consciousness,
        temperature: saved.temperature,
        news2Score: saved.news2_score,
        created_at: saved.created_at,
        // time_stamp: saved.time_stamp || timestamp,
        observer_fname: userData.fname,
        observer_lname: userData.lname,
        time_stamp: saved.time_stamp,
      };

      const userData1 = await getAdminOrgAction(String(userEmail));

      const payloadData = {
        title: `Observation Added`,
        body: `A New Observation Added by ${userData1.username}`,
        created_by: userData1.uid,
        patient_id: data.id,
      };

      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData1.orgid,
          sessionInfo.sessionId
        );
      }

      setObservations([formatted, ...observations]);
      setNewObservation(defaultObservation);
      setCustomTimestamp("");
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
    { key: "oxygenDelivery", label: t("Oxygendelivery") },
    { key: "bloodPressure", label: t("Bloodpressure") },
    { key: "pulse", label: t("Pulse") },
    { key: "consciousness", label: t("Consciousness") },
    { key: "temperature", label: t("Temperature") },
    { key: "news2Score", label: t("NEWS2score") },
  ];

  const FluidVitals = [
    { key: "fluid_intake", label: t("Type") },
    { key: "type", label: t("subType") },
    { key: "units", label: t("units_volume") },
    { key: "duration", label: t("rate_duration") },
    { key: "route", label: t("route_site") },
    { key: "formatted_timestamp", label: t("TimeStamp") },
    { key: "notes", label: t("notes") },
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

  // Validation function (outside your submit handler)
  const handleValidate = (fluidInput: any, t: any, setFluidErrors: any) => {
    const newErrors = {
      intake: "",
      type: "",
      units: "",
      duration: "",
      route: "",
      timestamp: "",
      notes: "",
    };

    let isValid = true;

    // Required fields (skip notes)
    if (!fluidInput.intake) {
      newErrors.intake = t("Thisfieldrequired");
      isValid = false;
    }

    if (!fluidInput.type) {
      newErrors.type = t("Thisfieldrequired");
      isValid = false;
    }

    if (!fluidInput.units || fluidInput.units.trim() === "") {
      newErrors.units = t("Thisfieldrequired");
      isValid = false;
    }

    if (!fluidInput.duration) {
      newErrors.duration = t("Thisfieldrequired");
      isValid = false;
    }

    if (!fluidInput.route) {
      newErrors.route = t("Thisfieldrequired");
      isValid = false;
    }

    if (!fluidInput.timestamp) {
      newErrors.timestamp = t("Thisfieldrequired");
      isValid = false;
    }

    // Update errors state
    setFluidErrors(newErrors);

    return isValid;
  };

  const handleSaveFluid = async () => {
    const isValid = handleValidate(fluidInput, t, setFluidErrors);
    if (!isValid) return;
    setLoading2(true);

    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      const payload = {
        patient_id: String(data.id),
        sessionId: Number(sessionInfo.sessionId),
        observations_by: String(userData.uid),
        organisation_id: String(userData.orgid),
        fluid_intake: fluidInput.intake || "0",
        type: fluidInput.type,
        units: fluidInput.units || "500",
        duration: fluidInput.duration,
        route: fluidInput.route,
        timestamp: fluidInput.timestamp,
        notes: fluidInput.notes,
      };

      const saved = await saveFluidBalanceAction(payload);

      const formattedTimestamp = new Date(saved.created_at)
        .toISOString()
        .replace("T", " ")
        .slice(0, 16);

      const newEntry = {
        id: saved.id,
        fluid_intake: saved.fluid_intake,
        fluid_output: saved.fluid_output || null,
        type: saved.type,
        units: saved.units,
        duration: saved.duration,
        route: saved.route,
        timestamp: saved.timestamp,
        created_at: saved.created_at,
        fname: userData.fname,
        lname: userData.lname,
        formatted_timestamp: formattedTimestamp,
        notes: saved.notes,
      };
      const userData1 = await getAdminOrgAction(String(userEmail));

      const payloadData = {
        title: `Fuild Added`,
        body: `A New Fuild Added by ${userData1.username}`,
        created_by: userData1.uid,
        patient_id: data.id,
      };

      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData1.orgid,
          sessionInfo.sessionId
        );
      }
      setFluidBalance((prev: any[]) => [newEntry, ...prev]);

      // Optional: if you have a separate "entries" array
      setFluidEntries((prev: any[]) => [newEntry, ...prev]);
      setShowForm1(false);
      setFluidInput({
        intake: "",
        type: "",
        units: "",
        duration: "",
        route: "",
        timestamp: "",
        notes: "",
      });

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
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));

        const fluidData = await getFluidBalanceByPatientIdAction(
          data.id,
          userData.orgid
        );

        const formattedFluid = fluidData.map((entry: any) => ({
          intake: entry.fluid_intake,
          timestamp: entry.created_at,
          observer_fname: entry.observer_fname,
          observer_lname: entry.observer_lname,
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
  }, [data?.id, subscriptionPlan]);

  const handleExportCSV = async () => {
    try {
      const csvBlob = await getExportDataAction();

      // Create a temporary download link
      const url = window.URL.createObjectURL(csvBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fluid_balance.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setFluidEntries([]);
      } else {
        console.error("Failed to fetch fluid balance", err);
      }
    }
  };

  const parseFluidChartData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];

    // Sort chronologically by timestamp
    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.formatted_timestamp).getTime() -
        new Date(b.formatted_timestamp).getTime()
    );

    let cumulative = 0;

    return sorted.map((entry) => {
      const direction = entry.fluid_intake?.toLowerCase() || ""; // "intake" or "output"
      const volume = Number(entry.units) || 0; // numerical value

      // Intake = positive, Output = negative
      const intake = direction.includes("intake") ? volume : 0;
      const output = direction.includes("output") ? volume : 0;

      // Cumulative balance (intake - output)
      cumulative += intake - output;

      return {
        time: new Date(entry.formatted_timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        intake,
        output: -output, // negative for downward bars
        cumulative,
      };
    });
  };

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

  const isFreePlanLimitReached =
    subscriptionPlan === "free" && userrole === "Admin";

  const isPerpetualLicenseExpired =
    subscriptionPlan === "5 Year Licence" && userrole === "Admin";

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
                  setShowForm1(false);
                }}
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

            {/* Timestamp Input  */}
            <div className="mb-4">
              <FormLabel htmlFor="timestamp" className="font-normal">
                {t("time_stamp")}
              </FormLabel>
              <FormInput
                // type="datetime-local"
                type="text"
                name="timestamp"
                value={customTimestamp}
                // onChange={handleTimestampChange}
                onChange={(e) => setCustomTimestamp(e.target.value)}
                className={errors.timestamp ? "border-danger" : ""}
              />
              {errors.timestamp && (
                <p className="text-red-500 text-xs mt-1">{errors.timestamp}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vitals.map((vital) => (
                <div key={vital.key}>
                  <FormLabel htmlFor={vital.key} className="font-normal">
                    {vital.label}
                  </FormLabel>

                  {vital.key === "oxygenDelivery" ? (
                    <FormSelect
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
                    >
                      <option value="">Select Oxygen Delivery</option>
                      <option value="Room Air">Room Air</option>
                      <option value="Nasal Cannula">Nasal Cannula</option>
                      <option value="Simple Face Mask">Simple Face Mask</option>
                      <option value="Venturi Mask">Venturi Mask</option>
                      <option value="Non-Rebreather Mask">
                        Non-Rebreather Mask
                      </option>
                      <option value="Partial Rebreather Mask">
                        Partial Rebreather Mask
                      </option>
                      <option value="High-Flow Nasal Cannula (HFNC)">
                        High-Flow Nasal Cannula (HFNC)
                      </option>
                      <option value="CPAP">CPAP</option>
                      <option value="BiPAP">BiPAP</option>
                      <option value="Mechanical Ventilation">
                        Mechanical Ventilation
                      </option>
                    </FormSelect>
                  ) : (
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
                      readOnly={vital.key === "news2Score"}
                    />
                  )}

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
                    oxygenDelivery: "",
                    bloodPressure: "",
                    pulse: "",
                    consciousness: "",
                    temperature: "",
                    news2Score: "",
                    timestamp: "",
                  });
                  setCustomTimestamp("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* {userrole === "Admin" && ( */}
        <>
          {/* Observation Table */}
          {activeTab === "Observations" && (
            <div className="overflow-x-auto p-2">
              <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-4">
                {(userRole === "Admin" ||
                  userRole === "Faculty" ||
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
                              margin={{
                                top: 5,
                                right: 10,
                                left: 0,
                                bottom: 30, // Extra space for rotated labels
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis tick={{ fontSize: 10 }} width={30} />
                              <Tooltip
                                wrapperStyle={{
                                  fontSize: "12px",
                                  pointerEvents: "auto",
                                }}
                                contentStyle={{ borderRadius: "6px" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
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
                            margin={{
                              top: 5,
                              right: 10,
                              left: 0,
                              bottom: 30,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis tick={{ fontSize: 10 }} width={30} />
                            <Tooltip
                              wrapperStyle={{ fontSize: "12px" }}
                              contentStyle={{ borderRadius: "6px" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="systolic"
                              stroke="#8e44ad"
                              name="Systolic"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="diastolic"
                              stroke="#27ae60"
                              name="Diastolic"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
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
                      <th className="p-2 border bg-gray-100">{t("Vitals")}</th>
                      {observations.map((obs, i) => (
                        <th
                          key={i}
                          className="p-2 border bg-gray-100 text-center"
                        >
                          <div className="flex flex-col items-center">
                            {/* <span className="text-xs text-gray-600">
                                {new Date(obs.time_stamp ?? "").toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span> */}
                            <span className="text-xs text-gray-600">
                              {(() => {
                                const ts = obs.time_stamp ?? "";
                                const d = new Date(ts);
                                return isNaN(d.getTime())
                                  ? ts
                                  : d.toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                              })()}
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
                  <h4 className="font-semibold mb-2">{t("Respirations")}</h4>
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
                  <h4 className="font-semibold mb-2">
                    {t("O2_saturation")} (%)
                  </h4>
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
            <div className="overflow-x-auto">
              {/* <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-4">
                {(userRole === "Admin" ||
                  userRole === "Faculty" ||
                  userRole === "User") && (
                  <>
                    <Button
                      className="bg-primary text-white w-full sm:w-auto"
                      onClick={handleAddClick1}
                    >
                      {t("add_fluid")}
                    </Button>

                    <Button
                      onClick={handleExportCSV}
                      className="bg-white border text-primary w-full sm:w-auto"
                    >
                      {t("ExportCSV")}
                    </Button>
                  </>
                )}
              </div> */}
              <div className="overflow-auto">
                {(userRole === "Admin" ||
                  userRole === "Faculty" ||
                  userRole === "User") &&
                  showForm1 && (
                    <>
                      <div className="p-4 border rounded-md mb-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-primary mb-4">
                          {t("FluidBalance")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Intake Type */}
                          <div>
                            <FormLabel htmlFor="intake" className="font-normal">
                              {t("type")}
                            </FormLabel>
                            <FormSelect
                              name="intake"
                              value={fluidInput.intake}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({ ...fluidInput, intake: value });

                                // ✅ Clear error on select
                                if (fluidErrors.intake && value.trim() !== "") {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    intake: "",
                                  }));
                                }
                              }}
                              className={`form-select w-full ${
                                fluidErrors.intake ? "border-danger" : ""
                              }`}
                            >
                              <option value="">{t("SelectType")}</option>
                              <option value="Intake">Intake</option>
                              <option value="Output">Output</option>
                            </FormSelect>
                            {fluidErrors.intake && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.intake}
                              </p>
                            )}
                          </div>

                          {/* SubType */}
                          <div>
                            <FormLabel htmlFor="type" className="font-normal">
                              {t("subType")}
                            </FormLabel>
                            <FormSelect
                              name="type"
                              value={fluidInput.type}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({ ...fluidInput, type: value });

                                // ✅ Clear error on select
                                if (fluidErrors.type && value.trim() !== "") {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    type: "",
                                  }));
                                }
                              }}
                              className={`form-select w-full ${
                                fluidErrors.type ? "border-danger" : ""
                              }`}
                            >
                              <option value="">{t("SelectSubType")}</option>
                              <option value="Oral">Oral</option>
                              <option value="IV">IV</option>
                              <option value="Colloid">Colloid</option>
                              <option value="Blood Product">
                                Blood Product
                              </option>
                              <option value="NG">NG</option>
                              <option value="PEG">PEG</option>
                              <option value="Urine">Urine</option>
                              <option value="Stool">Stool</option>
                              <option value="Emesis">Emesis</option>
                              <option value="Drain">Drain</option>
                              <option value="Insensible Estimate">
                                Insensible Estimate
                              </option>
                            </FormSelect>
                            {fluidErrors.type && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.type}
                              </p>
                            )}
                          </div>

                          {/* Units */}
                          <div>
                            <FormLabel htmlFor="units" className="font-normal">
                              {t("units_volume")} (ml)
                            </FormLabel>
                            <FormInput
                              name="units"
                              type="text"
                              value={fluidInput.units}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({ ...fluidInput, units: value });

                                // ✅ Clear error when user types
                                if (fluidErrors.units && value.trim() !== "") {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    units: "",
                                  }));
                                }
                              }}
                              className={
                                fluidErrors.units ? "border-danger" : ""
                              }
                              placeholder={t("EnterUnits")}
                            />
                            {fluidErrors.units && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.units}
                              </p>
                            )}
                          </div>

                          {/* Duration */}
                          <div>
                            <FormLabel
                              htmlFor="duration"
                              className="font-normal"
                            >
                              {t("rate_duration")}
                            </FormLabel>
                            <FormInput
                              name="duration"
                              type="text"
                              value={fluidInput.duration}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({
                                  ...fluidInput,
                                  duration: value,
                                });

                                // ✅ Clear error on type
                                if (
                                  fluidErrors.duration &&
                                  value.trim() !== ""
                                ) {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    duration: "",
                                  }));
                                }
                              }}
                              className={
                                fluidErrors.duration ? "border-danger" : ""
                              }
                              placeholder={t("EnterDuration")}
                            />
                            {fluidErrors.duration && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.duration}
                              </p>
                            )}
                          </div>

                          {/* Route */}
                          <div>
                            <FormLabel htmlFor="route" className="font-normal">
                              {t("route_site")}
                            </FormLabel>
                            <FormInput
                              name="route"
                              type="text"
                              value={fluidInput.route}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({ ...fluidInput, route: value });

                                // ✅ Clear error on type
                                if (fluidErrors.route && value.trim() !== "") {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    route: "",
                                  }));
                                }
                              }}
                              className={
                                fluidErrors.route ? "border-danger" : ""
                              }
                              placeholder={t("EnterRoute")}
                            />
                            {fluidErrors.route && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.route}
                              </p>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div>
                            <FormLabel
                              htmlFor="timestamp"
                              className="font-normal"
                            >
                              {t("TimeStamp")}
                            </FormLabel>
                            <FormInput
                              name="timestamp"
                              type="datetime-local"
                              value={fluidInput.timestamp}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFluidInput({
                                  ...fluidInput,
                                  timestamp: value,
                                });

                                // ✅ Clear error on input
                                if (
                                  fluidErrors.timestamp &&
                                  value.trim() !== ""
                                ) {
                                  setFluidErrors((prev) => ({
                                    ...prev,
                                    timestamp: "",
                                  }));
                                }
                              }}
                              className={
                                fluidErrors.timestamp ? "border-danger" : ""
                              }
                              placeholder={t("EnterTimestamp")}
                            />
                            {fluidErrors.timestamp && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.timestamp}
                              </p>
                            )}
                          </div>

                          {/* Notes */}
                          <div className="col-span-2">
                            <FormLabel htmlFor="notes" className="font-normal">
                              {t("notes")}
                            </FormLabel>
                            <FormTextarea
                              name="notes"
                              value={fluidInput.notes}
                              onChange={(e) =>
                                setFluidInput({
                                  ...fluidInput,
                                  notes: e.target.value,
                                })
                              }
                              className={
                                fluidErrors.notes ? "border-danger" : ""
                              }
                              placeholder={t("EnterNotes")}
                            />
                            {fluidErrors.notes && (
                              <p className="text-red-500 text-xs mt-1">
                                {fluidErrors.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          className="bg-primary text-white"
                          onClick={handleSaveFluid}
                          disabled={loading2}
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
                        <Button
                          className="bg-primary text-white"
                          onClick={() => {
                            setShowForm1(false);
                            setFluidErrors({
                              intake: "",
                              type: "",
                              units: "",
                              duration: "",
                              route: "",
                              timestamp: "",
                              notes: "",
                            });
                            setFluidInput({
                              intake: "",
                              type: "",
                              units: "500",
                              duration: "",
                              route: "",
                              timestamp: "",
                              notes: "",
                            });
                          }}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </>
                  )}
                <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-4">
                  {(userRole === "Admin" ||
                    userRole === "Faculty" ||
                    userRole === "User") && (
                    <>
                      <Button
                        className="bg-primary text-white w-full sm:w-auto"
                        onClick={handleAddClick1}
                      >
                        {t("add_fluid")}
                      </Button>

                      <Button
                        onClick={handleExportCSV}
                        className="bg-white border text-primary w-full sm:w-auto"
                      >
                        {t("ExportCSV")}
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {t("FluidRecords")}
                  </h3>
                </div>

                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border bg-gray-100">{t("Vitals")}</th>
                      {fluidBalance.map((fuild, i) => (
                        <th
                          key={i}
                          className="p-2 border bg-gray-100 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <p className="text-xs text-gray-500 mt-2">
                              {t("by")}:- {fuild.fname} {fuild.lname}
                            </p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {FluidVitals.map((vital) => (
                      <tr key={vital.key}>
                        <td className="p-2 border font-medium bg-gray-50 text-center">
                          {vital.label}
                        </td>
                        {fluidBalance.map((fuild, i) => (
                          <td key={i} className="p-2 border text-center">
                            {fuild[vital.key as keyof Fluids]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="overflow-auto mt-5">
                  <div className="overflow-auto p-2">
                    <h3 className="text-lg font-semibold mb-4 text-primary">
                      {t("Fluidchart")}
                    </h3>
                    <div className="grid gap-8">
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                          data={parseFluidChartData(fluidBalance)}
                          margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            label={{
                              value: "Volume (mL)",
                              angle: -90,
                              position: "insideLeft",
                            }}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip wrapperStyle={{ fontSize: "12px" }} />
                          <Legend />

                          {/* Intake (positive bars) */}
                          <Bar
                            dataKey="intake"
                            fill="#f1c40f"
                            name="Input (mL)"
                          />

                          {/* Output (negative bars) */}
                          <Bar
                            dataKey="output"
                            fill="#5dade2"
                            name="Output (mL)"
                            shape={(props: any) => {
                              // Flip output bars downward visually
                              const { x, y, width, height, fill } = props;
                              return (
                                <rect
                                  x={x}
                                  y={y + height}
                                  width={width}
                                  height={-height}
                                  fill={fill}
                                />
                              );
                            }}
                          />

                          {/* Cumulative Balance line */}
                          <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#4b4b4bff"
                            name="Cumulative Balance"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
        {/* // )} */}
      </div>
    </>
  );
};

export default ObservationsCharts;
