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
import { getAdminOrgAction } from "@/actions/adminActions";
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
import { Info } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";
import Lucide from "@/components/Base/Lucide";

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
  plan?: string;
  planDate?: string;
}

interface Country {
  code: string;
  country: string;
  name: string;
}

interface FormData {
  organization_id?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ageGroup: string;
  gender: string;
  type: string;
  address: string;
  category: string;
  ethnicity: string;
  nationality: string;
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
  allergies: string;
  LifetimeMedicalHistory: string;
}

interface FormErrors {
  organization_id?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ageGroup: string;
  gender: string;
  type: string;
  address: string;
  category: string;
  ethnicity: string;
  nationality: string;
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
  allergies: string;
  LifetimeMedicalHistory: string;
}

const Main: React.FC<Component> = ({
  onShowAlert,
  patientCount,
  plan,
  planDate,
}) => {
  const { addTask, updateTask } = useUploads();
  const user = localStorage.getItem("role");
  const userEmail = localStorage.getItem("user");
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [patientsAllowed, setPatientsAllowed] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";
  const [showInfo, setShowInfo] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(true);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

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
          if (Array.isArray(data)) {
            setOrganizations(data);
          }
        } catch (error) {
          console.error("Error fetching organisations:", error);
        }
      }
    };

    fetchOrganizations();
  }, [user]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ageGroup: "",
    gender: "",
    type: "",
    address: "",
    category: "",
    ethnicity: "",
    nationality: "",
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
    allergies: "",
    LifetimeMedicalHistory: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ageGroup: "",
    gender: "",
    type: "",
    address: "",
    category: "",
    ethnicity: "",
    nationality: "",
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
    allergies: "",
    LifetimeMedicalHistory: "",
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
      return user === "Superadmin" && formData.type !== "public" && !stringValue
        ? t("organizationRequired")
        : "";
    }

    if (fieldName === "gender") {
      return !stringValue ? t("genderRequired") : "";
    }

    if (fieldName === "ageGroup") {
      return !stringValue ? t("ageGroupRequired") : "";
    }

    switch (fieldName) {
      case "name":
        if (stringValue.length < 2) {
          return t("nameTooShort");
        } else if (stringValue.length > 50) {
          return t("NameMaxLength");
        }
        break;

      // case "email":
      //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
      //     return t("invalidEmail");
      //   }
      //   const atIndex = stringValue.indexOf("@");
      //   if (atIndex === -1 || atIndex > 64) {
      //     return t("Maximumcharacter64before");
      //   }
      //   break;

      case "phone":
        const fullPhone = selectedCountry?.code + stringValue;
        if (!/^[\d\s+()-]{10,17}$/.test(fullPhone)) {
          return t("invalidPhone");
        }
        break;

      case "dateOfBirth":
        if (!stringValue) return t("fieldRequired");
        if (Number.isNaN(Number(stringValue))) return t("mustBeNumeric");
        break;

      case "height":
        if (!stringValue) {
          return t("heightRequired");
        }
        if (!/^\d*\.?\d+$/.test(stringValue)) {
          return t("invalidHeightFormat");
        }
        if (!/[0-9.]/.test(stringValue)) {
          return t("invalidHeightFormat2");
        }
        const height = parseFloat(stringValue);
        if (isNaN(height)) {
          return t("invalidHeightFormat");
        }
        if (height < 50 || height > 250) {
          return t("heightOutOfRange");
        }
        break;

      case "weight":
        if (!stringValue) {
          return t("weightRequired");
        }
        if (!/^\d*\.?\d+$/.test(stringValue)) {
          return t("invalidWeightFormat");
        }
        const weight = parseFloat(stringValue);
        if (isNaN(weight)) {
          return t("invalidWeightFormat");
        }
        if (weight < 1 || weight > 600) {
          return t("weightOutOfRange");
        }
        break;

      case "category":
      case "ethnicity":
      case "nationality":
        if (stringValue.length > 50) {
          return t("mustbeless50");
        } else if (stringValue.length < 4) {
          return t("fieldTooShort");
        }
        break;
      case "address":
      case "scenarioLocation":
      case "roomType":
        if (stringValue.length < 2) {
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
        const wordCount = stringValue.trim().split(/\s+/).length;
        // if (stringValue.length > 700) {
        //   return t("fieldTooLong");
        // }
        if (wordCount > 200) {
          return t("fieldTooLong");
        }
        break;
    }

    return "";
  };

  const validateCurrentStep = (step: number): boolean => {
    const fieldsToValidate: (keyof FormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate.push(
          "name",
          "email",
          "phone",
          "dateOfBirth",
          "ageGroup",
          "allergies"
        );
        if (user === "Superadmin") fieldsToValidate.push("organization_id");
        break;
      case 2:
        fieldsToValidate.push(
          "gender",
          "type",
          "address",
          "category",
          "ethnicity",
          "nationality",
          "height",
          "weight"
        );
        break;
      // case 3:
      //   fieldsToValidate.push(
      //     "scenarioLocation",
      //     "roomType",
      //     "socialEconomicHistory",
      //     "familyMedicalHistory",
      //     "lifestyleAndHomeSituation"
      //   );
      //   break;
      // case 4:
      //   fieldsToValidate.push(
      //     "medicalEquipment",
      //     "pharmaceuticals",
      //     "diagnosticEquipment",
      //     "bloodTests",
      //     "initialAdmissionObservations",
      //     "expectedObservationsForAcuteCondition"
      //   );
      //   break;
      // case 5:
      //   fieldsToValidate.push(
      //     "patientAssessment",
      //     "recommendedObservationsDuringEvent",
      //     "observationResultsRecovery",
      //     "observationResultsDeterioration",
      //     "recommendedDiagnosticTests",
      //     "treatmentAlgorithm",
      //     "correctTreatment",
      //     "expectedOutcome",
      //     "healthcareTeamRoles",
      //     "teamTraits"
      //   );
      //   break;
    }

    const errors: Partial<FormErrors> = {};
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setFormErrors((prev) => ({ ...prev, ...errors }));
    return isValid;
  };

  const nextStep = () => {
    // ❗ BLOCK NEXT STEP IF EMAIL IS NOT AVAILABLE
    // if (!isEmailAvailable) {
    //   setFormErrors((prev) => ({
    //     ...prev,
    //     email: t("Emailalreadyexists"),
    //   }));
    //   return;
    // }

    // Superadmin-specific logic
    if (user !== "Superadmin") {
      console.log(patientsAllowed, "patientsAllowedpatientsAllowed");
      const patientLimit = patientsAllowed
        ? Number(patientsAllowed)
        : Number(data?.patients);
      if (patientCount && patientCount >= patientLimit) {
        setIsValid(true);
        setLoading(false);

        // already checked above, but keep to be safe
        // if (!isEmailAvailable) {
        //   return;
        // }
        return;
      }
    }

    // General validation for the step
    if (validateCurrentStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
    // if (name === "email") {
    //   checkEmailExistsDebounced(value);
    // }
  };

  // const checkEmailExistsDebounced = debounce(async (email: string) => {
  //   try {
  //     const exists = await checkEmailExistsAction(email);
  //     if (exists) {
  //       setIsEmailAvailable(false);
  //       setFormErrors((prev) => ({
  //         ...prev,
  //         email: t("Emailalreadyexists"),
  //       }));
  //     } else {
  //       setIsEmailAvailable(true);
  //       setFormErrors((prev) => ({ ...prev, email: "" }));
  //     }
  //   } catch (error) {
  //     console.error("Email existence check failed:", error);
  //   }
  // }, 400);

  const defaultFormErrors: FormErrors = {
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    ageGroup: "",
    gender: "",
    type: "",
    address: "",
    category: "",
    ethnicity: "",
    nationality: "",
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
    allergies: "",
    LifetimeMedicalHistory: "",
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      ageGroup: "",
      gender: "",
      type: "",
      address: "",
      category: "",
      ethnicity: "",
      nationality: "",
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
      allergies: "",
      LifetimeMedicalHistory: "",
    });
  };

  const handleSubmit = async () => {
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");
    setShowAlert(null);
    setFormErrors((prev) => ({ ...prev, email: "" }));

    if (user !== "Superadmin" && patientCount) {
      if (patientCount >= Number(data.patients)) {
        setIsValid(true);
        setLoading(false);
        return;
      }
    }

    const isValid = validateCurrentStep(currentStep);
    if (!isValid) {
      console.warn("Form validation failed. Aborting submit.");
      return;
    }

    setLoading(true);
    setFileName("");
    setFileUrl("");
    setFormErrors(defaultFormErrors);

    try {
      // const emailExists = await checkEmailExistsAction(formData.email);
      // if (emailExists) {
      //   setFormErrors((prev) => ({
      //     ...prev,
      //     email: t("Emailalreadyexists"),
      //   }));
      //   setLoading(false);
      //   return;
      // }

      const formDataToSend = new FormData();

      if (user === "Superadmin" && formData.organization_id) {
        formDataToSend.append(
          "organisation_id",
          formData.organization_id.toString()
        );
      } else {
        const data = await getUserOrgIdAction(String(userEmail));
        formDataToSend.append("organisation_id", data.organisation_id);
      }

      const fullPhoneNumber = selectedCountry?.code + formData.phone;

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "phone") {
          formDataToSend.append(key, fullPhoneNumber);
        } else if (key === "organization_id") {
          return;
        } else if (value) {
          formDataToSend.append(key, value);
        }
      });
      formDataToSend.append("status", "completed");
      formDataToSend.append("addedBy", data1.id);

      const response = await createPatientAction(formDataToSend);

      if (response.success) {
        resetForm();
        setCurrentStep(1);
        onShowAlert({
          variant: "success",
          message: t("PatientAddedSuccessfully"),
        });
        localStorage.setItem(
          "PatientAddedSuccessfully",
          t("PatientAddedSuccessfully")
        );
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
      if (currentStep < totalSteps) {
        nextStep();
      } else {
        handleSubmit();
      }
    }
  };

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  useEffect(() => {
    const fetchCountries = async () => {
      const org = await getAdminOrgAction(String(localStorage.getItem("user")));
      setPatientsAllowed(org.patients_allowed);
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd"
        );
        const data = await response.json();

        // Process country data
        const countryList = data
          .filter((country: any) => country.idd.root && country.idd.suffixes)
          .map((country: any) => ({
            code: country.idd.root + (country.idd.suffixes[0] || ""),
            country: country.cca2,
            name: country.name.common,
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(countryList);
        setSelectedCountry(countryList[0] || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
        // Fallback data with proper typing
        const fallbackData: Country[] = [
          { code: "+1", country: "US", name: "United States" },
          { code: "+44", country: "GB", name: "United Kingdom" },
          { code: "+91", country: "IN", name: "India" },
          { code: "+61", country: "AU", name: "Australia" },
          { code: "+81", country: "JP", name: "Japan" },
        ];
        setCountries(fallbackData);
        setSelectedCountry(fallbackData[0]);
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find((c) => c.code === e.target.value);
    if (selected) {
      setSelectedCountry(selected);
      setFormErrors((prev) => ({
        ...prev,
        phone: validateField("phone", formData.phone),
      }));
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData((prev) => ({ ...prev, phone: value }));

    setFormErrors((prev) => ({
      ...prev,
      phone: validateField("phone", value),
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-8">
            {/* Organization Dropdown for Superadmin */}
            {user === "Superadmin" && (
              <div className="col-span-2">
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
                  {/* {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))} */}

                  {organizations.map((org, index) => (
                    <option key={`${org.id}-${index}`} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </FormSelect>
                {formErrors.organization_id && (
                  <p className="text-red-500 text-sm">
                    {formErrors.organization_id}
                  </p>
                )}
              </div>
            )}

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
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (e.key === " ") {
                    e.preventDefault();
                  }
                }}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm">{formErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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

              <div className="flex mb-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                  value={selectedCountry?.code || ""}
                  onChange={handleCountryChange}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <option value="">{t("loading")}</option>
                  ) : (
                    countries.map((country) => (
                      <option key={country.country} value={country.code}>
                        {country.code}
                      </option>
                    ))
                  )}
                </select>
                <FormInput
                  id="phone"
                  type="tel"
                  className={`flex-1 rounded-l-none ${clsx({
                    "border-danger": formErrors.phone,
                  })}`}
                  name="phone"
                  placeholder={t("enter_phone")}
                  value={formData.phone}
                  onChange={handlePhoneInputChange}
                  onKeyDown={handleKeyDown}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>
              {formErrors.phone && (
                <p className="text-red-500 text-sm">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
              {/* <Litepicker
                name="dateOfBirth"
                value={
                  formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString("en-GB")
                    : ""
                }
                onChange={(e: { target: { value: string } }) => {
                  handleDateChange(e.target.value);
                }}
                className={formErrors.dateOfBirth ? "border-red-500 mb-2" : ""}
                options={{
                  autoApply: false,
                  showWeekNumbers: true,
                  dropdowns: {
                    minYear: 1900,
                    maxYear: new Date().getFullYear(),
                    months: true,
                    years: true,
                  },
                  maxDate: new Date(),
                  format: "DD/MM/YYYY",
                }}
                placeholder={t("agePlaceholder")}
              /> */}
              <FormInput
                id="dateOfBirth"
                type="text"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.dateOfBirth,
                })}`}
                name="dateOfBirth"
                placeholder={t("agePlaceholder")}
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={2}
              />
              {formErrors.dateOfBirth && (
                <p className="text-red-500 text-sm">{formErrors.dateOfBirth}</p>
              )}
            </div>
            {/* Age Group Dropdown */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="ageGroup" className="font-bold">
                    {t("age_group")}
                  </FormLabel>
                  <span className="md:hidden text-red-500 ml-1">*</span>
                </div>
                <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span>
              </div>
              <FormSelect
                id="ageGroup"
                name="ageGroup"
                className={`w-full mt-1 border rounded-md px-3 py-2 ${
                  formErrors.ageGroup ? "border-red-500" : ""
                }`}
                value={formData.ageGroup}
                onChange={handleInputChange}
              >
                <option value="">{t("select_age_group")}</option>
                <option value="child">{t("child_0_12")}</option>
                <option value="teen">{t("teen_13_19")}</option>
                <option value="adult">{t("adult_20_59")}</option>
                <option value="senior">{t("senior_60_plus")}</option>
              </FormSelect>
              {formErrors.ageGroup && (
                <p className="text-red-500 text-sm">{formErrors.ageGroup}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="allergies"
                    className="font-bold AddPatientLabel"
                  >
                    {t("allergies")}
                  </FormLabel>
                  <span className="md:hidden text-red-500 ml-1">*</span>
                </div>
                <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span>
              </div>
              <FormInput
                id="allergies"
                type="text"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.allergies,
                })}`}
                name="allergies"
                placeholder={t("enter_allergies")}
                value={formData.allergies}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.allergies && (
                <p className="text-red-500 text-sm">{formErrors.allergies}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2 grid grid-cols-2 gap-6">
              {/* Gender */}
              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("gender")}
                </FormLabel>

                <FormSelect
                  id="gender"
                  value={formData.gender}
                  name="gender"
                  onChange={handleInputChange}
                  className={`w-full ${
                    formErrors.gender ? "border-red-500" : ""
                  }`}
                >
                  <option value="">{t("select_gender")}</option>
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                  <option value="Transgender Male">{t("trans_male")}</option>
                  <option value="Transgender Female">
                    {t("trans_female")}
                  </option>
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

                {formErrors.gender && (
                  <p className="text-red-500 text-sm">{formErrors.gender}</p>
                )}
              </div>

              {/* Visibility */}
              <div className="relative">
                <FormLabel className="block font-medium mb-1 flex items-center gap-2">
                  {t("type")}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                  >
                    <Info size={16} className="text-gray-500 cursor-pointer" />
                    {showInfo && (
                      <div className="absolute left-6 top-0 w-56 p-2 bg-white border rounded-lg shadow-md text-sm z-10">
                        <p className="text-gray-600">
                          <strong>{t("public")}:</strong>{" "}
                          {t("Data is visible to all assigned team members")}
                        </p>
                        <p className="text-gray-600 mt-1">
                          <strong>{t("Private")}:</strong>{" "}
                          {t("Data will remain restricted")}
                        </p>
                      </div>
                    )}
                  </div>
                </FormLabel>

                <FormSelect
                  name="type"
                  value={formData.type}
                  onChange={(e) => {
                    const newVisibility = e.target.value;
                    setFormData({
                      ...formData,
                      type: newVisibility,
                    });
                    setFormErrors((prev) => ({
                      ...prev,
                      type: "",
                    }));
                  }}
                  className={`w-full ${
                    formErrors.type ? "border-red-500" : ""
                  }`}
                >
                  <option value="">{t("_select_type_")}</option>
                  <option value="public">{t("public")}</option>
                  <option value="private">{t("private")}</option>
                </FormSelect>

                {formErrors.type && (
                  <p className="text-red-500 text-sm">{formErrors.type}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="nationality" className="font-bold ">
                    {t("nationality")}
                  </FormLabel>
                  <span className="md:hidden text-red-500 ml-1">*</span>
                </div>
                <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span>
              </div>
              <FormInput
                id="nationality"
                type="text"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.nationality,
                })}`}
                name="nationality"
                placeholder={t("enter_nationality")}
                value={formData.nationality}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.nationality && (
                <p className="text-red-500 text-sm">{formErrors.nationality}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
                onKeyDown={(e) => {
                  // allow control/navigation keys
                  if (
                    e.key === "Backspace" ||
                    e.key === "Delete" ||
                    e.key === "Tab" ||
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowRight"
                  ) {
                    return;
                  }

                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                  if (e.key === "Enter") {
                    if (currentStep < totalSteps) {
                      nextStep();
                    } else {
                      handleSubmit();
                    }
                  }
                }}
              />
              {formErrors.height && (
                <p className="text-red-500 text-sm">{formErrors.height}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
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
                onKeyDown={(e) => {
                  // allow control/navigation keys
                  if (
                    e.key === "Backspace" ||
                    e.key === "Delete" ||
                    e.key === "Tab" ||
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowRight"
                  ) {
                    return;
                  }

                  // allow only numbers and dot
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                  if (e.key === "Enter") {
                    if (currentStep < totalSteps) {
                      nextStep();
                    } else {
                      handleSubmit();
                    }
                  }
                }}
              />
              {formErrors.weight && (
                <p className="text-red-500 text-sm">{formErrors.weight}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="scenarioLocation" className="font-bold ">
                    {t("scenario_location")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
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
              {/* {formErrors.scenarioLocation && (
                <p className="text-red-500 text-sm">
                  {formErrors.scenarioLocation}
                </p>
              )} */}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="roomType" className="font-bold ">
                    {t("room_type")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormInput
                id="roomType"
                type="text"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.roomType,
                })}`}
                name="roomType"
                placeholder={t("enter_room_type")}
                value={formData.roomType}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {/* {formErrors.roomType && (
                <p className="text-red-500 text-sm">{formErrors.roomType}</p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-5">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="socialEconomicHistory"
                    className="font-bold "
                  >
                    {t("social_economic_history")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="socialEconomicHistory"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.socialEconomicHistory,
                })}`}
                name="socialEconomicHistory"
                placeholder={t("enter_social_economic_history")}
                value={formData.socialEconomicHistory}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.socialEconomicHistory && (
                <p className="text-red-500 text-sm">
                  {formErrors.socialEconomicHistory}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="familyMedicalHistory"
                    className="font-bold "
                  >
                    {t("family_medical_history")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="familyMedicalHistory"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.familyMedicalHistory,
                })}`}
                name="familyMedicalHistory"
                placeholder={t("enter_family_medical_history")}
                value={formData.familyMedicalHistory}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.familyMedicalHistory && (
                <p className="text-red-500 text-sm">
                  {formErrors.familyMedicalHistory}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="lifestyleAndHomeSituation"
                    className="font-bold "
                  >
                    {t("lifestyle_and_home_situation")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="lifestyleAndHomeSituation"
                className={`w-full${clsx({
                  // "border-danger": formErrors.lifestyleAndHomeSituation,
                })}`}
                name="lifestyleAndHomeSituation"
                placeholder={t("enter_lifestyle_and_home_situation")}
                value={formData.lifestyleAndHomeSituation}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.lifestyleAndHomeSituation && (
                <p className="text-red-500 text-sm">
                  {formErrors.lifestyleAndHomeSituation}
                </p>
              )} */}
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="LifetimeMedicalHistory"
                    className="font-bold "
                  >
                    {t("LifetimeMedicalHistory")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="LifetimeMedicalHistory"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.LifetimeMedicalHistory,
                })}`}
                name="LifetimeMedicalHistory"
                placeholder={t("enterLifetimeMedicalHistory")}
                value={formData.LifetimeMedicalHistory}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.LifetimeMedicalHistory && (
                <p className="text-red-500 text-sm">
                  {formErrors.LifetimeMedicalHistory}
                </p>
              )} */}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="medicalEquipment" className="font-bold ">
                    {t("medical_equipment")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="medicalEquipment"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.medicalEquipment,
                })}`}
                name="medicalEquipment"
                placeholder={t("enter_medical_equipment")}
                value={formData.medicalEquipment}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.medicalEquipment && (
                <p className="text-red-500 text-sm">
                  {formErrors.medicalEquipment}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="pharmaceuticals" className="font-bold ">
                    {t("pharmaceuticals")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="pharmaceuticals"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.pharmaceuticals,
                })}`}
                name="pharmaceuticals"
                placeholder={t("enter_pharmaceuticals")}
                value={formData.pharmaceuticals}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.pharmaceuticals && (
                <p className="text-red-500 text-sm">
                  {formErrors.pharmaceuticals}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="diagnosticEquipment"
                    className="font-bold "
                  >
                    {t("diagnostic_equipment")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="diagnosticEquipment"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.diagnosticEquipment,
                })}`}
                name="diagnosticEquipment"
                placeholder={t("enter_diagnostic_equipment")}
                value={formData.diagnosticEquipment}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.diagnosticEquipment && (
                <p className="text-red-500 text-sm">
                  {formErrors.diagnosticEquipment}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="bloodTests" className="font-bold ">
                    {t("blood_tests")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="bloodTests"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.bloodTests,
                })}`}
                name="bloodTests"
                placeholder={t("enter_blood_tests")}
                value={formData.bloodTests}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.bloodTests && (
                <p className="text-red-500 text-sm">{formErrors.bloodTests}</p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="initialAdmissionObservations"
                    className="font-bold "
                  >
                    {t("initial_admission_observations")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="initialAdmissionObservations"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.initialAdmissionObservations,
                })}`}
                name="initialAdmissionObservations"
                placeholder={t("enter_initial_admission_observations")}
                value={formData.initialAdmissionObservations}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.initialAdmissionObservations && (
                <p className="text-red-500 text-sm">
                  {formErrors.initialAdmissionObservations}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="expectedObservationsForAcuteCondition"
                    className="font-bold "
                  >
                    {t("expected_observations_for_acute_condition")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="expectedObservationsForAcuteCondition"
                className={`w-full${clsx({
                  // "border-danger":
                  // formErrors.expectedObservationsForAcuteCondition,
                })}`}
                name="expectedObservationsForAcuteCondition"
                placeholder={t(
                  "enter_expected_observations_for_acute_condition"
                )}
                value={formData.expectedObservationsForAcuteCondition}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.expectedObservationsForAcuteCondition && (
                <p className="text-red-500 text-sm">
                  {formErrors.expectedObservationsForAcuteCondition}
                </p>
              )} */}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="patientAssessment" className="font-bold ">
                    {t("patient_assessment")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="patientAssessment"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.patientAssessment,
                })}`}
                name="patientAssessment"
                placeholder={t("enter_patient_assessment")}
                value={formData.patientAssessment}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.patientAssessment && (
                <p className="text-red-500 text-sm">
                  {formErrors.patientAssessment}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="recommendedObservationsDuringEvent"
                    className="font-bold "
                  >
                    {t("recommended_observations_during_event")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="recommendedObservationsDuringEvent"
                className={`w-full mb-2 ${clsx({
                  // "border-danger":
                  //   formErrors.recommendedObservationsDuringEvent,
                })}`}
                name="recommendedObservationsDuringEvent"
                placeholder={t("enter_recommended_observations_during_event")}
                value={formData.recommendedObservationsDuringEvent}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.recommendedObservationsDuringEvent && (
                <p className="text-red-500 text-sm">
                  {formErrors.recommendedObservationsDuringEvent}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="observationResultsRecovery"
                    className="font-bold "
                  >
                    {t("observation_results_recovery")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="observationResultsRecovery"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.observationResultsRecovery,
                })}`}
                name="observationResultsRecovery"
                placeholder={t("enter_observation_results_recovery")}
                value={formData.observationResultsRecovery}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.observationResultsRecovery && (
                <p className="text-red-500 text-sm">
                  {formErrors.observationResultsRecovery}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="observationResultsDeterioration"
                    className="font-bold "
                  >
                    {t("observation_results_deterioration")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="observationResultsDeterioration"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.observationResultsDeterioration,
                })}`}
                name="observationResultsDeterioration"
                placeholder={t("enter_observation_results_deterioration")}
                value={formData.observationResultsDeterioration}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.observationResultsDeterioration && (
                <p className="text-red-500 text-sm">
                  {formErrors.observationResultsDeterioration}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="recommendedDiagnosticTests"
                    className="font-bold "
                  >
                    {t("recommended_diagnostic_tests")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="recommendedDiagnosticTests"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.recommendedDiagnosticTests,
                })}`}
                name="recommendedDiagnosticTests"
                placeholder={t("enter_recommended_diagnostic_tests")}
                value={formData.recommendedDiagnosticTests}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.recommendedDiagnosticTests && (
                <p className="text-red-500 text-sm">
                  {formErrors.recommendedDiagnosticTests}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="treatmentAlgorithm"
                    className="font-bold "
                  >
                    {t("treatment_algorithm")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="treatmentAlgorithm"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.treatmentAlgorithm,
                })}`}
                name="treatmentAlgorithm"
                placeholder={t("enter_treatment_algorithm")}
                value={formData.treatmentAlgorithm}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.treatmentAlgorithm && (
                <p className="text-red-500 text-sm">
                  {formErrors.treatmentAlgorithm}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="correctTreatment" className="font-bold ">
                    {t("correct_treatment")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="correctTreatment"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.correctTreatment,
                })}`}
                name="correctTreatment"
                placeholder={t("enter_correct_treatment")}
                value={formData.correctTreatment}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.correctTreatment && (
                <p className="text-red-500 text-sm">
                  {formErrors.correctTreatment}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="expectedOutcome" className="font-bold ">
                    {t("expected_outcome")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="expectedOutcome"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.expectedOutcome,
                })}`}
                name="expectedOutcome"
                placeholder={t("enter_expected_outcome")}
                value={formData.expectedOutcome}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.expectedOutcome && (
                <p className="text-red-500 text-sm">
                  {formErrors.expectedOutcome}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="healthcareTeamRoles"
                    className="font-bold "
                  >
                    {t("healthcare_team_roles")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="healthcareTeamRoles"
                className={`w-full mb-2 ${clsx({
                  // "border-danger": formErrors.healthcareTeamRoles,
                })}`}
                name="healthcareTeamRoles"
                placeholder={t("enter_healthcare_team_roles")}
                value={formData.healthcareTeamRoles}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.healthcareTeamRoles && (
                <p className="text-red-500 text-sm">
                  {formErrors.healthcareTeamRoles}
                </p>
              )} */}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="teamTraits" className="font-bold ">
                    {t("team_traits")}
                  </FormLabel>
                  {/* <span className="md:hidden text-red-500 ml-1">*</span> */}
                </div>
                {/* <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
                  {t("required")}
                </span> */}
              </div>
              <FormTextarea
                id="teamTraits"
                className={`w-full ${clsx({
                  // "border-danger": formErrors.teamTraits,
                })}`}
                name="teamTraits"
                placeholder={t("enter_team_traits")}
                value={formData.teamTraits}
                onChange={handleInputChange}
                rows={3}
              />
              {/* {formErrors.teamTraits && (
                <p className="text-red-500 text-sm">{formErrors.teamTraits}</p>
              )} */}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const saveDraft = async () => {
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");
    const formDataToSend = new FormData();

    if (user === "Superadmin" && formData.organization_id) {
      formDataToSend.append(
        "organisation_id",
        formData.organization_id.toString()
      );
    } else {
      const data = await getUserOrgIdAction(String(userEmail));
      formDataToSend.append("organisation_id", data.organisation_id);
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataToSend.append(key, value);
    });

    formDataToSend.append("status", "draft");
    formDataToSend.append("addedBy", data1.id);

    const response = await createPatientAction(formDataToSend);

    if (response.success) {
      resetForm();
      setCurrentStep(1);
      onShowAlert({
        variant: "success",
        message: t("PatientAddedSuccessfully"),
      });
      localStorage.setItem(
        "PatientAddedSuccessfully",
        t("PatientAddedSuccessfully")
      );
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
  };

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);

    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);

    const currentDate = new Date();

    return currentDate > expirationDate;
  }

  const isFreePlanLimitReached =
    plan === "free" &&
    patientCount != undefined &&
    patientCount >= (data?.trialRecords || 10) &&
    (user === "Admin" || user === "Faculty" || user === "User");

  const isPerpetualLicenseExpired =
    plan === "5 Year Licence" &&
    isPlanExpired(planDate || "") &&
    (user === "Admin" ||
      user === "Faculty" ||
      user === "User" ||
      user === "Observer");

  useEffect(() => {
    if (isFreePlanLimitReached || isPerpetualLicenseExpired) {
      setShowUpsellModal(true);
    }
  }, [plan, patientCount, user]);

  const upgradePrompt = (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-300 rounded mb-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-center sm:text-left">
          <h3 className="font-semibold text-indigo-900">
            {t("patientreached")}
          </h3>
          <p className="text-sm text-indigo-700">
            {t("canAdd")}{" "}
            <span>{patientsAllowed ? patientsAllowed : data?.patients}</span>{" "}
            {t("perOrg")}
          </p>
        </div>
      </div>
    </div>
  );

  const isStep1 = currentStep === 1;

  const requiredFields = [
    formData.name,
    formData.email,
    formData.phone,
    formData.dateOfBirth,
    formData.ageGroup,
  ];

  // Only check organization if user is Superadmin
  if (user === "Superadmin") {
    requiredFields.push(String(formData.organization_id));
  }

  const isFormValid = requiredFields.every(
    (field) =>
      field !== undefined && field !== null && field.toString().trim() !== ""
  );

  return (
    <>
      {isValid && upgradePrompt}
      <div className="grid grid-cols-12 gap-3 mb-0">
        <div className="col-span-12 intro-y lg:col-span-12">
          <div className="py-10 mt-5 intro-y box sm:py-12">
            {/* Wizard Progress Bar */}
            <div className="relative before:hidden before:lg:block before:absolute before:w-[69%] before:h-[3px] before:top-0 before:bottom-0 before:mt-4 before:bg-slate-100 before:dark:bg-darkmode-400 flex flex-col lg:flex-row justify-center px-5 sm:px-20">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className="z-10 flex items-center flex-1 intro-x lg:text-center lg:block"
                >
                  <Button
                    variant={currentStep >= step ? "primary" : "secondary"}
                    className={`w-10 h-10 rounded-full ${
                      currentStep < step
                        ? "text-slate-500 bg-slate-100 dark:bg-darkmode-400 dark:border-darkmode-400"
                        : ""
                    }`}
                  >
                    {step}
                  </Button>
                  <div
                    className={`ml-3 text-base lg:w-32 lg:mt-3 lg:mx-auto ${
                      currentStep < step
                        ? "text-slate-600 dark:text-slate-400"
                        : "font-medium"
                    }`}
                  >
                    {step === 1 && t("basic_information")}
                    {step === 2 && t("personal_details")}
                    {step === 3 && t("medical_history")}
                    {step === 4 && t("observations_patient")}
                    {step === 5 && t("treatment_team")}
                  </div>
                </div>
              ))}
            </div>

            {/* Wizard Content */}
            <div className=" pt-10 mt-10 border-t p-8 border-slate-200/60 dark:border-darkmode-400">
              <div className="text-base font-medium">
                {currentStep === 1}
                {currentStep === 2}
                {currentStep === 3}
                {currentStep === 4}
                {currentStep === 5}
              </div>
              <div className="grid  gap-4 mt-5 gap-y-5">
                {renderStepContent()}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline-secondary"
              className="w-24"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              {t("previous")}
            </Button>

            <div>
              {currentStep >= 1 && (
                <Button
                  type="button"
                  variant="soft-primary"
                  className="w-32 mr-4"
                  onClick={saveDraft}
                  disabled={isStep1 && !isFormValid}
                >
                  {t("saveDraft")}
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={() => {
                    plan === "free" &&
                    patientCount != undefined &&
                    patientCount >= 10 &&
                    user == "Admin"
                      ? setShowUpsellModal(true)
                      : nextStep();
                  }}
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={() => {
                    if (isFreePlanLimitReached || isPerpetualLicenseExpired) {
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
              )}
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={plan || "free"}
      />
    </>
  );
};
export default Main;
