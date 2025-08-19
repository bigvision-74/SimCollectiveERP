import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/Base/Button";
import { useNavigate, useLocation } from "react-router-dom";
import Litepicker from "@/components/Base/Litepicker";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/Base/Form";
import {
  createPatientAction,
  checkEmailExistsAction,
} from "@/actions/patientActions";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { useUploads } from "@/components/UploadContext";
import { FormCheck } from "@/components/Base/Form";
import { getAllOrgAction } from "@/actions/organisationAction";
import { debounce } from "lodash";
import SubscriptionModal from "@/components/SubscriptionModal.tsx";
import { getUserOrgIdAction } from "@/actions/userActions";

interface Patient {
  name: string;
  patient_deleted: number;
}

interface Organization {
  id: number;
  organisation_id: string;
  name: string;
}
interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  patientCount?: number;
}

const Main: React.FC<Component> = ({ onShowAlert, patientCount }) => {
  const { addTask, updateTask } = useUploads();
  const user = localStorage.getItem("role");
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";

  useEffect(() => {
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });

      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  }, [alertMessage]);

  // Fetch organizations if user is Superadmin
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (user === "Superadmin") {
        try {
          const data = await getAllOrgAction();
          // If backend just returns array
          if (Array.isArray(data)) {
            setOrganizations(data);
          }
        } catch (error) {
          console.error("Error fetching organizations:", error);
        }
      }
    };

    fetchOrganizations();
  }, [user]);

  interface FormData {
    organization_id?: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    category: string;
    ethnicity: string;
    height: string;
    weight: string;
    scenarioLocation: string;
    roomType: string;
    socialEconomicHistory: string;
    familyMedicalHistory: string;
    lifestyleAndHomeSituation: string;
    medicalEquipment: string;
    pharmaceuticals: string;
    diagnosticEquipment: string;
    bloodTests: string;
    initialAdmissionObservations: string;
    expectedObservationsForAcuteCondition: string;
    patientAssessment: string;
    recommendedObservationsDuringEvent: string;
    observationResultsRecovery: string;
    observationResultsDeterioration: string;
    recommendedDiagnosticTests: string;
    treatmentAlgorithm: string;
    correctTreatment: string;
    expectedOutcome: string;
    healthcareTeamRoles: string;
    teamTraits: string;
  }

  interface FormErrors {
    organization_id?: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    category: string;
    ethnicity: string;
    height: string;
    weight: string;
    scenarioLocation: string;
    roomType: string;
    socialEconomicHistory: string;
    familyMedicalHistory: string;
    lifestyleAndHomeSituation: string;
    medicalEquipment: string;
    pharmaceuticals: string;
    diagnosticEquipment: string;
    bloodTests: string;
    initialAdmissionObservations: string;
    expectedObservationsForAcuteCondition: string;
    patientAssessment: string;
    recommendedObservationsDuringEvent: string;
    observationResultsRecovery: string;
    observationResultsDeterioration: string;
    recommendedDiagnosticTests: string;
    treatmentAlgorithm: string;
    correctTreatment: string;
    expectedOutcome: string;
    healthcareTeamRoles: string;
    teamTraits: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    category: "",
    ethnicity: "",
    height: "",
    weight: "",
    scenarioLocation: "",
    roomType: "",
    socialEconomicHistory: "",
    familyMedicalHistory: "",
    lifestyleAndHomeSituation: "",
    medicalEquipment: "",
    pharmaceuticals: "",
    diagnosticEquipment: "",
    bloodTests: "",
    initialAdmissionObservations: "",
    expectedObservationsForAcuteCondition: "",
    patientAssessment: "",
    recommendedObservationsDuringEvent: "",
    observationResultsRecovery: "",
    observationResultsDeterioration: "",
    recommendedDiagnosticTests: "",
    treatmentAlgorithm: "",
    correctTreatment: "",
    expectedOutcome: "",
    healthcareTeamRoles: "",
    teamTraits: "",
    organization_id: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    category: "",
    ethnicity: "",
    height: "",
    weight: "",
    scenarioLocation: "",
    roomType: "",
    socialEconomicHistory: "",
    familyMedicalHistory: "",
    lifestyleAndHomeSituation: "",
    medicalEquipment: "",
    pharmaceuticals: "",
    diagnosticEquipment: "",
    bloodTests: "",
    initialAdmissionObservations: "",
    expectedObservationsForAcuteCondition: "",
    patientAssessment: "",
    recommendedObservationsDuringEvent: "",
    observationResultsRecovery: "",
    observationResultsDeterioration: "",
    recommendedDiagnosticTests: "",
    treatmentAlgorithm: "",
    correctTreatment: "",
    expectedOutcome: "",
    healthcareTeamRoles: "",
    teamTraits: "",
    organization_id: "",
  });

  const formatFieldName = (fieldName: string): string => {
    const formatted = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/Required$/, "")
      .trim();

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const validateField = (
    fieldName: keyof FormData,
    value: string | number | null | undefined
  ): string => {
    const stringValue = value?.toString().trim() || "";

    if (!stringValue) {
      return t("fieldRequired", { field: formatFieldName(fieldName) });
    }

    if (fieldName === "organization_id") {
      return user === "Superadmin" && !stringValue
        ? t("organizationRequired")
        : "";
    }
    if (fieldName === "gender") {
      return !stringValue ? t("genderRequired") : "";
    }

    switch (fieldName) {
      case "name":
        if (stringValue.length < 2) {
          return t("nameTooShort");
        }
        break;

      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
          return t("invalidEmail");
        }
        break;

      case "phone":
        if (!/^[\d\s+()-]{10,15}$/.test(stringValue)) {
          return t("invalidPhone");
        }
        break;

      case "dateOfBirth":
        if (!stringValue) return t("fieldRequired");
        try {
          const [day, month, year] = stringValue.split("/");
          const date = new Date(`${year}-${month}-${day}`);
          if (isNaN(date.getTime())) {
            return t("invalidDateFormat");
          }
        } catch {
          return t("invalidDateFormat");
        }
        break;

      case "height":
      case "weight":
        if (!/^\d*\.?\d+$/.test(stringValue)) {
          return t("invalidNumber");
        }
        break;

      case "category":
      case "ethnicity":
        if (stringValue.length > 50) {
          return t("mustbeless50");
        } else if (stringValue.length < 4) {
          return t("fieldTooShort");
        } else {
        }
        break;
      case "address":
      case "scenarioLocation":
      case "roomType":
        if (stringValue.length < 4) {
          return t("fieldTooShort");
        }
        break;

      case "socialEconomicHistory":
      case "familyMedicalHistory":
      case "lifestyleAndHomeSituation":
      case "medicalEquipment":
      case "pharmaceuticals":
      case "diagnosticEquipment":
      case "bloodTests":
      case "initialAdmissionObservations":
      case "expectedObservationsForAcuteCondition":
      case "patientAssessment":
      case "recommendedObservationsDuringEvent":
      case "observationResultsRecovery":
      case "observationResultsDeterioration":
      case "recommendedDiagnosticTests":
      case "treatmentAlgorithm":
      case "correctTreatment":
      case "expectedOutcome":
      case "healthcareTeamRoles":
      case "teamTraits":
        if (stringValue.length > 700) {
          return t("fieldTooLong");
        }
        break;
    }

    return "";
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

    Object.keys(formData).forEach((key) => {
      // Skip organization_id validation for Superadmin and Faculty
      if (
        key === "organization_id" &&
        (user === "Admin" || user === "Faculty")
      ) {
        return; // skip validation here
      }

      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    // Validate organization_id only for users other than Superadmin or Faculty
    if (user !== "Admin" && user !== "Faculty") {
      const orgError = validateField(
        "organization_id",
        formData.organization_id
      );
      if (orgError) {
        errors.organization_id = orgError;
      }
    }

    // Always validate gender
    const genderError = validateField("gender", formData.gender);
    if (genderError) {
      errors.gender = genderError;
    }

    setFormErrors(errors as FormErrors);

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (type === "checkbox" || type === "radio") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked ? value : "",
      }));
    }

    setFormErrors((prev) => ({
      ...prev,
      [name as keyof FormData]: validateField(name as keyof FormData, value),
    }));
    if (name === "email") {
      checkEmailExistsDebounced(value);
    }
  };

  const checkEmailExistsDebounced = debounce(async (email: string) => {
    try {
      const exists = await checkEmailExistsAction(email);
      if (exists) {
        setFormErrors((prev) => ({ ...prev, email: "Email already exists" }));
      }
    } catch (error) {
      console.error("Email existence check failed:", error);
    }
  }, 400);

  const handleDateChange = (date: string) => {
    // Parse the date string in DD/MM/YYYY format
    const [day, month, year] = date.split("/");
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: formattedDate,
    }));

    setFormErrors((prev) => ({
      ...prev,
      dateOfBirth: validateField("dateOfBirth", formattedDate),
    }));
  };

  const defaultFormErrors: FormErrors = {
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    category: "",
    ethnicity: "",
    height: "",
    weight: "",
    scenarioLocation: "",
    roomType: "",
    socialEconomicHistory: "",
    familyMedicalHistory: "",
    lifestyleAndHomeSituation: "",
    medicalEquipment: "",
    pharmaceuticals: "",
    diagnosticEquipment: "",
    bloodTests: "",
    initialAdmissionObservations: "",
    expectedObservationsForAcuteCondition: "",
    patientAssessment: "",
    recommendedObservationsDuringEvent: "",
    observationResultsRecovery: "",
    observationResultsDeterioration: "",
    recommendedDiagnosticTests: "",
    treatmentAlgorithm: "",
    correctTreatment: "",
    expectedOutcome: "",
    healthcareTeamRoles: "",
    teamTraits: "",
  };
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      category: "",
      ethnicity: "",
      height: "",
      weight: "",
      scenarioLocation: "",
      roomType: "",
      socialEconomicHistory: "",
      familyMedicalHistory: "",
      lifestyleAndHomeSituation: "",
      medicalEquipment: "",
      pharmaceuticals: "",
      diagnosticEquipment: "",
      bloodTests: "",
      initialAdmissionObservations: "",
      expectedObservationsForAcuteCondition: "",
      patientAssessment: "",
      recommendedObservationsDuringEvent: "",
      observationResultsRecovery: "",
      observationResultsDeterioration: "",
      recommendedDiagnosticTests: "",
      treatmentAlgorithm: "",
      correctTreatment: "",
      expectedOutcome: "",
      healthcareTeamRoles: "",
      teamTraits: "",
      organization_id: user === "Superadmin" ? "" : formData.organization_id,
    });
  };

  const handleSubmit = async () => {
    setShowAlert(null);

    setFormErrors((prev) => ({ ...prev, email: "" }));

    const isValid = validateForm();

    if (!isValid) {
      console.warn("Form validation failed. Aborting submit.");
      return;
    }

    setLoading(true);
    setFileName("");
    setFileUrl("");
    setFormErrors(defaultFormErrors);

    try {
      // ✅ Final backend-level email check before submitting
      const emailExists = await checkEmailExistsAction(formData.email);
      if (emailExists) {
        setFormErrors((prev) => ({
          ...prev,
          email: "Email already exists",
        }));
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      const data = await getUserOrgIdAction(String(user));
      // Superadmin org id
      if (user === "Superadmin" && formData.organization_id) {
        formDataToSend.append(
          "organisation_id",
          formData.organization_id.toString()
        );
      } else {
        formDataToSend.append("organisation_id", data.organisation_id);
      }

      // Append all fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("dateOfBirth", formData.dateOfBirth);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("ethnicity", formData.ethnicity);
      formDataToSend.append("height", formData.height);
      formDataToSend.append("weight", formData.weight);
      formDataToSend.append("scenarioLocation", formData.scenarioLocation);
      formDataToSend.append("roomType", formData.roomType);
      formDataToSend.append(
        "socialEconomicHistory",
        formData.socialEconomicHistory
      );
      formDataToSend.append(
        "familyMedicalHistory",
        formData.familyMedicalHistory
      );
      formDataToSend.append(
        "lifestyleAndHomeSituation",
        formData.lifestyleAndHomeSituation
      );
      formDataToSend.append("medicalEquipment", formData.medicalEquipment);
      formDataToSend.append("pharmaceuticals", formData.pharmaceuticals);
      formDataToSend.append(
        "diagnosticEquipment",
        formData.diagnosticEquipment
      );
      formDataToSend.append("bloodTests", formData.bloodTests);
      formDataToSend.append(
        "initialAdmissionObservations",
        formData.initialAdmissionObservations
      );
      formDataToSend.append(
        "expectedObservationsForAcuteCondition",
        formData.expectedObservationsForAcuteCondition
      );
      formDataToSend.append("patientAssessment", formData.patientAssessment);
      formDataToSend.append(
        "recommendedObservationsDuringEvent",
        formData.recommendedObservationsDuringEvent
      );
      formDataToSend.append(
        "observationResultsRecovery",
        formData.observationResultsRecovery
      );
      formDataToSend.append(
        "observationResultsDeterioration",
        formData.observationResultsDeterioration
      );
      formDataToSend.append(
        "recommendedDiagnosticTests",
        formData.recommendedDiagnosticTests
      );
      formDataToSend.append("treatmentAlgorithm", formData.treatmentAlgorithm);
      formDataToSend.append("correctTreatment", formData.correctTreatment);
      formDataToSend.append("expectedOutcome", formData.expectedOutcome);
      formDataToSend.append(
        "healthcareTeamRoles",
        formData.healthcareTeamRoles
      );
      formDataToSend.append("teamTraits", formData.teamTraits);

      const response = await createPatientAction(formDataToSend);

      if (response.success) {
        resetForm();
        onShowAlert({
          variant: "success",
          message: t("PatientAddedSuccessfully"),
        });
        sessionStorage.setItem(
          "PatientAddedSuccessfully",
          t("PatientAddedSuccessfully")
        );
        // navigate("/patient-list", {
        //   state: { alertMessage: t("PatientAddedSuccessfully") },
        // });
      } else {
        onShowAlert({
          variant: "danger",
          message: response.message || t("formSubmissionError"),
        });
        setFormErrors((prev) => ({
          ...prev,
          general: response.message || t("formSubmissionError"),
        }));
      }
    } catch (error: any) {
      onShowAlert({
        variant: "danger",
        message: error.response?.data?.message || t("somethingWentWrong"),
      });
      setShowAlert({
        variant: "danger",
        message: error.response.data.message,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
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

      <div className="grid grid-cols-12 gap-3 mb-0">
        <div className="col-span-12 intro-y lg:col-span-12">
          <div className="intro-y">
            {/* Organization Dropdown for Superadmin */}
            {user === "Superadmin" && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FormLabel htmlFor="organization_id" className="font-bold">
                      {t("organization")}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>
                  <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="organization_id"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.organization_id,
                  })}`}
                  name="organization_id"
                  value={formData.organization_id || ""}
                  onChange={handleInputChange}
                >
                  <option value="">{t("select_organization")}</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </FormSelect>
                {formErrors.organization_id && (
                  <p className="text-red-500 text-sm">
                    {formErrors.organization_id}
                  </p>
                )}
              </>
            )}

            {/* Basic Information Section */}
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FormLabel
                      htmlFor="name"
                      className="font-bold AddPatientLabel"
                    >
                      {t("name")}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>
                  <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  id="name"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.name,
                  })}`}
                  name="name"
                  placeholder={t("enter_name")}
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FormLabel htmlFor="email" className="font-bold ">
                      {t("email")}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>

                  <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  id="email"
                  type="email"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.email,
                  })}`}
                  name="email"
                  placeholder={t("enter_email")}
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm">{formErrors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="flex items-center justify-between mt-5">
                  <div className="flex items-center">
                    <FormLabel htmlFor="phone" className="font-bold ">
                      {t("phone")}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>

                  <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  id="phone"
                  type="tel"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.phone,
                  })}`}
                  name="phone"
                  placeholder={t("enter_phone")}
                  value={formData.phone}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mt-5">
                  <div className="flex items-center">
                    <FormLabel htmlFor="date-of-birth" className="font-bold ">
                      {t("date_of_birth")}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>
                  <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <Litepicker
                  name="dateOfBirth"
                  value={
                    formData.dateOfBirth
                      ? new Date(formData.dateOfBirth).toLocaleDateString(
                          "en-GB"
                        )
                      : ""
                  }
                  onChange={(e: { target: { value: string } }) => {
                    handleDateChange(e.target.value);
                  }}
                  className={
                    formErrors.dateOfBirth ? "border-red-500 mb-2" : ""
                  }
                  options={{
                    autoApply: false,
                    showWeekNumbers: true,
                    dropdowns: {
                      minYear: 1950,
                      maxYear: new Date().getFullYear(),
                      months: true,
                      years: true,
                    },
                    maxDate: new Date(),
                    format: "DD/MM/YYYY",
                  }}
                  placeholder="dd/mm/yyyy"
                />

                {formErrors.dateOfBirth && (
                  <p className="text-red-500 text-sm">
                    {formErrors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <FormLabel className="block font-medium mb-1">
                {t("gender")}
              </FormLabel>
              <FormSelect
                id="gender"
                value={formData.gender}
                name="gender"
                onChange={handleInputChange}
                className={formErrors.gender ? "border-red-500" : ""}
              >
                <option value="">{t("select_gender")}</option>
                <option value="Male">{t("male")}</option>
                <option value="Female">{t("female")}</option>
                <option value="Transgender Male">{t("trans_male")}</option>
                <option value="Transgender Female">{t("trans_female")}</option>
                <option value="Non-Binary">{t("non_binary")}</option>
                <option value="Genderqueer">{t("genderqueer")}</option>
                <option value="Genderfluid">{t("genderfluid")}</option>
                <option value="Agender">{t("agender")}</option>
                <option value="Bigender">{t("bigender")}</option>
                <option value="Two-Spirit">{t("two_spirit")}</option>
                <option value="Demiboy">{t("demiboy")}</option>
                <option value="Demigirl">{t("demigirl")}</option>
                <option value="Androgynous">{t("androgynous")}</option>
                <option value="Intersex">{t("intersex")}</option>
                <option value="Neutrois">{t("neutrois")}</option>
                <option value="Pangender">{t("pangender")}</option>
                <option value="Gender Nonconforming">
                  {t("nonconforming")}
                </option>
                <option value="Questioning">{t("questioning")}</option>
              </FormSelect>
            </div>
            {formErrors.gender && (
              <p className="text-red-500 text-sm">{formErrors.gender}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="address" className="font-bold ">
                  {t("address")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="address"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.address,
              })}`}
              name="address"
              placeholder={t("enter_address")}
              value={formData.address}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.address && (
              <p className="text-red-500 text-sm">{formErrors.address}</p>
            )}

            {/* Additional Personal Information */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="category" className="font-bold ">
                  {t("category")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="category"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.category,
              })}`}
              name="category"
              placeholder={t("enter_category")}
              value={formData.category}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.category && (
              <p className="text-red-500 text-sm">{formErrors.category}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="ethnicity" className="font-bold ">
                  {t("ethnicity")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="ethnicity"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.ethnicity,
              })}`}
              name="ethnicity"
              placeholder={t("enter_ethnicity")}
              value={formData.ethnicity}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.ethnicity && (
              <p className="text-red-500 text-sm">{formErrors.ethnicity}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="height" className="font-bold ">
                  {t("height")} (cm){" "}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="height"
              type="tel"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.height,
              })}`}
              name="height"
              placeholder={t("enter_height")}
              value={formData.height}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.height && (
              <p className="text-red-500 text-sm">{formErrors.height}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="weight" className="font-bold ">
                  {t("weight")} (kg)
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="weight"
              type="tel"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.weight,
              })}`}
              name="weight"
              placeholder={t("enter_weight")}
              value={formData.weight}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.weight && (
              <p className="text-red-500 text-sm">{formErrors.weight}</p>
            )}

            {/* Location Information */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="scenarioLocation" className="font-bold ">
                  {t("scenario_location")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="scenarioLocation"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.scenarioLocation,
              })}`}
              name="scenarioLocation"
              placeholder={t("enter_scenario_location")}
              value={formData.scenarioLocation}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.scenarioLocation && (
              <p className="text-red-500 text-sm">
                {formErrors.scenarioLocation}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="roomType" className="font-bold ">
                  {t("room_type")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormInput
              id="roomType"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.roomType,
              })}`}
              name="roomType"
              placeholder={t("enter_room_type")}
              value={formData.roomType}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.roomType && (
              <p className="text-red-500 text-sm">{formErrors.roomType}</p>
            )}

            {/* Medical History Section */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="socialEconomicHistory"
                  className="font-bold "
                >
                  {t("social_economic_history")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="socialEconomicHistory"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.socialEconomicHistory,
              })}`}
              name="socialEconomicHistory"
              placeholder={t("enter_social_economic_history")}
              value={formData.socialEconomicHistory}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.socialEconomicHistory && (
              <p className="text-red-500 text-sm">
                {formErrors.socialEconomicHistory}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="familyMedicalHistory"
                  className="font-bold "
                >
                  {t("family_medical_history")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>

              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="familyMedicalHistory"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.familyMedicalHistory,
              })}`}
              name="familyMedicalHistory"
              placeholder={t("enter_family_medical_history")}
              value={formData.familyMedicalHistory}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.familyMedicalHistory && (
              <p className="text-red-500 text-sm">
                {formErrors.familyMedicalHistory}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="lifestyleAndHomeSituation"
                  className="font-bold "
                >
                  {t("lifestyle_and_home_situation")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="lifestyleAndHomeSituation"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.lifestyleAndHomeSituation,
              })}`}
              name="lifestyleAndHomeSituation"
              placeholder={t("enter_lifestyle_and_home_situation")}
              value={formData.lifestyleAndHomeSituation}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.lifestyleAndHomeSituation && (
              <p className="text-red-500 text-sm">
                {formErrors.lifestyleAndHomeSituation}
              </p>
            )}

            {/* Medical Equipment Section */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="medicalEquipment" className="font-bold ">
                  {t("medical_equipment")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>

              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="medicalEquipment"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.medicalEquipment,
              })}`}
              name="medicalEquipment"
              placeholder={t("enter_medical_equipment")}
              value={formData.medicalEquipment}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.medicalEquipment && (
              <p className="text-red-500 text-sm">
                {formErrors.medicalEquipment}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="pharmaceuticals" className="font-bold ">
                  {t("pharmaceuticals")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>

              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="pharmaceuticals"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.pharmaceuticals,
              })}`}
              name="pharmaceuticals"
              placeholder={t("enter_pharmaceuticals")}
              value={formData.pharmaceuticals}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.pharmaceuticals && (
              <p className="text-red-500 text-sm">
                {formErrors.pharmaceuticals}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="diagnosticEquipment" className="font-bold ">
                  {t("diagnostic_equipment")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="diagnosticEquipment"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.diagnosticEquipment,
              })}`}
              name="diagnosticEquipment"
              placeholder={t("enter_diagnostic_equipment")}
              value={formData.diagnosticEquipment}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.diagnosticEquipment && (
              <p className="text-red-500 text-sm">
                {formErrors.diagnosticEquipment}
              </p>
            )}

            {/* Observations Section */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="bloodTests" className="font-bold ">
                  {t("blood_tests")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="bloodTests"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.bloodTests,
              })}`}
              name="bloodTests"
              placeholder={t("enter_blood_tests")}
              value={formData.bloodTests}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.bloodTests && (
              <p className="text-red-500 text-sm">{formErrors.bloodTests}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="initialAdmissionObservations"
                  className="font-bold "
                >
                  {t("initial_admission_observations")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="initialAdmissionObservations"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.initialAdmissionObservations,
              })}`}
              name="initialAdmissionObservations"
              placeholder={t("enter_initial_admission_observations")}
              value={formData.initialAdmissionObservations}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.initialAdmissionObservations && (
              <p className="text-red-500 text-sm">
                {formErrors.initialAdmissionObservations}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="expectedObservationsForAcuteCondition"
                  className="font-bold "
                >
                  {t("expected_observations_for_acute_condition")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>

              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="expectedObservationsForAcuteCondition"
              className={`w-full mb-2 ${clsx({
                "border-danger":
                  formErrors.expectedObservationsForAcuteCondition,
              })}`}
              name="expectedObservationsForAcuteCondition"
              placeholder={t("enter_expected_observations_for_acute_condition")}
              value={formData.expectedObservationsForAcuteCondition}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.expectedObservationsForAcuteCondition && (
              <p className="text-red-500 text-sm">
                {formErrors.expectedObservationsForAcuteCondition}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="patientAssessment" className="font-bold ">
                  {t("patient_assessment")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="patientAssessment"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.patientAssessment,
              })}`}
              name="patientAssessment"
              placeholder={t("enter_patient_assessment")}
              value={formData.patientAssessment}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.patientAssessment && (
              <p className="text-red-500 text-sm">
                {formErrors.patientAssessment}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="recommendedObservationsDuringEvent"
                  className="font-bold "
                >
                  {t("recommended_observations_during_event")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="recommendedObservationsDuringEvent"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.recommendedObservationsDuringEvent,
              })}`}
              name="recommendedObservationsDuringEvent"
              placeholder={t("enter_recommended_observations_during_event")}
              value={formData.recommendedObservationsDuringEvent}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.recommendedObservationsDuringEvent && (
              <p className="text-red-500 text-sm">
                {formErrors.recommendedObservationsDuringEvent}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="observationResultsRecovery"
                  className="font-bold "
                >
                  {t("observation_results_recovery")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="observationResultsRecovery"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.observationResultsRecovery,
              })}`}
              name="observationResultsRecovery"
              placeholder={t("enter_observation_results_recovery")}
              value={formData.observationResultsRecovery}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.observationResultsRecovery && (
              <p className="text-red-500 text-sm">
                {formErrors.observationResultsRecovery}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="observationResultsDeterioration"
                  className="font-bold "
                >
                  {t("observation_results_deterioration")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="observationResultsDeterioration"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.observationResultsDeterioration,
              })}`}
              name="observationResultsDeterioration"
              placeholder={t("enter_observation_results_deterioration")}
              value={formData.observationResultsDeterioration}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.observationResultsDeterioration && (
              <p className="text-red-500 text-sm">
                {formErrors.observationResultsDeterioration}
              </p>
            )}

            {/* Treatment Section */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel
                  htmlFor="recommendedDiagnosticTests"
                  className="font-bold "
                >
                  {t("recommended_diagnostic_tests")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="recommendedDiagnosticTests"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.recommendedDiagnosticTests,
              })}`}
              name="recommendedDiagnosticTests"
              placeholder={t("enter_recommended_diagnostic_tests")}
              value={formData.recommendedDiagnosticTests}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.recommendedDiagnosticTests && (
              <p className="text-red-500 text-sm">
                {formErrors.recommendedDiagnosticTests}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="treatmentAlgorithm" className="font-bold ">
                  {t("treatment_algorithm")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="treatmentAlgorithm"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.treatmentAlgorithm,
              })}`}
              name="treatmentAlgorithm"
              placeholder={t("enter_treatment_algorithm")}
              value={formData.treatmentAlgorithm}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.treatmentAlgorithm && (
              <p className="text-red-500 text-sm">
                {formErrors.treatmentAlgorithm}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="correctTreatment" className="font-bold ">
                  {t("correct_treatment")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="correctTreatment"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.correctTreatment,
              })}`}
              name="correctTreatment"
              placeholder={t("enter_correct_treatment")}
              value={formData.correctTreatment}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.correctTreatment && (
              <p className="text-red-500 text-sm">
                {formErrors.correctTreatment}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="expectedOutcome" className="font-bold ">
                  {t("expected_outcome")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="expectedOutcome"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.expectedOutcome,
              })}`}
              name="expectedOutcome"
              placeholder={t("enter_expected_outcome")}
              value={formData.expectedOutcome}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.expectedOutcome && (
              <p className="text-red-500 text-sm">
                {formErrors.expectedOutcome}
              </p>
            )}

            {/* Healthcare Team Section */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="healthcareTeamRoles" className="font-bold ">
                  {t("healthcare_team_roles")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="healthcareTeamRoles"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.healthcareTeamRoles,
              })}`}
              name="healthcareTeamRoles"
              placeholder={t("enter_healthcare_team_roles")}
              value={formData.healthcareTeamRoles}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.healthcareTeamRoles && (
              <p className="text-red-500 text-sm">
                {formErrors.healthcareTeamRoles}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <FormLabel htmlFor="teamTraits" className="font-bold ">
                  {t("team_traits")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
              <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                {t("required")}
              </span>
            </div>
            <FormTextarea
              id="teamTraits"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.teamTraits,
              })}`}
              name="teamTraits"
              placeholder={t("enter_team_traits")}
              value={formData.teamTraits}
              onChange={handleInputChange}
              rows={3}
            />
            {formErrors.teamTraits && (
              <p className="text-red-500 text-sm">{formErrors.teamTraits}</p>
            )}

            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                className="w-24"
                onClick={() => {
                  console.log(patientCount, "nnnnnnnnnnnn");
                  if (
                    patientCount != undefined &&
                    patientCount >= 10 &&
                    user == "Admin"
                  ) {
                    setShowUpsellModal(true);
                  } else {
                    handleSubmit();
                  }
                }}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;
