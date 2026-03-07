import React, { useEffect, useState, useRef } from "react";
import {
  FormInput,
  FormTextarea,
  FormCheck,
  FormSelect,
} from "@/components/Base/Form";
import Button from "../Base/Button";
import {
  addPrescriptionAction,
  getAllMedicationsAction,
  getPrescriptionsByIdAction,
  getPrescriptionsAction,
  deletePrescriptionAction,
  updatePrescriptionAction,
  stopMedicationAction,
  validatePrescriptionAction,
  rejectPrescriptionAction,
} from "@/actions/patientActions";
import { t } from "i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import SubscriptionModal from "../SubscriptionModal.tsx";
import { parseISO, addDays, format, isAfter, startOfDay } from "date-fns";
import { useAppContext } from "@/contexts/sessionContext";
import { io, Socket } from "socket.io-client";
import Lucide from "../Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import medicationOptions from "../../medicationOptions.json";
import { getUserOrgIdAction } from "@/actions/userActions";
import TomSelect from "../Base/TomSelect";
import "tom-select/dist/css/tom-select.css";

interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  organisation_id: number;
  medication_name: string;
  indication: string;
  description: string;
  start_date: string;
  days_given: number;
  administration_time: string;
  dose: string;
  Frequency: string;
  Way: string;
  Unit: string;
  route: string;
  created_at: string;
  updated_at: string;
  DrugGroup: string;
  DrugSubGroup: string;
  TypeofDrug: string;
  medication: string;
  Duration: string;
  Instructions: string;
  performerId: string;
  stopped_at: string;
  stopped_by: string;
  status: string;
  validate_status: string | null;
  validate_reason: string | null;
  validated_at?: string;
  pharmacistName?: string;
}

interface Props {
  patientId: number;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted",
  ) => void;
}

interface UserData {
  id: number;
  planType: string;
  uid: number;
  username: string;
  orgid: number;
  role?: string;
}

const Prescriptions: React.FC<Props> = ({
  patientId,
  onShowAlert,
  onDataUpdate,
}) => {
  // Tabs state
  const [activeTab, setActiveTab] = useState<"add" | "requests">("add");

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [validatedPrescriptions, setValidatedPrescriptions] = useState<
    Prescription[]
  >([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<
    Prescription[]
  >([]);
  const [loading, setLoading] = useState(false);
  const userrole = localStorage.getItem("role");
  const socket = useRef<Socket | null>(null);
  const useremail = localStorage.getItem("user");
  const { ways, units, frequencies, instructions, duration } =
    medicationOptions;

  // Form state
  const [description, setDescription] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [Duration, setDuration] = useState("");
  const [DrugGroup, setDrugGroup] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instruction, setInstruction] = useState("");
  const [way, setWay] = useState("");
  const [unit, setUnit] = useState("");
  const [DrugSubGroup, setDrugSubGroup] = useState("");
  const [TypeofDrug, setTypeofDrug] = useState("");
  const [indication, setIndication] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("");
  const [startDate, setStartDate] = useState("");
  const [daysGiven, setDaysGiven] = useState("");
  const [administrationTime, setAdministrationTime] = useState("");

  // Mode state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<
    number | null
  >(null);

  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [userData, setUserData] = useState<UserData>({} as UserData);
  const { sessionInfo } = useAppContext();
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [prescriptionIdToDelete, setPrescriptionIdToDelete] = useState<
    number | null
  >(null);

  const [medicationsList, setMedicationsList] = useState<
    {
      id: number;
      doctor_id: number;
      medication: string;
      DrugGroup: string;
      DrugSubGroup: string;
      TypeofDrug: string;
      dose: string[];
    }[]
  >([]);
  const [availableDoses, setAvailableDoses] = useState<string[]>([]);
  const [stopConfirmationModal, setStopConfirmationModal] = useState(false);
  const [singlePrescription, setSinglePrescription] = useState<Prescription>();
  const [firstPrescription, setFirstPrescription] = useState<Prescription>();

  // Requests/Validation State
  const [validationModal, setValidationModal] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState(false);
  const [viewPrescriptionData, setViewPrescriptionData] =
    useState<Prescription | null>(null);
  const [pharmacistName, setPharmacistName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(false);

  const [errors, setErrors] = useState({
    description: "",
    medicationName: "",
    indication: "",
    dose: "",
    DrugGroup: "",
    DrugSubGroup: "",
    TypeofDrug: "",
    instruction: "",
    route: "",
    startDate: "",
    daysGiven: "",
    administrationTime: "",
    unit: "",
    way: "",
    frequency: "",
    Duration: "",
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
      description: "",
      medicationName: "",
      indication: "",
      dose: "",
      DrugGroup: "",
      DrugSubGroup: "",
      TypeofDrug: "",
      instruction: "",
      route: "",
      startDate: "",
      daysGiven: "",
      administrationTime: "",
      unit: "",
      way: "",
      frequency: "",
      Duration: "",
    };

    if (!description.trim()) {
      newErrors.description = t("Descriptionrequired");
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = t("description_req1");
      isValid = false;
    }
    if (!medicationName.trim()) {
      newErrors.medicationName = t("Medicationnamerequired");
      isValid = false;
    }
    if (!indication.trim()) {
      newErrors.indication = t("Indicationrequired");
      isValid = false;
    }
    if (!dose.trim()) {
      newErrors.dose = t("Doserequired");
      isValid = false;
    }
    if (!route.trim()) {
      newErrors.route = t("Routerequired");
      isValid = false;
    }
    if (!startDate.trim()) {
      newErrors.startDate = t("Startdaterequired");
      isValid = false;
    }
    if (!daysGiven.trim() || isNaN(Number(daysGiven))) {
      newErrors.daysGiven = t("Daysgivennumber");
      isValid = false;
    }
    if (!administrationTime.trim()) {
      newErrors.administrationTime = t("Administrationrequired");
      isValid = false;
    }
    if (!DrugGroup.trim()) {
      newErrors.DrugGroup = t("DrugGrouprequired");
      isValid = false;
    }
    if (!DrugSubGroup.trim()) {
      newErrors.DrugSubGroup = t("DrugSubGrouprequired");
      isValid = false;
    }
    if (!TypeofDrug.trim()) {
      newErrors.TypeofDrug = t("TypeofDrugrequired");
      isValid = false;
    }
    if (!unit.trim()) {
      newErrors.unit = t("Unitrequired");
      isValid = false;
    }
    if (!way.trim()) {
      newErrors.way = t("Wayrequired");
      isValid = false;
    }
    if (!frequency.trim()) {
      newErrors.frequency = t("Frequencyrequired");
      isValid = false;
    }
    if (!instruction.trim()) {
      newErrors.instruction = t("Instructionrequired");
      isValid = false;
    }
    if (!Duration.trim()) {
      newErrors.Duration = t("Durationrequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setDescription("");
    setMedicationName("");
    setIndication("");
    setStartDate("");
    setDaysGiven("");
    setAdministrationTime("");
    setDose("");
    setRoute("");
    setDrugGroup("");
    setDrugSubGroup("");
    setTypeofDrug("");
    setInstruction("");
    setUnit("");
    setWay("");
    setFrequency("");
    setDuration("");
    setCurrentPrescriptionId(null);
    setIsEditing(false);
    setErrors({
      description: "",
      medicationName: "",
      indication: "",
      startDate: "",
      DrugGroup: "",
      DrugSubGroup: "",
      TypeofDrug: "",
      instruction: "",
      daysGiven: "",
      administrationTime: "",
      dose: "",
      route: "",
      unit: "",
      way: "",
      frequency: "",
      Duration: "",
    });
  };

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  const user = async () => {
    const data = await getAdminOrgAction(String(useremail));
    setUserData(data);
    setSubscriptionPlan(data.planType);
    setPlanDate(data.planDate);
  };

  useEffect(() => {
    user();
  }, []);

  useEffect(() => {
    socket.current = io("wss://sockets.mxr.ai:5000", {
      transports: ["websocket"],
    });

    socket.current.on("connect", () => {
      console.log("Socket connected");
    });
    socket.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const data = await getPrescriptionsAction(patientId, userData.orgid);

      setFirstPrescription(data[0]);

      const normalizedData = data.map((item: any) => ({
        ...item,
        startDate: item.start_date,
        daysGiven: Number(item.days_given),
      }));

      setPrescriptions(normalizedData);

      // Filter prescriptions based on validate_status
      // const validated = normalizedData.filter(
      //   (p: Prescription) =>
      //     p.validate_status === "validated" || p.validate_status === "approved",
      // );
      const pending = normalizedData.filter(
        (p: Prescription) =>
          p.validate_status === null || p.validate_status === "Pending",
      );

      setValidatedPrescriptions(normalizedData);
      setPendingPrescriptions(pending);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    }
  };

  useEffect(() => {
    if (patientId) fetchPrescriptions();
  }, [patientId]);

  const fillFormForEditing = (prescription: Prescription) => {
    setDescription(prescription.description);
    setMedicationName(prescription.medication_name);
    setIndication(prescription.indication);
    setDose(prescription.dose);
    setRoute(prescription.route);
    setDrugGroup(prescription.DrugGroup);
    setDrugSubGroup(prescription.DrugSubGroup);
    setTypeofDrug(prescription.TypeofDrug);
    setUnit(prescription.Unit);
    setWay(prescription.Way);
    setFrequency(prescription.Frequency);
    setInstruction(prescription.Instructions);
    setDuration(prescription.Duration);

    const formattedDate = format(
      parseISO(prescription.start_date),
      "yyyy-MM-dd'T'HH:mm",
    );
    setStartDate(formattedDate);

    setDaysGiven(prescription.days_given.toString());
    setAdministrationTime(prescription.administration_time);
    setCurrentPrescriptionId(prescription.id);
    setIsEditing(true);

    const selectedMed = medicationsList.find(
      (m) => m.medication === prescription.medication_name,
    );
    setAvailableDoses(selectedMed?.dose || []);
  };

  const handleStopMedication = async (prescription: Prescription) => {
    try {
      const medId =
        medicationsList.find(
          (m) => m.medication === prescription.medication_name,
        )?.id || 0;

      const payload = {
        prescriptionId: prescription.id,
        stoppedBy: userData.id,
        medicationId: medId,
      };

      await stopMedicationAction(payload);

      onShowAlert({
        variant: "success",
        message: t("Medication stopped successfully"),
      });

      if (onDataUpdate) onDataUpdate("Prescription", "updated");
      fetchPrescriptions();
    } catch (error) {
      console.error("Error stopping medication:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failed to stop medication"),
      });
    }
  };

  const handleValidatePrescription = async () => {
    if (!pharmacistName.trim()) {
      onShowAlert({
        variant: "danger",
        message: t("Pharmacist name is required"),
      });
      return;
    }

    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));

    setIsValidating(true);
    try {
      const payload = {
        pharmacistName: pharmacistName,
        patient_id: patientId,
        validatedBy: userData.id,
        prescriptionId: selectedRequestId,
      };

      await validatePrescriptionAction(payload);

      onShowAlert({
        variant: "success",
        message: t("Prescription validated successfully"),
      });

      setValidationModal(false);
      setPharmacistName("");
      setSelectedRequestId(null);
      fetchPrescriptions();
    } catch (error) {
      onShowAlert({
        variant: "danger",
        message: t("Failed to validate prescription"),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRejectPrescription = async () => {
    if (!pharmacistName.trim() || !rejectionReason.trim()) {
      onShowAlert({
        variant: "danger",
        message: t("Pharmacist name and rejection reason are required"),
      });
      return;
    }

    setIsValidating(true);
    try {
      // You'll need to implement a reject prescription action
      await rejectPrescriptionAction({
        prescriptionId: selectedRequestId,
        pharmacistName,
        patient_id: patientId,
        rejectionReason,
        rejectedBy: userData.id,
      });

      onShowAlert({
        variant: "success",
        message: t("Prescription request rejected"),
      });

      setRejectionModal(false);
      setPharmacistName("");
      setRejectionReason("");
      setSelectedRequestId(null);
      fetchPrescriptions();
    } catch (error) {
      onShowAlert({
        variant: "danger",
        message: t("Failed to reject prescription"),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      const doctorID = userData.uid;

      if (isEditing && currentPrescriptionId) {
        await updatePrescriptionAction({
          id: currentPrescriptionId,
          patient_id: patientId,
          sessionId: Number(sessionInfo.sessionId),
          doctor_id: doctorID,
          organisation_id: userData.orgid,
          description,
          medication_name: medicationName,
          indication,
          DrugGroup,
          DrugSubGroup,
          TypeofDrug,
          Duration,
          Instructions: instruction,
          Frequency: frequency,
          Way: way,
          Unit: unit,
          dose,
          route,
          start_date: startDate,
          days_given: Number(daysGiven),
          administration_time: administrationTime,
          performerId: data1.id,
        });

        onShowAlert({
          variant: "success",
          message: t("Prescriptionupdatedsuccessfully"),
        });

        if (onDataUpdate) {
          onDataUpdate("Prescription", "updated");
        }
      } else {
        await addPrescriptionAction({
          patient_id: patientId,
          sessionId: Number(sessionInfo.sessionId),
          doctor_id: doctorID,
          organisation_id: userData.orgid,
          description,
          medication_name: medicationName,
          indication,
          dose,
          DrugGroup,
          DrugSubGroup,
          TypeofDrug,
          Duration,
          Instructions: instruction,
          Frequency: frequency,
          Way: way,
          Unit: unit,
          route,
          start_date: startDate,
          days_given: Number(daysGiven),
          administration_time: administrationTime,
        });

        onShowAlert({
          variant: "success",
          message: t("Prescriptionaddedsuccessfully"),
        });

        if (onDataUpdate) {
          onDataUpdate("Prescription", "added");
        }
      }

      const payloadData = {
        title: `Prescription ${isEditing ? "Updated" : "Added"}`,
        body: `A Prescription ${isEditing ? "Updated" : "Added"} by ${
          userData.username
        }`,
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

      resetForm();
      setIsFormVisible(false);

      const updatedData = await getPrescriptionsAction(
        patientId,
        userData.orgid,
      );
      setPrescriptions(updatedData);

      // Filter updated data
      const validated = updatedData.filter(
        (p: Prescription) =>
          p.validate_status === "validated" || p.validate_status === "Approved",
      );
      const pending = updatedData.filter(
        (p: Prescription) =>
          p.validate_status === null || p.validate_status === "Pending",
      );

      setValidatedPrescriptions(validated);
      setPendingPrescriptions(pending);
    } catch (error) {
      console.error("Failed to save prescription:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedsaveprescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const meds = await getAllMedicationsAction();
      setMedicationsList(meds);
    } catch (err) {
      console.error("Failed to fetch medications:", err);
    }
  };

  const data = medicationsList;
  const DrugGroupList = [...new Set(data.map((d) => d.DrugGroup))];
  const DrugSubGroupList = data
    .filter((d) => d.DrugGroup === DrugGroup)
    .map((d) => d.DrugSubGroup)
    .filter((v, i, self) => self.indexOf(v) === i);

  const TypeofDrugList = DrugSubGroup
    ? data
        .filter((d) => d.DrugSubGroup === DrugSubGroup)
        .map((d) => d.TypeofDrug)
        .filter((v, i, self) => self.indexOf(v) === i)
    : [];

  const MedicationList = data
    .filter((d) => d.TypeofDrug === TypeofDrug)
    .map((d) => d.medication);

  useEffect(() => {
    fetchMedications();
  }, []);

  const allDates = React.useMemo(() => {
    if (!validatedPrescriptions.length) return [];

    const minStartDate = validatedPrescriptions
      .map((p) => parseISO(p.start_date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const maxEndDate = validatedPrescriptions
      .map((p) => addDays(parseISO(p.start_date), Number(p.days_given) - 1))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const daysDiff =
      (maxEndDate.getTime() - minStartDate.getTime()) / (1000 * 60 * 60 * 24);

    return Array.from({ length: daysDiff + 1 }, (_, i) =>
      format(addDays(minStartDate, i), "dd/MM/yy"),
    );
  }, [validatedPrescriptions]);

  const handleEditClick = async (prescriptionId: number) => {
    try {
      const prescriptionToEdit =
        await getPrescriptionsByIdAction(prescriptionId);
      if (!prescriptionToEdit) return;
      fillFormForEditing(prescriptionToEdit);
      setIsFormVisible(true);
    } catch (error) {
      console.error("Error fetching prescription for edit:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedtofetchprescription"),
      });
    }
  };

  const handleDeleteClick = async (prescriptionId: number) => {
    const prescriptionToDelete =
      await getPrescriptionsByIdAction(prescriptionId);
    if (!prescriptionToDelete) return;
    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));
    const isSuperadmin = userData.role === "Superadmin";
    const isOwner =
      Number(userData.id) === Number(prescriptionToDelete.doctor_id);

    if (isSuperadmin || isOwner) {
      setPrescriptionIdToDelete(prescriptionId);
      setDeleteConfirmationModal(true);
    } else {
      onShowAlert({ variant: "danger", message: t("Youcanonly") });
    }
  };

  const handleDeleteNoteConfirm = async () => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      if (prescriptionIdToDelete) {
        await deletePrescriptionAction(
          prescriptionIdToDelete,
          Number(sessionInfo.sessionId),
          data1.id,
        );
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));

        const payloadData = {
          title: `Prescription Deleted`,
          body: `A Prescription Deleted by ${userData.username}`,
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

        const updatedData = await getPrescriptionsAction(
          patientId,
          userData.orgid,
        );
        setPrescriptions(updatedData);

        // Filter updated data
        const validated = updatedData.filter(
          (p: Prescription) =>
            p.validate_status === "validated" ||
            p.validate_status === "Approved",
        );
        const pending = updatedData.filter(
          (p: Prescription) =>
            p.validate_status === null || p.validate_status === "Pending",
        );

        setValidatedPrescriptions(validated);
        setPendingPrescriptions(pending);

        onShowAlert({
          variant: "success",
          message: t("Prescriptiondeletedsuccessfully"),
        });

        if (onDataUpdate) {
          onDataUpdate("Prescription", "deleted");
        }
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      onShowAlert({
        variant: "danger",
        message: t("Faileddeleteprescription"),
      });
    } finally {
      setDeleteConfirmationModal(false);
      setPrescriptionIdToDelete(null);
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setIsFormVisible(false);
  };

  const isFreePlanLimitReached =
    subscriptionPlan === "free" &&
    prescriptions.length >= 10 &&
    (userrole === "Admin" || userrole === "Faculty" || userrole === "User");

  const isPerpetualLicenseExpired =
    subscriptionPlan === "5 Year Licence" &&
    isPlanExpired(planDate) &&
    (userrole === "Admin" ||
      userrole === "Faculty" ||
      userrole === "User" ||
      userrole === "Observer");

  // Requests Handlers
  const handleAcceptRequest = (id: number) => {
    setSelectedRequestId(id);
    setPharmacistName("");
    setValidationModal(true);
  };

  const handleRejectRequest = (id: number) => {
    setSelectedRequestId(id);
    setPharmacistName("");
    setRejectionReason("");
    setRejectionModal(true);
  };

  const handleViewRequest = async (id: number) => {
    const prescription = await getPrescriptionsByIdAction(id);
    if (prescription) {
      setViewPrescriptionData(prescription);
      setViewPrescriptionModal(true);
    }
  };

  return (
    <div className="space-y-4">
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "add"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("add")}
        >
          {t("Add Prescription")}
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          {t("requests")}{" "}
          {pendingPrescriptions.length > 0 &&
            `(${pendingPrescriptions.length})`}
        </button>
      </div>

      {activeTab === "add" && (
        <>
          <div className="flex justify-between flow-root">
            <div>
              {(userrole === "Admin" ||
                userrole === "Faculty" ||
                userrole === "User") && (
                <div>
                  <Button
                    variant="primary"
                    className="text-white font-semibold float-right"
                    onClick={() => {
                      if (isFreePlanLimitReached || isPerpetualLicenseExpired) {
                        setShowUpsellModal(true);
                      } else {
                        resetForm();
                        setIsFormVisible(true);
                      }
                    }}
                  >
                    {t("add_prescription")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {isFormVisible ? (
              <div className="flex-1 overflow-y-auto p-2">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {isEditing ? t("edit_prescription") : t("new_prescription")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("DrugGroup")}
                    </label>
                    <TomSelect
                      value={DrugGroup}
                      onChange={(e) => {
                        setDrugGroup(e.target.value);
                        setDrugSubGroup("");
                        setTypeofDrug("");
                        setMedicationName("");
                      }}
                      options={{ placeholder: t("SelectDrugGroup") }}
                      className="w-full"
                    >
                      <option value="">{t("SelectDrugFirst")}</option>
                      {DrugGroupList.map((g, i) => (
                        <option key={i} value={g}>
                          {g?.toUpperCase()}
                        </option>
                      ))}
                    </TomSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("DrugSubGroup")}
                    </label>
                    <TomSelect
                      value={DrugSubGroup}
                      onChange={(e) => {
                        setDrugSubGroup(e.target.value);
                        setTypeofDrug("");
                        setMedicationName("");
                      }}
                      disabled={!DrugGroup}
                      className="w-full"
                    >
                      <option value="">{t("SelectDrugSubGroup")}</option>
                      {DrugSubGroupList.map((sg, i) => (
                        <option key={i} value={sg}>
                          {sg || "---"}
                        </option>
                      ))}
                    </TomSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("TypeofDrug")}
                    </label>
                    <TomSelect
                      value={TypeofDrug}
                      onChange={(e) => {
                        setTypeofDrug(e.target.value);
                        setMedicationName("");
                      }}
                      disabled={!DrugGroup}
                      className="w-full"
                    >
                      <option value="">{t("SelectTypeofDrug")}</option>
                      {TypeofDrugList.map((t, i) => (
                        <option key={i} value={t}>
                          {t}
                        </option>
                      ))}
                    </TomSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("MedicationName")}
                    </label>
                    <TomSelect
                      value={medicationName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setMedicationName(name);
                        const selected = medicationsList.find(
                          (m) => m.medication === name,
                        );
                        setAvailableDoses(selected?.dose || []);
                        setDose("");
                      }}
                      disabled={!TypeofDrug}
                      className="w-full"
                    >
                      <option value="">{t("SelectMedication")}</option>
                      {MedicationList.map((m, i) => (
                        <option key={i} value={m}>
                          {m}
                        </option>
                      ))}
                    </TomSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("Dose")}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <FormInput
                        type="text"
                        value={dose}
                        placeholder={t("Enter Dose")}
                        className="flex-1 min-w-[120px]"
                        onChange={(e) => setDose(e.target.value)}
                      />
                      <FormSelect
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="flex-1 min-w-[100px]"
                      >
                        <option value="">{t("Unit")}</option>
                        {units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </FormSelect>
                      <FormSelect
                        value={way}
                        onChange={(e) => setWay(e.target.value)}
                        className="flex-1 min-w-[120px]"
                      >
                        <option value="">{t("Way")}</option>
                        {ways.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </FormSelect>
                      <FormSelect
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="flex-1 min-w-[120px]"
                      >
                        <option value="">{t("Frequency")}</option>
                        {frequencies.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </FormSelect>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("Instructions")}
                    </label>
                    <FormSelect
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      className="w-full"
                    >
                      <option value="">{t("SelectInstruction")}</option>
                      {instructions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route
                    </label>
                    <FormInput
                      type="text"
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      placeholder="e.g. Oral"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("AdministrationTime")}
                    </label>
                    <FormInput
                      type="time"
                      value={administrationTime}
                      onChange={(e) => setAdministrationTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("Indication")}
                    </label>
                    <FormInput
                      type="text"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                      placeholder="e.g. Hypertension"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("description")}
                    </label>
                    <FormTextarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("StartDate")}
                      </label>
                      <FormInput
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("DaysGiven")}
                      </label>
                      <div className="flex gap-2">
                        <FormInput
                          type="number"
                          value={daysGiven}
                          onChange={(e) => setDaysGiven(e.target.value)}
                          className="flex-1"
                        />
                        <FormSelect
                          value={Duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="flex-1"
                        >
                          <option value="">{t("Duration")}</option>
                          {duration.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </FormSelect>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 space-x-2">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancelForm}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSavePrescription}
                      disabled={loading}
                    >
                      {loading
                        ? t("saving...")
                        : isEditing
                          ? t("update_prescription")
                          : t("add_prescription")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 space-y-6 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("MedicationAdministrationChart")}
                </h2>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm text-left bg-white">
                    <thead className="">
                      <tr>
                        <th className="border px-3 py-2">{t("Medication")}</th>
                        <th className="border px-3 py-2">{t("Time")}</th>
                        {allDates.map((date) => (
                          <th
                            key={date}
                            className={`border px-3 py-2 ${date === format(new Date(), "dd/MM/yy") ? "bg-yellow-100 font-semibold" : ""}`}
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validatedPrescriptions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2 + allDates.length}
                            className="border px-3 py-4 text-center text-gray-500"
                          >
                            {t("No_validated_prescriptions_found")}
                          </td>
                        </tr>
                      ) : (
                        validatedPrescriptions.map((prescription) => {
                          const startDate = parseISO(prescription.start_date);
                          const daysGiven = Number(prescription.days_given);
                          const givenDates = Array.from(
                            { length: daysGiven },
                            (_, i) => format(addDays(startDate, i), "dd/MM/yy"),
                          );
                          const pStart = parseISO(prescription.start_date);
                          const stopDate = prescription.stopped_at
                            ? parseISO(prescription.stopped_at)
                            : null;
                          const scheduledDates = Array.from(
                            { length: prescription.days_given },
                            (_, i) => format(addDays(pStart, i), "dd/MM/yy"),
                          );
                          const endDate = addDays(startDate, daysGiven - 1);
                          const isExpired = isAfter(
                            startOfDay(new Date()),
                            startOfDay(endDate),
                          );
                          const statusConfig = {
                            Pending: {
                              color: "text-yellow-500",
                              text: "Pending validation by pharmacist",
                            },
                            Rejected: {
                              color: "text-red-500",
                              text: "Rejected by pharmacist",
                            },
                            Approved: {
                              color: "text-green-500",
                              text: "Validated by pharmacist",
                            },
                          };

                          const status =
                            statusConfig[
                              (prescription.validate_status ??
                                "Pending") as keyof typeof statusConfig
                            ];
                          return (
                            <tr key={prescription.id}>
                              <td className="border px-3 py-2 align-top">
                                <div className="font-semibold flex justify-between">
                                  {prescription.medication_name}
                                  {localStorage.getItem("role") !==
                                  "Observer" ? (
                                    <div className="flex">
                                      <a
                                        className="text-primary cursor-pointer"
                                        title="Edit prescription"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleEditClick(prescription.id);
                                        }}
                                      >
                                        <Lucide
                                          icon="Pen"
                                          className="w-4 h-4 text-primary"
                                        />
                                      </a>
                                      <a
                                        className="text-danger cursor-pointer ml-2"
                                        title="Delete prescription"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteClick(prescription.id);
                                        }}
                                      >
                                        <Lucide
                                          icon="Trash2"
                                          className="w-4 h-4 text-red-500"
                                        />
                                      </a>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="text-xs">
                                  {prescription.dose} {prescription.Unit},{" "}
                                  {prescription.route}
                                </div>
                                <div className="text-xs italic">
                                  {t("Indication")}: {prescription.indication}
                                </div>
                                <div className="text-xs">
                                  {t("Started")}: {format(startDate, "dd/MM")}{" "}
                                  {prescription.administration_time}
                                </div>
                                <div
                                  className={`text-xs font-medium flex items-center gap-1 ${status.color || ""}`}
                                >
                                  {status.text || prescription.validate_status}

                                  {prescription.validate_status ===
                                    "Rejected" &&
                                    prescription.validate_reason && (
                                      <div className="relative group cursor-pointer">
                                        <Lucide
                                          icon="Info"
                                          className="w-3.5 h-3.5 text-slate-500"
                                        />

                                        {/* Smart tooltip that positions based on available space */}
                                        <div
                                          className="absolute bottom-full mb-2 
            hidden group-hover:flex 
            bg-gray-800 text-white text-xs rounded px-4 py-2 
            z-[9999] shadow-lg
            min-w-[200px] max-w-[300px]
            whitespace-normal break-words text-left
            before:content-[''] before:absolute before:top-full
            before:border-4 before:border-transparent before:border-t-gray-800"
                                          style={{
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            // If the tooltip would go off the right edge, adjust it
                                            marginRight: "-100px", // This helps with positioning
                                          }}
                                          onMouseEnter={(e) => {
                                            const tooltip = e.currentTarget;
                                            const rect =
                                              tooltip.getBoundingClientRect();
                                            const viewportWidth =
                                              window.innerWidth;

                                            // If tooltip goes off the right edge
                                            if (rect.right > viewportWidth) {
                                              tooltip.style.left = "auto";
                                              tooltip.style.right = "0";
                                              tooltip.style.transform = "none";
                                              // Adjust arrow position
                                              tooltip.style.setProperty(
                                                "--arrow-left",
                                                "auto",
                                              );
                                              tooltip.style.setProperty(
                                                "--arrow-right",
                                                "10px",
                                              );
                                            }

                                            // If tooltip goes off the left edge
                                            if (rect.left < 0) {
                                              tooltip.style.left = "0";
                                              tooltip.style.transform = "none";
                                              // Adjust arrow position
                                              tooltip.style.setProperty(
                                                "--arrow-left",
                                                "10px",
                                              );
                                              tooltip.style.setProperty(
                                                "--arrow-right",
                                                "auto",
                                              );
                                            }
                                          }}
                                        >
                                          {prescription.validate_reason}
                                          {/* Arrow that adjusts position dynamically */}
                                          <div
                                            className="absolute top-full border-4 border-transparent border-t-gray-800"
                                            style={{
                                              left: "var(--arrow-left, 50%)",
                                              right: "var(--arrow-right, auto)",
                                              transform: "translateX(-50%)",
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                                {prescription.stopped_at ? (
                                  <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded">
                                    <div className="text-[10px] font-bold text-red-600 uppercase">
                                      {t("Stopped")}
                                    </div>
                                    <div className="text-[10.5px] text-red-600">
                                      {t("date")}:{" "}
                                      {format(
                                        parseISO(prescription.stopped_at),
                                        "dd/MM/yy HH:mm",
                                      )}
                                    </div>
                                  </div>
                                ) : userrole != "Observer" && !isExpired ? (
                                  // ONLY SHOW STOP BUTTON IF NOT STOPPED
                                  <Button
                                    variant="soft-primary"
                                    size="sm"
                                    className="font-semibold mt-1"
                                    onClick={() => {
                                      setStopConfirmationModal(true);
                                      setSinglePrescription(prescription);
                                    }}
                                  >
                                    {t("stopMedication")}
                                  </Button>
                                ) : (
                                  <></>
                                )}
                              </td>
                              <td className="border px-3 py-2 text-center align-middle">
                                {prescription.administration_time}
                              </td>
                              {allDates.map((dateStr) => {
                                // Logic: Parse chart date to compare with stop date
                                const [d, m, y] = dateStr
                                  .split("/")
                                  .map(Number);
                                const cellDate = new Date(2000 + y, m - 1, d);
                                const isAfterStop =
                                  stopDate && cellDate > startOfDay(stopDate);
                                const isScheduled =
                                  scheduledDates.includes(dateStr);
                                return (
                                  <td
                                    key={dateStr}
                                    className="border px-2 text-center"
                                  >
                                    {isAfterStop ? (
                                      <span className="text-red-600 font-bold">
                                        {" "}
                                        ✕{" "}
                                      </span>
                                    ) : (
                                      <FormCheck.Input
                                        type="checkbox"
                                        checked={isScheduled}
                                        disabled
                                      />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "requests" && (
        <div className="flex-1 flex flex-col p-4 space-y-4 bg-gray-50 border rounded-lg">
          <h2 className="text-lg font-bold text-gray-900">
            {t("Prescription Requests")}
          </h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm text-left bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3">{t("Drug Group")}</th>
                  <th className="border px-4 py-3">{t("Sub Group")}</th>
                  <th className="border px-4 py-3">{t("Medication")}</th>
                  <th className="border px-4 py-3">{t("Dose")}</th>
                  <th className="border px-4 py-3">{t("Status")}</th>
                  <th className="border px-4 py-3 text-center">
                    {t("Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border px-4 py-8 text-center">
                      {t("No_pending_requests_found")}
                    </td>
                  </tr>
                ) : (
                  pendingPrescriptions.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-3">
                        {req.DrugGroup || "---"}
                      </td>
                      <td className="border px-4 py-3">
                        {req.DrugSubGroup || "---"}
                      </td>
                      <td className="border px-4 py-3 font-medium text-primary">
                        {req.medication_name}
                      </td>
                      <td className="border px-4 py-3">
                        {req.dose} {req.Unit}
                      </td>
                      <td className="border px-4 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {req.validate_status || "Pending"}
                        </span>
                      </td>
                      <td className="border px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="soft-secondary"
                            size="sm"
                            onClick={() => handleViewRequest(req.id)}
                            title={t("View")}
                          >
                            <Lucide icon="Eye" className="w-4 h-4" />
                          </Button>
                          {userrole !== "User" && userrole !== "Observer" && (
                            <>
                              <Button
                                variant="soft-success"
                                size="sm"
                                onClick={() => handleAcceptRequest(req.id)}
                                title={t("Accept")}
                              >
                                <Lucide icon="Check" className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="soft-danger"
                                size="sm"
                                onClick={() => handleRejectRequest(req.id)}
                                title={t("Reject")}
                              >
                                <Lucide icon="X" className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Prescription Details Modal */}
      <Dialog
        open={viewPrescriptionModal}
        onClose={() => setViewPrescriptionModal(false)}
      >
        <Dialog.Panel className="p-10 text-left">
          <div className="flex justify-between items-center mb-5 border-b pb-3">
            <h2 className="text-xl font-bold">{t("Prescription_Details")}</h2>
            <Lucide
              icon="X"
              className="w-6 h-6 cursor-pointer"
              onClick={() => setViewPrescriptionModal(false)}
            />
          </div>
          {viewPrescriptionData && (
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="font-semibold">{t("Medication")}:</div>
              <div>{viewPrescriptionData.medication_name}</div>

              <div className="font-semibold">{t("Drug Group")}:</div>
              <div>{viewPrescriptionData.DrugGroup}</div>

              <div className="font-semibold">{t("Sub Group")}:</div>
              <div>{viewPrescriptionData.DrugSubGroup || "---"}</div>

              <div className="font-semibold">{t("Dose")}:</div>
              <div>
                {viewPrescriptionData.dose} {viewPrescriptionData.Unit}
              </div>

              <div className="font-semibold">{t("Frequency")}:</div>
              <div>
                {viewPrescriptionData.Frequency} ({viewPrescriptionData.Way})
              </div>

              <div className="font-semibold">{t("Route")}:</div>
              <div>{viewPrescriptionData.route}</div>

              <div className="font-semibold">{t("Indication")}:</div>
              <div>{viewPrescriptionData.indication}</div>

              <div className="font-semibold">{t("Duration")}:</div>
              <div>
                {viewPrescriptionData.days_given}{" "}
                {viewPrescriptionData.Duration}
              </div>

              <div className="font-semibold">{t("Start Date")}:</div>
              <div>
                {format(
                  parseISO(viewPrescriptionData.start_date),
                  "dd/MM/yy HH:mm",
                )}
              </div>

              <div className="font-semibold">{t("Admin Time")}:</div>
              <div>{viewPrescriptionData.administration_time}</div>

              <div className="font-semibold">{t("Status")}:</div>
              <div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    viewPrescriptionData.validate_status === "validated" ||
                    viewPrescriptionData.validate_status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : viewPrescriptionData.validate_status === null ||
                          viewPrescriptionData.validate_status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {viewPrescriptionData.validate_status || "Pending"}
                </span>
              </div>

              <div className="font-semibold col-span-2 mt-2">
                {t("Instructions")}:
              </div>
              <div className="col-span-2 italic text-slate-600">
                {viewPrescriptionData.Instructions || "---"}
              </div>

              <div className="font-semibold col-span-2 mt-2">
                {t("Description")}:
              </div>
              <div className="col-span-2 p-2 bg-gray-50 rounded border">
                {viewPrescriptionData.description}
              </div>
            </div>
          )}
          <div className="mt-8 text-right">
            <Button
              variant="primary"
              onClick={() => setViewPrescriptionModal(false)}
            >
              {t("Close")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Delete Confirmation Modal */}
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
                onClick={() => setDeleteConfirmationModal(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                className="w-24"
                onClick={handleDeleteNoteConfirm}
              >
                {t("delete")}
              </Button>
            </div>
          </Dialog.Panel>
        </Dialog>
      )}

      {/* Stop Medication Confirmation */}
      <Dialog
        open={stopConfirmationModal}
        onClose={() => setStopConfirmationModal(false)}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="AlertCircle"
              className="w-16 h-16 mx-auto mt-3 text-primary"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">{t("reallyStop")}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-primary"
              className="w-24 mr-4"
              onClick={() => setStopConfirmationModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              className="w-24"
              onClick={() =>
                singlePrescription && handleStopMedication(singlePrescription)
              }
            >
              {t("stop")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Validation/Accept Modal */}
      <Dialog open={validationModal} onClose={() => setValidationModal(false)}>
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="ShieldCheck"
              className="w-16 h-16 mx-auto mt-3 text-pending"
            />
            <div className="mt-5 text-xl font-bold">
              {t("Validate_Accept_Prescription")}
            </div>
            <div className="mt-4 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("Pharmacist_Name")}
              </label>
              <FormInput
                type="text"
                placeholder={t("Enter_your_full_name")}
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
              />
            </div>
          </div>
          <div className="px-5 pb-8 text-center flex justify-center gap-3">
            <Button
              variant="outline-secondary"
              className="w-24"
              onClick={() => setValidationModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              className="w-32"
              disabled={isValidating || !pharmacistName}
              onClick={handleValidatePrescription}
            >
              {isValidating ? t("validating...") : t("Validate_Now")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={rejectionModal} onClose={() => setRejectionModal(false)}>
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-xl font-bold">
              {t("Reject_Prescription")}
            </div>
            <div className="mt-4 text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Pharmacist_Name")}
                </label>
                <FormInput
                  type="text"
                  placeholder={t("Enter_your_full_name")}
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Reason_for_Rejection")}
                </label>
                <FormInput
                  type="text"
                  placeholder={t("Enter_reason_for_rejection")}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="px-5 pb-8 text-center flex justify-center gap-3">
            <Button
              variant="outline-secondary"
              className="w-24"
              onClick={() => setRejectionModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              className="w-32"
              disabled={isValidating || !pharmacistName || !rejectionReason}
              onClick={handleRejectPrescription}
            >
              {isValidating ? t("rejecting...") : t("Reject_Now")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
