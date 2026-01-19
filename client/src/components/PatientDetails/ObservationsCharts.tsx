import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Button from "../Base/Button";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import { Observation } from "@/types/observation";
import { Dialog } from "@/components/Base/Headless";
import AIObservationModal from "../AIObservationModal.tsx'";
import {
  addObservationAction,
  getObservationsByIdAction,
  getObservationsByTableIdAction,
  getFluidByTableIdAction,
  getFluidBalanceByIdAction,
  saveFluidBalanceAction,
  getFluidBalanceByPatientIdAction,
  getExportDataAction,
  deleteObservationAction,
  deleteFluidBalanceAction,
  updateObservationsAction,
  updateFluidBalanceAction,
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
import { getUserOrgIdAction } from "@/actions/userActions";

interface Props {
  data: Patient;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted"
  ) => void;
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
  pews2: "",
  mews2: "",
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

interface FluidErrors {
  intake: string;
  type: string;
  units: string;
  duration: string;
  route: string;
  timestamp: string;
  notes: string;
  // This line allows you to use fluidErrors[variable]
  [key: string]: string;
}

const ObservationsCharts: React.FC<Props> = ({
  data,
  onShowAlert,
  onDataUpdate,
}) => {
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
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editIndex1, setEditIndex1] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [editValues1, setEditValues1] = useState<any>({});
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [fluidDeleteConfirmationModal, setFluidDeleteConfirmationModal] =
    useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [observationIdToDelete, setObservationIdToDelete] = useState<
    number | null
  >(null);
  const [FluidIdToDelete, setFluidIdToDelete] = useState<number | null>(null);
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
  const [editId, setEditId] = useState(0);
  const [savingReport, setSavingReport] = useState(false);
  const [fluidErrors, setFluidErrors] = useState<FluidErrors>({
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
    pews2: "",
    mews2: "",
    timestamp: "",
  });

  const autoFields = ["news2Score", "pews2", "mews2"];
  const fluidFields: Record<string, any> = {
    fluid_intake: { type: "select", options: ["Intake", "Output"] },
    type: {
      type: "select",
      options: [
        "Oral",
        "IV",
        "Colloid",
        "Blood Product",
        "NG",
        "PEG",
        "Urine",
        "Stool",
        "Emesis",
        "Drain",
        "Insensible Estimate",
      ],
    },
    units: { type: "text" },
    duration: { type: "text" },
    route: { type: "text" },
    formatted_timestamp: { type: "datetime-local" },
    notes: { type: "textarea" },
  };
  const isFluidField = (key: string): key is keyof typeof fluidFields => {
    return key in fluidFields;
  };

  const getPatientAge = () => {
    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth);
      const diff = Date.now() - dob.getTime();
      const ageDt = new Date(diff);
      return String(Math.abs(ageDt.getUTCFullYear() - 1970));
    }
    return "Adult"; // Fallback
  };

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);

    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);

    const currentDate = new Date();

    return currentDate > expirationDate;
  }

  const getObservationValidation = (data: any) => {
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
      pews2: "",
      mews2: "",
      timestamp: "",
    };

    // Respiratory Rate
    if (!data.respiratoryRate) {
      newErrors.respiratoryRate = t("Respiratoryraterequired");
      isValid = false;
    } else if (isNaN(Number(data.respiratoryRate))) {
      newErrors.respiratoryRate = t("Mustbenumber");
      isValid = false;
    } else if (Number(data.respiratoryRate) < 0) {
      newErrors.respiratoryRate = t("Cannotbenegative");
      isValid = false;
    }

    // O2 Sats
    if (!data.o2Sats) {
      newErrors.o2Sats = t("O2Satsrequired");
      isValid = false;
    } else if (isNaN(Number(data.o2Sats))) {
      newErrors.o2Sats = t("Mustbenumber");
      isValid = false;
    } else if (Number(data.o2Sats) < 0 || Number(data.o2Sats) > 100) {
      newErrors.o2Sats = t("Mustbetween100");
      isValid = false;
    }

    // Oxygen Delivery
    if (!data.oxygenDelivery) {
      newErrors.oxygenDelivery = t("Oxygendeliveryrequired");
      isValid = false;
    }

    // Blood Pressure (Regex: 120/80)
    if (!data.bloodPressure) {
      newErrors.bloodPressure = t("Bloodpressurerequired");
      isValid = false;
    } else if (!/^\d+\/\d+$/.test(data.bloodPressure)) {
      newErrors.bloodPressure = t("Formatsystolicdiastolic");
      isValid = false;
    }

    // Pulse
    if (!data.pulse) {
      newErrors.pulse = t("Pulserequired");
      isValid = false;
    } else if (isNaN(Number(data.pulse))) {
      newErrors.pulse = t("Mustbenumber");
      isValid = false;
    } else if (Number(data.pulse) < 0) {
      newErrors.pulse = t("Cannotbenegative");
      isValid = false;
    }

    // Consciousness
    if (!data.consciousness) {
      newErrors.consciousness = t("Consciousnessrequired");
      isValid = false;
    }

    // Temperature (Range: 35 - 41)
    if (!data.temperature) {
      newErrors.temperature = t("Temperaturerequired");
      isValid = false;
    } else if (isNaN(Number(data.temperature))) {
      newErrors.temperature = t("Mustbenumber");
      isValid = false;
    } else {
      const temp = Number(data.temperature);
      if (temp < 35) {
        newErrors.temperature = t("Temperaturetoolow25");
        isValid = false;
      } else if (temp > 41) {
        newErrors.temperature = t("Temperaturetoohigh41");
        isValid = false;
      }
    }

    return { isValid, newErrors };
  };

  const validateForm = () => {
    const { isValid, newErrors } = getObservationValidation(newObservation);
    setErrors(newErrors); // Sets errors for the Add Form
    return isValid;
  };

  const fetchObservations = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      setUserRole(userData.role);
      setSubscriptionPlan(userData.planType);
      setPlanDate(userData.planDate);

      // if (userData.planType !== "free") {
      const response = await getObservationsByIdAction(data.id, userData.orgid);
      setObservations(response);
      // }
    } catch (err) {
      console.error("Failed to fetch observations", err);
    }
  };

  const updateObservationAction = async (obsData: any) => {
    try {
      const obsWithsession = {
        ...obsData,
        sessionId: sessionInfo.sessionId,
      };

      const response = await updateObservationsAction(obsWithsession);

      const userEmail = localStorage.getItem("user");
      const userData1 = await getAdminOrgAction(String(userEmail));

      const payloadData = {
        title: `Observation updated`,
        body: `A New Observation updated by ${userData1.username}`,
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
      if (response) {
        onShowAlert({
          variant: "success",
          message: t("Observationupdatedsuccessfully"),
        });

        if (onDataUpdate) {
          onDataUpdate("Observation", "updated");
        }
      }
    } catch (err) {
      console.error("Failed to fetch observations", err);
    }
  };

  const updateFluidAction = async (FluidData: any) => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData1 = await getAdminOrgAction(String(userEmail));

      const fluidDataWithPerformer = {
        ...FluidData,
        performerId: userData1.id,
        sessionId: sessionInfo.sessionId,
      };

      const response = await updateFluidBalanceAction(fluidDataWithPerformer);

      const payloadData = {
        title: `Fluid Balance Added`,
        body: `A New Fluid Balance by ${userData1.username}`,
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
      console.log(response, "response");
      if (response) {
        onShowAlert({
          variant: "success",
          message: t("Fluidupdatedsuccessfully"),
        });
        if (onDataUpdate) {
          onDataUpdate("Fluid Balance", "updated");
        }
      }
    } catch (err) {
      console.error("Failed to fetch Fluid", err);
    }
  };

  useEffect(() => {
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

  const calculatePEWS2 = (data: any) => {
    let score = 0;

    const respRate = Number(data.respiratoryRate);
    const heartRate = Number(data.pulse);
    const bp = Number(data.bloodPressure);
    const temp = Number(data.temperature);
    const o2Sats = Number(data.o2Sats);
    const behavior = data.consciousness?.toLowerCase();

    // Respiratory Rate example ranges
    if (respRate < 10 || respRate > 60) score += 3;
    else if (respRate >= 50 && respRate <= 60) score += 2;
    else if (respRate >= 40 && respRate <= 49) score += 1;

    // Heart Rate example
    if (heartRate < 50 || heartRate > 180) score += 3;
    else if (heartRate >= 150 && heartRate <= 180) score += 2;
    else if (heartRate >= 130 && heartRate <= 149) score += 1;

    // O2 Saturation
    if (o2Sats < 92) score += 3;
    else if (o2Sats >= 92 && o2Sats <= 94) score += 2;

    // Behavior awareness
    if (behavior && behavior !== "alert") score += 2;

    return score;
  };

  const calculateMEWS2 = (data: any) => {
    let score = 0;

    const respRate = Number(data.respiratoryRate);
    const pulse = Number(data.pulse);
    const bp = Number(data.bloodPressure);
    const consciousness = data.consciousness?.toLowerCase();
    const temp = Number(data.temperature);

    if (respRate <= 8 || respRate >= 30) score += 3;
    else if (respRate >= 21 && respRate <= 29) score += 2;
    else if (respRate >= 9 && respRate <= 20) score += 0;

    if (pulse <= 40 || pulse >= 131) score += 3;
    else if (pulse >= 111 && pulse <= 130) score += 2;
    else if (pulse >= 41 && pulse <= 50) score += 1;
    else if (pulse >= 91 && pulse <= 110) score += 1;

    if (bp <= 70) score += 3;
    else if (bp >= 71 && bp <= 80) score += 2;
    else if (bp >= 81 && bp <= 100) score += 1;

    if (temp <= 35 || temp >= 38.5) score += 2;

    if (consciousness && consciousness !== "alert") score += 3;

    return score;
  };

  const handleDeleteClick = async (obsId: number) => {
    const observationToDelete = await getObservationsByTableIdAction(obsId);
    if (!observationToDelete) return;
    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));
    const isSuperadmin = userData.role === "Superadmin";
    const isOwner =
      Number(userData.id) === Number(observationToDelete.observations_by);

    if (isSuperadmin || isOwner) {
      setObservationIdToDelete(obsId);
      setDeleteConfirmationModal(true);
    } else {
      onShowAlert({ variant: "danger", message: t("Youcanonly") });
    }
  };

  const handleFluidDeleteClick = async (fluidId: number) => {
    const fluidToDelete = await getFluidByTableIdAction(fluidId);
    if (!fluidToDelete) return;
    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));
    const isSuperadmin = userData.role === "Superadmin";
    const isOwner =
      Number(userData.id) === Number(fluidToDelete.observations_by);

    if (isSuperadmin || isOwner) {
      setFluidIdToDelete(fluidId);
      setFluidDeleteConfirmationModal(true);
    } else {
      onShowAlert({ variant: "danger", message: t("Youcanonly") });
    }
  };

  const handleDeleteNoteConfirm = async () => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      if (observationIdToDelete) {
        await deleteObservationAction(
          observationIdToDelete,
          Number(sessionInfo.sessionId),
          data1.id
        );
        const userEmail = localStorage.getItem("user");
        const userData1 = await getAdminOrgAction(String(userEmail));
        const payloadData = {
          title: `Observation Deleted`,
          body: `A New Observation Deleted by ${userData1.username}`,
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

        const updatedData = await fetchObservations();

        onShowAlert({
          variant: "success",
          message: t("Observationdeletedsuccessfully"),
        });
        if (onDataUpdate) {
          onDataUpdate("Observation", "deleted");
        }
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      onShowAlert({ variant: "danger", message: t("Faileddeletenote") });
    } finally {
      setDeleteConfirmationModal(false);
      setObservationIdToDelete(null);
    }
  };

  const fetchFuildBalance = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      setUserRole(userData.role);
      setSubscriptionPlan(userData.planType);
      setPlanDate(userData.planDate);

      const response = await getFluidBalanceByIdAction(data.id, userData.orgid);
      setFluidBalance(response);
    } catch (err) {
      console.error("Failed to fetch fluid", err);
    }
  };

  useEffect(() => {
    if (data?.id) fetchFuildBalance();
  }, [data?.id]);

  const handleAddClick1 = () => setShowForm1(true);

  const handleFluidDeleteConfirm = async () => {
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");
    try {
      if (FluidIdToDelete) {
        await deleteFluidBalanceAction(
          FluidIdToDelete,
          Number(sessionInfo.sessionId),
          data1.id
        );
        const userEmail = localStorage.getItem("user");
        const userData1 = await getAdminOrgAction(String(userEmail));
        const payloadData = {
          title: `Fluid Balance Deleted`,
          body: `A New Fluid Balance Deleted by ${userData1.username}`,
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

        const updatedData = await fetchFuildBalance();

        onShowAlert({
          variant: "success",
          message: t("Fluiddeletedsuccessfully"),
        });

        if (onDataUpdate) {
          onDataUpdate("Fluid Balance", "deleted");
        }
      }
    } catch (err) {
      console.error("Error deleting Fluid Balance:", err);
      onShowAlert({ variant: "danger", message: t("FaileddeleteFluid") });
    } finally {
      setFluidDeleteConfirmationModal(false);
      setObservationIdToDelete(null);
    }
  };

  const handleAddClick = () => {
    setCustomTimestamp("");
    setShowForm(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewObservation((prev) => {
      const updated = { ...prev, [name]: value };

      // If user changed any vital field (not the score itself)
      if (name !== "news2Score") {
        const calculatedScore = calculateNEWS2(updated);
        updated.news2Score = calculatedScore.toString();
      }
      if (name !== "mews2") {
        const calculatedScore = calculateMEWS2(updated);
        updated.mews2 = calculatedScore.toString();
      }
      if (name !== "pews2") {
        const calculatedScore = calculatePEWS2(updated);
        updated.pews2 = calculatedScore.toString();
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
        mews2: saved.mews2,
        pews2: saved.pews2,
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
      if (onDataUpdate) {
        onDataUpdate("Observation", "added");
      }
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
    { key: "mews2", label: t("MEWS2") },
    { key: "pews2", label: t("PEWS2") },
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
      if (onDataUpdate) {
        onDataUpdate("Fluid Balance", "added");
      }
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
      const csvBlob = await getExportDataAction(data?.id);

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

  return (
    <>
      {/* {showAlert && <Alerts data={showAlert} />} */}
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      <AIObservationModal
        open={showAIModal}
        onClose={() => {
          setShowAIModal(false);
        }}
        onShowAlert={(msg, variant) => onShowAlert({ message: msg, variant })}
        patientId={data.id}
        age={String(getPatientAge())}
        condition={data.patientAssessment}
        onRefresh={fetchObservations}
        onDataUpdate={onDataUpdate}
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
          <div className="p-4 border rounded-md mb-4">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <Lucide icon="ClipboardList" className="w-5 h-5" />
              {t("new_observation")}
            </h3>
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
                      readOnly={
                        vital.key === "news2Score" ||
                        vital.key === "mews2" ||
                        vital.key === "pews2"
                      }
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
              <Button
                className="bg-primary text-white"
                onClick={handleSave}
                disabled={loading}
              >
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
                    pews2: "",
                    mews2: "",
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
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-6">
                {(userRole === "Admin" ||
                  userRole === "Faculty" ||
                  userRole === "User") &&
                  !showForm && (
                    <>
                      <Button variant="primary" onClick={handleAddClick}>
                        <Lucide icon="Plus" className="w-4 h-4 mr-2" />
                        {t("add_observations")}
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => setShowAIModal(true)}
                      >
                        <Lucide icon="Sparkles" className="w-4 h-4 mr-2" />
                        {t("AIGenerate")}
                      </Button>
                    </>
                  )}
                <Button
                  variant="outline-primary"
                  className="bg-white border text-primary"
                  onClick={() => setShowGridChart(!showGridChart)}
                >
                  <Lucide
                    icon={showGridChart ? "Table" : "BarChart2"}
                    className="w-4 h-4 mr-2"
                  />
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
                <table className="table w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 border bg-slate-100 font-semibold text-left">
                        {t("Vitals")}
                      </th>
                      {observations.map((obs, i) => {
                        const isEditingThisColumn = editIndex === i;
                        const d = new Date(obs.created_at ?? "");
                        const formattedDate = isNaN(d.getTime())
                          ? obs.created_at
                          : d.toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                        return (
                          <th
                            key={i}
                            className={clsx(
                              "px-4 py-3 border text-left min-w-[200px] transition-colors",
                              {
                                "bg-blue-50": isEditingThisColumn,
                                "bg-slate-100": !isEditingThisColumn,
                              }
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-700">
                                  {formattedDate}
                                </span>
                                <div className="flex gap-1">
                                  {localStorage.getItem("role") !==
                                    "Observer" &&
                                    (isEditingThisColumn ? (
                                      <>
                                        <button
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            // --- USE MASTER VALIDATION HERE ---
                                            const { isValid, newErrors } =
                                              getObservationValidation(
                                                editValues
                                              );
                                            if (!isValid) {
                                              setErrors(newErrors); // Display errors inline
                                              return;
                                            }
                                            try {
                                              await updateObservationAction(
                                                editValues
                                              );
                                              setObservations((prev) =>
                                                prev.map((row, idx) =>
                                                  idx === editIndex
                                                    ? { ...row, ...editValues }
                                                    : row
                                                )
                                              );
                                              setEditIndex(null);
                                              setErrors({
                                                respiratoryRate: "",
                                                o2Sats: "",
                                                oxygenDelivery: "",
                                                bloodPressure: "",
                                                pulse: "",
                                                consciousness: "",
                                                temperature: "",
                                                news2Score: "",
                                                pews2: "",
                                                mews2: "",
                                                timestamp: "",
                                              });
                                            } catch (err) {
                                              console.error(err);
                                            }
                                          }}
                                          className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded transition-colors"
                                        >
                                          <Lucide
                                            icon="Check"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditIndex(null);
                                            setErrors({
                                              respiratoryRate: "",
                                              o2Sats: "",
                                              oxygenDelivery: "",
                                              bloodPressure: "",
                                              pulse: "",
                                              consciousness: "",
                                              temperature: "",
                                              news2Score: "",
                                              pews2: "",
                                              mews2: "",
                                              timestamp: "",
                                            });
                                          }}
                                          className="bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded transition-colors"
                                        >
                                          <Lucide
                                            icon="X"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditIndex(i);
                                            setEditValues(obs);
                                          }}
                                          disabled={editIndex !== null}
                                          className={clsx(
                                            "p-1 rounded transition-colors",
                                            {
                                              "text-primary hover:bg-blue-100":
                                                editIndex === null,
                                              "opacity-30": editIndex !== null,
                                            }
                                          )}
                                        >
                                          <Lucide
                                            icon="Pen"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(Number(obs.id))
                                          }
                                          disabled={editIndex !== null}
                                          className={clsx(
                                            "p-1 rounded transition-colors",
                                            {
                                              "text-danger hover:bg-red-100":
                                                editIndex === null,
                                              "opacity-30": editIndex !== null,
                                            }
                                          )}
                                        >
                                          <Lucide
                                            icon="Trash"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                      </>
                                    ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 italic truncate">
                                {isEditingThisColumn
                                  ? t("Editing")
                                  : `${t("by")}: ${obs.observer_fname} ${
                                      obs.observer_lname
                                    }`}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {vitals.map((vital) => (
                      <tr
                        key={vital.key}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-2 border font-medium text-slate-700 bg-white">
                          {vital.label}
                        </td>
                        {observations.map((obs, i) => {
                          const isEditing = editIndex === i;
                          const fieldKey = vital.key as keyof typeof errors;
                          const hasError = errors[fieldKey];
                          const isReadOnly = [
                            "news2Score",
                            "pews2",
                            "mews2",
                          ].includes(vital.key);

                          return (
                            <td
                              key={i}
                              className={clsx("px-4 py-2 border align-middle", {
                                "bg-blue-50/20": isEditing,
                              })}
                            >
                              {isEditing ? (
                                <div className="flex flex-col gap-1">
                                  {vital.key === "oxygenDelivery" ? (
                                    <FormSelect
                                      className={clsx(
                                        "py-1 px-2 text-sm border-slate-300",
                                        { "border-red-500": hasError }
                                      )}
                                      value={editValues[vital.key] ?? ""}
                                      onChange={(e) => {
                                        const updated = {
                                          ...editValues,
                                          [vital.key]: e.target.value,
                                        };
                                        updated.news2Score =
                                          calculateNEWS2(updated);
                                        updated.pews2 = calculatePEWS2(updated);
                                        updated.mews2 = calculateMEWS2(updated);
                                        setEditValues(updated);
                                        if (e.target.value)
                                          setErrors((prev) => ({
                                            ...prev,
                                            [vital.key]: "",
                                          }));
                                      }}
                                    >
                                      <option value="">{t("Select")}</option>
                                      <option value="Room Air">
                                        {t("RoomAir")}
                                      </option>
                                      <option value="Nasal Cannula">
                                        {t("NasalCannula")}
                                      </option>
                                      <option value="Simple Face Mask">
                                        {t("SimpleFaceMask")}
                                      </option>
                                      <option value="Venturi Mask">
                                        {t("VenturiMask")}
                                      </option>
                                      <option value="Non-Rebreather Mask">
                                        {t("NonRebreatherMask")}
                                      </option>
                                      <option value="Partial Rebreather Mask">
                                        {t("PartialRebreatherMask")}
                                      </option>
                                      <option value="High-Flow Nasal Cannula (HFNC)">
                                        {t("HighFlowNasal")}
                                      </option>
                                      <option value="CPAP">CPAP</option>
                                      <option value="BiPAP">BiPAP</option>
                                      <option value="Mechanical Ventilation">
                                        {t("MechanicalVentilation")}
                                      </option>
                                    </FormSelect>
                                  ) : (
                                    <FormInput
                                      className={clsx(
                                        "py-1 px-2 text-sm border-slate-300",
                                        {
                                          "border-red-500": hasError,
                                          "bg-slate-100 cursor-not-allowed font-bold text-primary":
                                            isReadOnly,
                                        }
                                      )}
                                      value={
                                        (editValues as any)[vital.key] ?? ""
                                      }
                                      readOnly={isReadOnly}
                                      onChange={(e) => {
                                        const updated = {
                                          ...editValues,
                                          [vital.key]: e.target.value,
                                        };
                                        updated.news2Score =
                                          calculateNEWS2(updated);
                                        updated.pews2 = calculatePEWS2(updated);
                                        updated.mews2 = calculateMEWS2(updated);
                                        setEditValues(updated);
                                        if (e.target.value)
                                          setErrors((prev) => ({
                                            ...prev,
                                            [vital.key]: "",
                                          }));
                                      }}
                                    />
                                  )}
                                  {hasError && (
                                    <span className="text-[10px] text-red-500 font-medium italic">
                                      {hasError}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={clsx("text-slate-600", {
                                    "font-bold text-red-600":
                                      vital.key === "news2Score" &&
                                      Number(obs[vital.key]) >= 5,
                                  })}
                                >
                                  {obs[vital.key as keyof Observation] || "-"}
                                </span>
                              )}
                            </td>
                          );
                        })}
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
            <div className="overflow-x-auto p-2">
              {/* --- TOP ACTIONS --- */}
              <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-4 mb-6">
                {(userRole === "Admin" ||
                  userRole === "Faculty" ||
                  userRole === "User") && (
                  <>
                    {!showForm1 && (
                      <Button variant="primary" onClick={handleAddClick1}>
                        <Lucide icon="Plus" className="w-4 h-4 mr-2" />
                        {t("add_fluid")}
                      </Button>
                    )}
                    <Button variant="outline-primary" onClick={handleExportCSV}>
                      <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                      {t("ExportCSV")}
                    </Button>
                  </>
                )}
              </div>

              {/* --- ADD FLUID FORM --- */}
              {(userRole === "Admin" ||
                userRole === "Faculty" ||
                userRole === "User") &&
                showForm1 && (
                  <div className="p-6 box mb-8">
                    <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                      <Lucide icon="Droplets" className="w-5 h-5" />
                      {t("FluidBalance")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Intake Type */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("type")}
                        </FormLabel>
                        <FormSelect
                          value={fluidInput.intake}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, intake: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, intake: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.intake,
                          })}
                        >
                          <option value="">{t("SelectType")}</option>
                          <option value="Intake">{t("Intake")}</option>
                          <option value="Output">{t("Output")}</option>
                        </FormSelect>
                        {fluidErrors.intake && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.intake}
                          </p>
                        )}
                      </div>

                      {/* SubType */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("subType")}
                        </FormLabel>
                        <FormSelect
                          value={fluidInput.type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, type: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, type: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.type,
                          })}
                        >
                          <option value="">{t("SelectSubType")}</option>
                          <option value="Oral">{t("Oral")}</option>
                          <option value="IV">IV</option>
                          <option value="Colloid">{t("Colloid")}</option>
                          <option value="Blood Product">
                            {t("BloodProduct")}
                          </option>
                          <option value="NG">NG</option>
                          <option value="PEG">PEG</option>
                          <option value="Urine">{t("Urine")}</option>
                          <option value="Stool">{t("Stool")}</option>
                          <option value="Emesis">{t("Emesis")}</option>
                          <option value="Drain">{t("Drain")}</option>
                          <option value="Insensible Estimate">
                            {t("InsensibleEstimate")}
                          </option>
                        </FormSelect>
                        {fluidErrors.type && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.type}
                          </p>
                        )}
                      </div>

                      {/* Units */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("units_volume")} (ml)
                        </FormLabel>
                        <FormInput
                          type="text"
                          value={fluidInput.units}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, units: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, units: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.units,
                          })}
                          placeholder="500"
                        />
                        {fluidErrors.units && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.units}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("rate_duration")}
                        </FormLabel>
                        <FormInput
                          type="text"
                          value={fluidInput.duration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, duration: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, duration: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.duration,
                          })}
                        />
                        {fluidErrors.duration && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.duration}
                          </p>
                        )}
                      </div>

                      {/* Route */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("route_site")}
                        </FormLabel>
                        <FormInput
                          type="text"
                          value={fluidInput.route}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, route: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, route: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.route,
                          })}
                        />
                        {fluidErrors.route && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.route}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div>
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("TimeStamp")}
                        </FormLabel>
                        <FormInput
                          type="datetime-local"
                          value={fluidInput.timestamp}
                          // This line opens the picker on click
                          onClick={(e: any) => e.target.showPicker()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFluidInput({ ...fluidInput, timestamp: val });
                            if (val)
                              setFluidErrors({ ...fluidErrors, timestamp: "" });
                          }}
                          className={clsx("w-full", {
                            "border-danger": fluidErrors.timestamp,
                          })}
                        />
                        {fluidErrors.timestamp && (
                          <p className="text-danger text-xs mt-1">
                            {fluidErrors.timestamp}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2 lg:col-span-3">
                        <FormLabel className="text-slate-700 font-semibold">
                          {t("notes")}
                        </FormLabel>
                        <FormTextarea
                          value={fluidInput.notes}
                          onChange={(e) =>
                            setFluidInput({
                              ...fluidInput,
                              notes: e.target.value,
                            })
                          }
                          className="w-full"
                          placeholder={t("EnterNotes")}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        variant="primary"
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
                        variant="outline-secondary"
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
                  </div>
                )}

              {/* --- FLUID RECORDS TABLE --- */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Lucide icon="List" className="w-5 h-5" />
                  {t("FluidRecords")}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 border bg-slate-100 font-semibold text-left">
                        {t("Vitals")}
                      </th>
                      {fluidBalance.map((fuild, i) => {
                        const isEditingThisColumn = editIndex1 === i;
                        const dateObj = new Date(fuild.formatted_timestamp);
                        const displayDate = isNaN(dateObj.getTime())
                          ? fuild.formatted_timestamp
                          : dateObj.toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                        return (
                          <th
                            key={i}
                            className={clsx(
                              "px-4 py-3 border text-left min-w-[200px] transition-colors",
                              {
                                "bg-blue-50": isEditingThisColumn,
                                "bg-slate-100": !isEditingThisColumn,
                              }
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-700">
                                  {displayDate}
                                </span>
                                <div className="flex gap-1">
                                  {localStorage.getItem("role") !==
                                    "Observer" &&
                                    (isEditingThisColumn ? (
                                      <>
                                        <button
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            const errors: any = {};
                                            if (!editValues1.fluid_intake)
                                              errors.intake = t("required");
                                            if (!editValues1.type)
                                              errors.type = t("required");
                                            if (!editValues1.units)
                                              errors.units = t("required");
                                            if (
                                              Object.keys(errors).length > 0
                                            ) {
                                              setFluidErrors(errors);
                                              return;
                                            }
                                            try {
                                              await updateFluidAction(
                                                editValues1
                                              );
                                              setFluidBalance((prev) =>
                                                prev.map((row, idx) =>
                                                  idx === editIndex1
                                                    ? { ...row, ...editValues1 }
                                                    : row
                                                )
                                              );
                                              setEditIndex1(null);
                                            } catch (err) {
                                              console.error(err);
                                            }
                                          }}
                                          className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded transition-colors"
                                        >
                                          <Lucide
                                            icon="Check"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditIndex1(null);
                                            setFluidErrors({
                                              intake: "",
                                              type: "",
                                              units: "",
                                              duration: "",
                                              route: "",
                                              timestamp: "",
                                              notes: "",
                                            });
                                          }}
                                          className="bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded transition-colors"
                                        >
                                          <Lucide
                                            icon="X"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditIndex1(i);
                                            setEditValues1(fluidBalance[i]);
                                          }}
                                          disabled={editIndex1 !== null}
                                          className={clsx(
                                            "p-1 rounded transition-colors",
                                            {
                                              "text-primary hover:bg-blue-100":
                                                editIndex1 === null,
                                              "opacity-30": editIndex1 !== null,
                                            }
                                          )}
                                        >
                                          <Lucide
                                            icon="Pen"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleFluidDeleteClick(
                                              Number(fuild.id)
                                            )
                                          }
                                          disabled={editIndex1 !== null}
                                          className={clsx(
                                            "p-1 rounded transition-colors",
                                            {
                                              "text-danger hover:bg-red-100":
                                                editIndex1 === null,
                                              "opacity-30": editIndex1 !== null,
                                            }
                                          )}
                                        >
                                          <Lucide
                                            icon="Trash"
                                            className="w-4 h-4"
                                          />
                                        </button>
                                      </>
                                    ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 italic truncate">
                                {isEditingThisColumn
                                  ? t("Editing")
                                  : `${t("by")}: ${fuild.fname} ${fuild.lname}`}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {FluidVitals.map((vital) => (
                      <tr
                        key={vital.key}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-2 border font-medium text-slate-700 bg-white">
                          {vital.label}
                        </td>
                        {fluidBalance.map((fluid, i) => {
                          const isEditing = editIndex1 === i;
                          const fieldError = fluidErrors[vital.key];

                          return (
                            <td
                              key={i}
                              className={clsx("px-4 py-2 border align-middle", {
                                "bg-blue-50/20": isEditing,
                              })}
                            >
                              {isEditing ? (
                                <div className="flex flex-col gap-1">
                                  {isFluidField(vital.key) &&
                                  fluidFields[vital.key].type === "select" ? (
                                    <FormSelect
                                      className={clsx(
                                        "py-1 px-2 text-sm border-slate-300",
                                        { "border-red-500": fieldError }
                                      )}
                                      value={editValues1[vital.key] ?? ""}
                                      onChange={(e) => {
                                        setEditValues1({
                                          ...editValues1,
                                          [vital.key]: e.target.value,
                                        });
                                        if (e.target.value)
                                          setFluidErrors({
                                            ...fluidErrors,
                                            [vital.key]: "",
                                          });
                                      }}
                                    >
                                      <option value="">{t("Select")}</option>
                                      {fluidFields[vital.key].options.map(
                                        (opt: any) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        )
                                      )}
                                    </FormSelect>
                                  ) : isFluidField(vital.key) &&
                                    fluidFields[vital.key].type ===
                                      "textarea" ? (
                                    <FormTextarea
                                      className={clsx(
                                        "py-1 px-2 text-sm border-slate-300",
                                        { "border-red-500": fieldError }
                                      )}
                                      value={editValues1[vital.key] ?? ""}
                                      onChange={(e) =>
                                        setEditValues1({
                                          ...editValues1,
                                          [vital.key]: e.target.value,
                                        })
                                      }
                                    />
                                  ) : (
                                    <FormInput
                                      type={
                                        isFluidField(vital.key)
                                          ? fluidFields[vital.key].type
                                          : "text"
                                      }
                                      className={clsx(
                                        "py-1 px-2 text-sm border-slate-300",
                                        { "border-red-500": fieldError }
                                      )}
                                      value={editValues1[vital.key] ?? ""}
                                      onChange={(e) => {
                                        setEditValues1({
                                          ...editValues1,
                                          [vital.key]: e.target.value,
                                        });
                                        if (e.target.value)
                                          setFluidErrors({
                                            ...fluidErrors,
                                            [vital.key]: "",
                                          });
                                      }}
                                    />
                                  )}
                                  {fieldError && (
                                    <span className="text-[10px] text-red-500 italic font-medium">
                                      {fieldError}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600">
                                  {fluid[vital.key as keyof Fluids] || "-"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- FLUID CHART SECTION --- */}
              <div className="mt-12 bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <Lucide icon="BarChart3" className="w-5 h-5" />
                  {t("Fluidchart")}
                </h3>
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart
                      data={parseFluidChartData(fluidBalance)}
                      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="time"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <YAxis
                        label={{
                          value: "Volume (mL)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#64748b", fontWeight: 600 },
                        }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        wrapperStyle={{ fontSize: "12px", outline: "none" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="intake"
                        fill="#f1c40f"
                        name="Input (mL)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="output"
                        fill="#5dade2"
                        name="Output (mL)"
                        shape={(props: any) => {
                          const { x, y, width, height, fill } = props;
                          return (
                            <rect
                              x={x}
                              y={y + height}
                              width={width}
                              height={-height}
                              fill={fill}
                              rx={4}
                            />
                          );
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#1e293b"
                        name="Cumulative Balance"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#1e293b" }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
        {/* // )} */}

        {/* Delete modal */}
        {deleteConfirmationModal && (
          <Dialog
            open={deleteConfirmationModal}
            onClose={() => setDeleteConfirmationModal(false)}
          >
            <Dialog.Panel>
              <div className="p-5 text-center">
                <Lucide
                  icon="Trash2"
                  className="w-16 h-16 mx-auto mt-3 text-danger"
                />
                <div className="mt-5 text-3xl">{t("Sure")}</div>
                <div className="mt-2 text-slate-500">{t("ReallyDelete")}</div>
              </div>
              <div className="px-5 pb-8 text-center">
                <Button
                  variant="outline-secondary"
                  className="w-24 mr-4"
                  onClick={() => {
                    setDeleteConfirmationModal(false);
                    setObservationIdToDelete(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="danger"
                  className="w-24"
                  onClick={handleDeleteNoteConfirm}
                >
                  {t("Delete")}
                </Button>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}

        {fluidDeleteConfirmationModal && (
          <Dialog
            open={fluidDeleteConfirmationModal}
            onClose={() => setFluidDeleteConfirmationModal(false)}
          >
            <Dialog.Panel>
              <div className="p-5 text-center">
                <Lucide
                  icon="Trash2"
                  className="w-16 h-16 mx-auto mt-3 text-danger"
                />
                <div className="mt-5 text-3xl">{t("Sure")}</div>
                <div className="mt-2 text-slate-500">{t("ReallyDelete")}</div>
              </div>
              <div className="px-5 pb-8 text-center">
                <Button
                  variant="outline-secondary"
                  className="w-24 mr-4"
                  onClick={() => {
                    setFluidDeleteConfirmationModal(false);
                    setFluidIdToDelete(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="danger"
                  className="w-24"
                  onClick={handleFluidDeleteConfirm}
                >
                  {t("Delete")}
                </Button>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default ObservationsCharts;
