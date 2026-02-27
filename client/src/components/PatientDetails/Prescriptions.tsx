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
} from "@/actions/patientActions";
import { t } from "i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import SubscriptionModal from "../SubscriptionModal.tsx";
import { parseISO, addDays, format, isAfter, startOfDay } from "date-fns";
import { useAppContext } from "@/contexts/sessionContext";
import { set } from "lodash";
import { io, Socket } from "socket.io-client";
import Lucide from "../Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import medicationOptions from "../../medicationOptions.json";
import { getUserOrgIdAction } from "@/actions/userActions";

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
}

const Prescriptions: React.FC<Props> = ({
  patientId,
  onShowAlert,
  onDataUpdate,
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
  const [validationModal, setValidationModal] = useState(false);
  const [pharmacistName, setPharmacistName] = useState("");
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
      // console.log(normalizedData, "normaliseee");
      setPrescriptions(normalizedData);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    }
  };

  useEffect(() => {
    if (patientId) fetchPrescriptions();
  }, [patientId]);

  // Fill form with prescription data for editing
  const fillFormForEditing = (prescription: Prescription) => {
    setDescription(prescription.description);
    setMedicationName(prescription.medication_name);
    setIndication(prescription.indication);
    setDose(prescription.dose);
    setRoute(prescription.route);
    setDrugGroup(prescription.DrugGroup);
    setDrugSubGroup(prescription.DrugSubGroup);
    setTypeofDrug(prescription.TypeofDrug);
    // console.log(prescription, "presptionnnnnn");
    setMedicationName(prescription.medication_name);
    setUnit(prescription.Unit);
    setWay(prescription.Way);
    setFrequency(prescription.Frequency);
    setInstruction(prescription.Instructions);
    setDuration(prescription.Duration);

    // Format date for datetime-local input
    const formattedDate = format(
      parseISO(prescription.start_date),
      "yyyy-MM-dd'T'HH:mm",
    );
    setStartDate(formattedDate);

    setDaysGiven(prescription.days_given.toString());
    setAdministrationTime(prescription.administration_time);
    setCurrentPrescriptionId(prescription.id);
    setIsEditing(true);

    // Set available doses based on selected medication
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
        patient_id: firstPrescription?.patient_id || 0,
        validatedBy: userData.id,
      };

      await validatePrescriptionAction(payload);

      onShowAlert({
        variant: "success",
        message: t("Prescription validated successfully"),
      });

      setValidationModal(false);
      setPharmacistName("");
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
        // Add new prescription
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

      // Reset form and reload prescriptions
      resetForm();
      setIsFormVisible(false);

      const updatedData = await getPrescriptionsAction(
        patientId,
        userData.orgid,
      );
      setPrescriptions(updatedData);
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

  // Fetch medications
  const fetchMedications = async () => {
    try {
      const meds = await getAllMedicationsAction();
      // console.log(meds, "medssssss");
      setMedicationsList(meds);
    } catch (err) {
      console.error("Failed to fetch medications:", err);
    }
  };

  const data = medicationsList;

  const DrugGroupList = [...new Set(data.map((d) => d.DrugGroup))];

  // SubGroup list based on selected DrugGroup
  const DrugSubGroupList = data
    .filter((d) => d.DrugGroup === DrugGroup)
    .map((d) => d.DrugSubGroup)
    .filter((v, i, self) => self.indexOf(v) === i);

  // TypeofDrug list based on selected DrugSubGroup
  const TypeofDrugList = DrugSubGroup
    ? data
        .filter((d) => d.DrugSubGroup === DrugSubGroup)
        .map((d) => d.TypeofDrug)
        .filter((v, i, self) => self.indexOf(v) === i)
    : data
        .filter((d) => d.DrugGroup === DrugGroup)
        .map((d) => d.TypeofDrug)
        .filter((v, i, self) => self.indexOf(v) === i);

  // Medication list based on selected TypeofDrug
  const MedicationList = data
    .filter((d) => d.TypeofDrug === TypeofDrug)
    .map((d) => d.medication);

  useEffect(() => {
    fetchMedications();
  }, []);

  const allDates = React.useMemo(() => {
    if (!prescriptions.length) return [];

    const minStartDate = prescriptions
      .map((p) => parseISO(p.start_date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const maxEndDate = prescriptions
      .map((p) => addDays(parseISO(p.start_date), Number(p.days_given) - 1))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const daysDiff =
      (maxEndDate.getTime() - minStartDate.getTime()) / (1000 * 60 * 60 * 24);

    return Array.from({ length: daysDiff + 1 }, (_, i) =>
      format(addDays(minStartDate, i), "dd/MM/yy"),
    );
  }, [prescriptions]);

  const handleEditClick = async (prescriptionId: number) => {
    try {
      const prescriptionToEdit =
        await getPrescriptionsByIdAction(prescriptionId);
      if (!prescriptionToEdit) return;

      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      const isSuperadmin = userData.role === "Superadmin";
      const isOwner =
        Number(userData.id) === Number(prescriptionToEdit.doctor_id);

      // if (isSuperadmin || isOwner) {
      fillFormForEditing(prescriptionToEdit);
      setIsFormVisible(true);
      // } else {
      //   onShowAlert({ variant: "danger", message: t("Youcanonly") });
      // }
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

  return (
    <div className="space-y-4">
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      <div className="flex justify-between">
        <div>
          {(userrole === "Admin" ||
            userrole === "Faculty" ||
            userrole === "User") && (
            <div>
              <Button
                variant="primary"
                className="text-white font-semibold"
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

        {}

        <div className="mt-2">
          {firstPrescription?.validated_at ? (
            <div className="p-2 bg-green-50 border border-green-200 rounded flex flex-col">
              <div className="flex items-center text-green-700 font-bold text-[11px] uppercase">
                <Lucide icon="CheckCircle" className="w-4 h-4 mr-1" />
                {t("Validated by Pharmacist")}
              </div>
              <div className="text-[11px] text-green-600 ml-5">
                {firstPrescription.pharmacistName} -{" "}
                {format(
                  parseISO(firstPrescription.validated_at),
                  "dd/MM/yy HH:mm",
                )}
              </div>
            </div>
          ) : (
            userrole !== "Observer" &&
            prescriptions.length != 0 &&
            !isFormVisible && (
              <Button
                variant="soft-pending"
                size="sm"
                className="border-dashed border-orange-300"
                onClick={() => {
                  // setSinglePrescription(singlePrescription);
                  setValidationModal(true);
                }}
              >
                <Lucide icon="ShieldCheck" className="w-5 h-5 mr-1" />
                {t("Verify & Validate")}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Card Body */}
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
                <FormSelect
                  value={DrugGroup}
                  onChange={(e) => {
                    setDrugGroup(e.target.value);
                    setDrugSubGroup("");
                    setTypeofDrug("");
                    setMedicationName("");
                    setErrors((prev) => ({ ...prev, DrugGroup: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                    errors.DrugGroup ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("SelectDrugGroup")}</option>
                  {DrugGroupList.map((g, i) => (
                    <option key={i} value={g}>
                      {g?.toUpperCase()}
                    </option>
                  ))}
                </FormSelect>
                {errors.DrugGroup && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.DrugGroup}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("DrugSubGroup")}
                </label>

                <FormSelect
                  value={DrugSubGroup}
                  onChange={(e) => {
                    setDrugSubGroup(e.target.value);
                    setTypeofDrug("");
                    setMedicationName("");
                    setErrors((prev) => ({ ...prev, DrugSubGroup: "" }));
                  }}
                  disabled={!DrugGroup}
                  className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                    errors.DrugSubGroup ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  {!DrugGroup ? (
                    <option value="">{t("SelectDrugGroupFirst")}</option>
                  ) : DrugSubGroupList.length === 0 ? (
                    <option value="">{t("NoSubGroupAvailable")}</option>
                  ) : (
                    <>
                      <option value="">{t("SelectDrugSubGroup")}</option>
                      {DrugSubGroupList.map((sg, i) => (
                        <option key={i} value={sg}>
                          {sg ? sg : "---"}
                        </option>
                      ))}
                    </>
                  )}
                </FormSelect>

                {errors.DrugSubGroup && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.DrugSubGroup}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("TypeofDrug")}
                </label>
                <FormSelect
                  value={TypeofDrug}
                  onChange={(e) => {
                    setTypeofDrug(e.target.value);
                    setMedicationName("");
                    setErrors((prev) => ({ ...prev, TypeofDrug: "" }));
                  }}
                  disabled={!DrugGroup}
                  className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                    errors.daysGiven ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("SelectTypeofDrug")}</option>
                  {TypeofDrugList.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </FormSelect>
                {errors.TypeofDrug && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.TypeofDrug}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("MedicationName")}
                </label>
                <FormSelect
                  value={medicationName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setMedicationName(name);

                    // Find selected medication object
                    const selected = medicationsList.find(
                      (m) => m.medication === name,
                    );

                    // Set available doses
                    setAvailableDoses(selected?.dose || []);

                    // Reset dose
                    setDose("");

                    setErrors((prev) => ({ ...prev, medicationName: "" }));
                  }}
                  disabled={!TypeofDrug}
                  className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                    errors.daysGiven ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("SelectMedication")}</option>
                  {MedicationList.map((m, i) => (
                    <option key={i} value={m}>
                      {m}
                    </option>
                  ))}
                </FormSelect>
                {errors.medicationName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.medicationName}
                  </p>
                )}
              </div>

              <div>
                {/* ONE LABEL ONLY */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Dose")}
                </label>
                {medicationName && (
                  <div className="flex justify-between">
                    <p className="text-yellow-500">E.g. {availableDoses}</p>

                    <a
                      href={`https://bnf.nice.org.uk/drugs/${medicationName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      BNF Link
                    </a>
                  </div>
                )}

                {/* ALL FIELDS IN ONE ROW */}
                <div className="flex flex-wrap gap-3">
                  {/* DOSE */}
                  <div className="flex-1 min-w-[120px]">
                    <FormInput
                      type="text"
                      value={dose}
                      placeholder={t("Enter Dose")}
                      className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                        errors.dose ? "border-red-300" : "border-gray-200"
                      }`}
                      onChange={(e) => {
                        setDose(e.target.value);
                        setErrors((prev) => ({ ...prev, dose: "" }));
                      }}
                    />

                    {errors.dose && (
                      <p className="text-xs text-red-600">{errors.dose}</p>
                    )}
                  </div>

                  {/* UNITS */}
                  <div className="flex-1 min-w-[100px]">
                    <FormSelect
                      value={unit}
                      onChange={(e) => {
                        setUnit(e.target.value);
                        setErrors((prev) => ({ ...prev, unit: "" }));
                      }}
                      disabled={!medicationName}
                      className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                        errors.unit ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">{t("SelectUnit")}</option>
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </FormSelect>
                    {errors.unit && (
                      <p className="text-xs text-red-600">{errors.unit}</p>
                    )}
                  </div>

                  {/* WAYS */}
                  <div className="flex-1 min-w-[120px]">
                    <FormSelect
                      value={way}
                      onChange={(e) => {
                        setWay(e.target.value);
                        setErrors((prev) => ({ ...prev, way: "" }));
                      }}
                      disabled={!medicationName}
                      className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                        errors.way ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">{t("SelectWay")}</option>
                      {ways.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </FormSelect>
                    {errors.way && (
                      <p className="text-xs text-red-600">{errors.way}</p>
                    )}
                  </div>

                  {/* FREQUENCY */}
                  <div className="flex-1 min-w-[120px]">
                    <FormSelect
                      value={frequency}
                      onChange={(e) => {
                        setFrequency(e.target.value);
                        setErrors((prev) => ({ ...prev, frequency: "" }));
                      }}
                      disabled={!medicationName}
                      className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                        errors.frequency ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">{t("SelectFrequency")}</option>
                      {frequencies.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </FormSelect>
                    {errors.frequency && (
                      <p className="text-xs text-red-600">{errors.frequency}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Instructions")}
                </label>
                <FormSelect
                  value={instruction}
                  onChange={(e) => {
                    setInstruction(e.target.value);
                    setErrors((prev) => ({ ...prev, instruction: "" }));
                  }}
                  disabled={!medicationName}
                  className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                    errors.instruction ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("SelectInstruction")}</option>
                  {instructions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </FormSelect>
                {errors.instruction && (
                  <p className="text-xs text-red-600">{errors.instruction}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Route"}
                </label>
                <FormInput
                  type="text"
                  placeholder="e.g. Oral"
                  value={route}
                  onChange={(e) => {
                    setRoute(e.target.value);
                    setErrors((prev) => ({ ...prev, route: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.route ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.route && (
                  <p className="text-xs text-red-600">{errors.route}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("AdministrationTime")}
                </label>
                <FormInput
                  type="time"
                  value={administrationTime}
                  onChange={(e) => {
                    setAdministrationTime(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      administrationTime: "",
                    }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.administrationTime
                      ? "border-red-300"
                      : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.administrationTime && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.administrationTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Indication")}
                </label>
                <FormInput
                  type="text"
                  placeholder="e.g. Hypertension"
                  value={indication}
                  onChange={(e) => {
                    setIndication(e.target.value);
                    setErrors((prev) => ({ ...prev, indication: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.indication ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.indication && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.indication}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("description")}
                </label>
                <FormTextarea
                  rows={6}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  placeholder="Write prescription details here..."
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.description ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("StartDate")}
                </label>
                <FormInput
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setErrors((prev) => ({ ...prev, startDate: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.startDate ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("DaysGiven")}
                </label>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormInput
                      type="number"
                      placeholder="e.g. 7"
                      min="1"
                      max="99"
                      value={daysGiven}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) <= 99 && Number(value) >= 1)
                        ) {
                          setDaysGiven(e.target.value);
                          setErrors((prev) => ({ ...prev, daysGiven: "" }));
                        }
                      }}
                      className={`w-full rounded-lg text-xs sm:text-sm ${
                        errors.daysGiven ? "border-red-300" : "border-gray-200"
                      } focus:ring-1 focus:ring-primary`}
                    />
                    {errors.daysGiven && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.daysGiven}
                      </p>
                    )}
                  </div>

                  <div className="flex-1">
                    <FormSelect
                      value={Duration}
                      onChange={(e) => {
                        setDuration(e.target.value);
                        setErrors((prev) => ({ ...prev, Duration: "" }));
                      }}
                      className={`w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary ${
                        errors.Duration ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">{t("SelectDuration")}</option>
                      {duration.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </FormSelect>
                    {errors.Duration && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.Duration}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 space-x-2">
                <Button
                  variant="outline-secondary"
                  onClick={handleCancelForm}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSavePrescription}
                  disabled={loading}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
                >
                  {loading ? (
                    <div className="loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : isEditing ? (
                    t("update_prescription")
                  ) : (
                    t("add_prescription")
                  )}
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
                        className={`border px-3 py-2 ${
                          date === format(new Date(), "dd/MM/yy")
                            ? "bg-yellow-100 font-semibold"
                            : ""
                        }`}
                      >
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2 + allDates.length}
                        className="border px-3 py-4 text-center text-gray-500"
                      >
                        {t("Noprescriptionsfound")}
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map((prescription) => {
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

                      return (
                        <tr key={prescription.id}>
                          <td className="border px-3 py-2 align-top">
                            <div className="font-semibold flex justify-between">
                              {prescription.medication_name}
                              {localStorage.getItem("role") !== "Observer" ? (
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
                              {prescription.dose}, {prescription.route}
                            </div>
                            <div className="text-xs italic">
                              {t("Indication")}: {prescription.indication}
                            </div>
                            <div className="text-xs">
                              {t("Started")}: {format(startDate, "dd/MM")}{" "}
                              {prescription.administration_time}
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
                            const [d, m, y] = dateStr.split("/").map(Number);
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
                                    ✕
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
                  setPrescriptionIdToDelete(null);
                }}
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
              onClick={() => {
                setStopConfirmationModal(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              className="w-24"
              onClick={() => {
                if (singlePrescription) {
                  handleStopMedication(singlePrescription);
                }
              }}
            >
              {t("stop")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Validation Modal */}
      <Dialog open={validationModal} onClose={() => setValidationModal(false)}>
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="ShieldCheck"
              className="w-16 h-16 mx-auto mt-3 text-pending"
            />
            <div className="mt-5 text-xl font-bold">
              {t("Validate Prescription")}
            </div>
            <div className="mt-2 text-slate-500">
              {t(
                "Please confirm you have reviewed the dosage and medication safety.",
              )}
            </div>

            <div className="mt-4 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("Pharmacist Name")}
              </label>
              <FormInput
                type="text"
                placeholder={t("Enter your full name")}
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                className="w-full"
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
              {isValidating ? t("validating...") : t("Validate Now")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
