import React, { useEffect, useState } from "react";
import { FormInput, FormTextarea, FormCheck } from "@/components/Base/Form";
import Button from "../Base/Button";
import {
  addPrescriptionAction,
  getPrescriptionsAction,
} from "@/actions/patientActions";
import { t } from "i18next";
import Lucide from "../Base/Lucide";
import { getAdminOrgAction } from "@/actions/adminActions";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import SubscriptionModal from "../SubscriptionModal.tsx";
import { parseISO, addDays, format } from "date-fns";
import { useAppContext } from "@/contexts/sessionContext";
import { set } from "lodash";

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
  route: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  patientId: number;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

interface UserData {
  id: number;
  planType: string;
  uid: number;
  username: string;
  orgid: number;
}

const Prescriptions: React.FC<Props> = ({ patientId, onShowAlert }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [loading, setLoading] = useState(false);
  const userrole = localStorage.getItem("role");

  const useremail = localStorage.getItem("user");
  const [description, setDescription] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [indication, setIndication] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("");
  const [startDate, setStartDate] = useState("");
  const [daysGiven, setDaysGiven] = useState("");
  const [administrationTime, setAdministrationTime] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [userData, setUserData] = useState<UserData>({} as UserData);
  const { sessionInfo } = useAppContext();

  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);

  const [errors, setErrors] = useState({
    description: "",
    medicationName: "",
    indication: "",
    dose: "",
    route: "",
    startDate: "",
    daysGiven: "",
    administrationTime: "",
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
      route: "",
      startDate: "",
      daysGiven: "",
      administrationTime: "",
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
    setSelectedPrescription(null);
    setErrors({
      description: "",
      medicationName: "",
      indication: "",
      startDate: "",
      daysGiven: "",
      administrationTime: "",
      dose: "",
      route: "",
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

  const handleAddPrescription = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const doctorID = userData.uid;

      // Add logic
      await addPrescriptionAction({
        patient_id: patientId,
        sessionId: Number(sessionInfo.sessionId),
        doctor_id: doctorID,
        organisation_id: userData.orgid,
        description,
        medication_name: medicationName,
        indication,
        dose,
        route,
        start_date: startDate,
        days_given: Number(daysGiven),
        administration_time: administrationTime,
      });

      const payloadData = {
        title: `Prescription Added`,
        body: `A New Prescription Added by ${userData.username}`,
        created_by: userData.uid,
        patient_id: patientId,
      };
      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData.orgid,
          sessionInfo.sessionId
        );
      }
      onShowAlert({
        variant: "success",
        message: t("Prescriptionaddedsuccessfully"),
      });

      // Reset form
      setDescription("");
      setIsAdding(false);
      setSelectedPrescription(null);

      // Reload prescriptions
      const updatedData = await getPrescriptionsAction(
        patientId,
        userData.orgid
      );
      setPrescriptions(updatedData);
    } catch (error) {
      console.error("Failed to add/update prescription:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedsaveprescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  //   fecth save pres  display on list
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));

        const data = await getPrescriptionsAction(patientId, userData.orgid);

        const normalizedData = data.map((item: any) => ({
          ...item,
          startDate: item.start_date, // camelCase for frontend use
          daysGiven: Number(item.days_given), // ensure number type
        }));

        setPrescriptions(normalizedData);
      } catch (error) {
        console.error("Error loading prescriptions:", error);
      }
    };

    if (patientId) fetchPrescriptions();
  }, [patientId]);

  const allDates = React.useMemo(() => {
    if (!prescriptions.length) return [];

    const maxDays = Math.max(...prescriptions.map((p) => Number(p.days_given)));

    const minStartDate = prescriptions
      .map((p) => parseISO(p.start_date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return Array.from({ length: maxDays }, (_, i) =>
      format(addDays(minStartDate, i), "dd/MM/yy")
    );
  }, [prescriptions]);

  const isFreePlanLimitReached =
    subscriptionPlan === "free" &&
    prescriptions.length >= 10 &&
    userrole === "Admin";

  const isPerpetualLicenseExpired =
    subscriptionPlan === "Perpetual License" &&
    isPlanExpired(planDate) &&
    userrole === "Admin";

  return (
    <div className="space-y-4">
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />
      {(userrole === "Admin" ||
        userrole === "Faculty" ||
        userrole === "User") && (
        <div>
          <Button
            variant="primary"
            className="text-white font-semibold"
            onClick={() => {
              isFreePlanLimitReached || isPerpetualLicenseExpired
                ? setShowUpsellModal(true)
                : setIsAdding((prev) => !prev);

              if (!isAdding) resetForm();
            }}
          >
            {isAdding ? t("back_to_medications") : t("add_prescription")}
          </Button>
        </div>
      )}

      {/* Card Body */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedPrescription !== null || isAdding ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {selectedPrescription
                ? t("edit_prescription")
                : t("new_prescription")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("MedicationName")}
                </label>
                <FormInput
                  type="text"
                  placeholder="e.g. Amlodipine"
                  value={medicationName}
                  onChange={(e) => {
                    setMedicationName(e.target.value);
                    setErrors((prev) => ({ ...prev, medicationName: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.medicationName ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.medicationName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.medicationName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("Dose")}
                </label>
                <FormInput
                  type="text"
                  placeholder="e.g. 10 mg"
                  value={dose}
                  onChange={(e) => {
                    setDose(e.target.value);
                    setErrors((prev) => ({ ...prev, dose: "" }));
                  }}
                  className={`w-full rounded-lg text-xs sm:text-sm ${
                    errors.dose ? "border-red-300" : "border-gray-200"
                  } focus:ring-1 focus:ring-primary`}
                />
                {errors.dose && (
                  <p className="text-xs text-red-600">{errors.dose}</p>
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
                <FormInput
                  type="number"
                  placeholder="e.g. 7"
                  min="1"
                  max="2"
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

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  onClick={handleAddPrescription}
                  disabled={loading}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
                >
                  {loading ? (
                    <div className="loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : (
                    t("add_prescription")
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-gray-50 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("MedicationAdministrationChart")}
            </h2>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm text-left bg-white">
                <thead className="bg-gray-100">
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
                        (_, i) => format(addDays(startDate, i), "dd/MM/yy")
                      );

                      return (
                        <tr key={prescription.id}>
                          <td className="border px-3 py-2 align-top">
                            <div className="font-semibold">
                              {prescription.medication_name}
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
                          </td>
                          <td className="border px-3 py-2 text-center align-middle">
                            {prescription.administration_time}
                          </td>

                          {allDates.map((date) => (
                            <td key={date} className="border px-2 text-center">
                              <FormCheck.Input
                                type="checkbox"
                                checked={givenDates.includes(date)}
                                disabled
                              />
                            </td>
                          ))}
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
    </div>
  );
};

export default Prescriptions;
