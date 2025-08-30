import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Button from "@/components/Base/Button";
import Litepicker from "@/components/Base/Litepicker";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/Base/Form";
import {
  getPatientByIdAction,
  updatePatientAction,
  checkEmailExistsAction,
} from "@/actions/patientActions";
import { getAllOrgAction } from "@/actions/organisationAction";
import { t } from "i18next";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import debounce from "lodash/debounce";
import { Info } from "lucide-react";

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  type: string;
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
  organization_id?: string;
}

interface Organization {
  id: number;
  organisation_id: string;
  name: string;
}
interface Country {
  code: string;
  country: string;
  name: string;
}

function EditPatient() {
  const { id } = useParams<{ id: string }>();
  const user = localStorage.getItem("role");
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [showInfo, setShowInfo] = useState(false);

  const initialFormData: PatientFormData = {
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    type: "",
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
  };

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<PatientFormData>>({});
  const [originalEmail, setOriginalEmail] = useState<string>("");

  useEffect(() => {
    const alertMessage = location.state?.alertMessage;
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });

      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );

      setTimeout(() => setShowAlert(null), 3000);
    }
  }, [location.state]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [orgsResponse, patientResponse] = await Promise.all([
        getAllOrgAction(),
        getPatientByIdAction(Number(id)),
      ]);

      if (orgsResponse.success && Array.isArray(orgsResponse.data)) {
        setOrganizations(orgsResponse.data);
      }

      if (patientResponse?.success && patientResponse.data) {
        const patient = patientResponse.data;
        setOriginalEmail(patient.email || "");
        let phoneWithoutCountryCode = patient.phone || "";
        let detectedCountry = countries[0] || null;

        if (patient.phone) {
          const foundCountry = countries.find((country) =>
            patient.phone.startsWith(country.code)
          );

          if (foundCountry) {
            detectedCountry = foundCountry;
            phoneWithoutCountryCode = patient.phone.replace(
              foundCountry.code,
              ""
            );
          }
        }
        console.log("Patient type from API:", patient);

        setSelectedCountry(detectedCountry);
        setFormData({
          name: patient.name || "",
          email: patient.email || "",
          phone: phoneWithoutCountryCode,
          dateOfBirth: patient.date_of_birth || "",
          gender: patient.gender || "male",
          type: patient.type ? patient.type.toLowerCase() : "",
          address: patient.address || "",
          category: patient.category || "",
          ethnicity: patient.ethnicity || "",
          height: patient.height || "",
          weight: patient.weight || "",
          scenarioLocation: patient.scenarioLocation || "",
          roomType: patient.roomType || "",
          socialEconomicHistory: patient.socialEconomicHistory || "",
          familyMedicalHistory: patient.familyMedicalHistory || "",
          lifestyleAndHomeSituation: patient.lifestyleAndHomeSituation || "",
          medicalEquipment: patient.medicalEquipment || "",
          pharmaceuticals: patient.pharmaceuticals || "",
          diagnosticEquipment: patient.diagnosticEquipment || "",
          bloodTests: patient.bloodTests || "",
          initialAdmissionObservations:
            patient.initialAdmissionObservations || "",
          expectedObservationsForAcuteCondition:
            patient.expectedObservationsForAcuteCondition || "",
          patientAssessment: patient.patientAssessment || "",
          recommendedObservationsDuringEvent:
            patient.recommendedObservationsDuringEvent || "",
          observationResultsRecovery: patient.observationResultsRecovery || "",
          observationResultsDeterioration:
            patient.observationResultsDeterioration || "",
          recommendedDiagnosticTests: patient.recommendedDiagnosticTests || "",
          treatmentAlgorithm: patient.treatmentAlgorithm || "",
          correctTreatment: patient.correctTreatment || "",
          expectedOutcome: patient.expectedOutcome || "",
          healthcareTeamRoles: patient.healthcareTeamRoles || "",
          teamTraits: patient.teamTraits || "",
          organization_id: patient.organization_id?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setShowAlert({
        variant: "danger",
        message: t("dataFetchError"),
      });
    } finally {
      setLoading(false);
    }
  }, [id, countries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          console.error("Error fetching organizations:", error);
        }
      }
    };

    fetchOrganizations();
  }, [user]);

  const preventLeadingSpace = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === " " && (e.target as HTMLInputElement).selectionStart === 0) {
      e.preventDefault();
    }
  };

  const formatFieldName = (fieldName: string): string => {
    const formatted = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/Required$/, "")
      .trim();

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const validateField = (
    fieldName: keyof PatientFormData,
    value: string | null | number | undefined
  ): string => {
    const stringValue = value?.toString().trim() || "";
    if (value?.toString().startsWith(" ")) {
      return t("noLeadingSpaces");
    }

    if (!stringValue) {
      return t("fieldRequired", { field: formatFieldName(fieldName) });
    }
    if (!stringValue) {
      return t("fieldRequired", { field: formatFieldName(fieldName) });
    }
    switch (fieldName) {
      case "name":
        if (stringValue.length < 2) {
          return t("nameTooShort");
        }
        return "";
      case "category":
      case "ethnicity":
        if (stringValue.length > 50) {
          return t("mustbeless50");
        } else if (stringValue.length < 4) {
          return t("fieldTooShort");
        }
        return "";
      case "address":
      case "scenarioLocation":
      case "roomType":
        if (stringValue.length < 4) {
          return t("fieldTooShort");
        }
        return "";
      case "email":
        if (!stringValue.trim()) return t("emailValidation1");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue))
          return t("emailValidation");
        return "";

      case "phone":
        const fullPhone = selectedCountry?.code + stringValue;
        if (!/^[\d\s+()-]{10,17}$/.test(fullPhone)) {
          return t("invalidPhone");
        }
        return "";

      case "dateOfBirth":
        if (!stringValue.trim()) return t("dateOfBirthValidation");
        return "";
      case "gender":
      case "organization_id":
        if (!stringValue.trim()) return t(`${fieldName}Validation`);
        return "";
      case "height":
      case "weight":
        if (stringValue && !/^\d*\.?\d+$/.test(stringValue))
          return t("invalidNumber");
        return "";
      default:
        return "";
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    const fieldsToValidate: (keyof PatientFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate.push("name", "email", "phone", "dateOfBirth");
        if (user === "Superadmin") fieldsToValidate.push("organization_id");
        break;
      case 2:
        fieldsToValidate.push(
          "gender",
          "type",
          "address",
          "category",
          "ethnicity",
          "height",
          "weight"
        );
        break;
      case 3:
        fieldsToValidate.push(
          "scenarioLocation",
          "roomType",
          "socialEconomicHistory",
          "familyMedicalHistory",
          "lifestyleAndHomeSituation"
        );
        break;
      case 4:
        fieldsToValidate.push(
          "medicalEquipment",
          "pharmaceuticals",
          "diagnosticEquipment",
          "bloodTests",
          "initialAdmissionObservations",
          "expectedObservationsForAcuteCondition"
        );
        break;
      case 5:
        fieldsToValidate.push(
          "patientAssessment",
          "recommendedObservationsDuringEvent",
          "observationResultsRecovery",
          "observationResultsDeterioration",
          "recommendedDiagnosticTests",
          "treatmentAlgorithm",
          "correctTreatment",
          "expectedOutcome",
          "healthcareTeamRoles",
          "teamTraits"
        );
        break;
    }

    const errors: Partial<PatientFormData> = {};
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

  const checkEmailExistsDebounced = debounce(async (email: string) => {
    try {
      if (email && email !== originalEmail) {
        const exists = await checkEmailExistsAction(email);
        if (exists) {
          setFormErrors((prev) => ({ ...prev, email: t("Emailexist") }));
        }
      }
    } catch (error) {
      console.error("Email existence check failed:", error);
    }
  }, 400);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" || type === "radio"
        ? (e.target as HTMLInputElement).checked
          ? value
          : ""
        : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof PatientFormData, newValue),
    }));
    if (name === "email") {
      setFormErrors((prev) => ({ ...prev, email: "" }));
      checkEmailExistsDebounced(newValue);
    }
  };

  const handleDateChange = (date: string) => {
    const [day, month, year] = date.split("/");
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;

    setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    setFormErrors((prev) => ({
      ...prev,
      dateOfBirth: validateField("dateOfBirth", formattedDate),
    }));
  };

  const sanitizeFormData = (data: PatientFormData): PatientFormData => {
    const sanitized: any = {};
    for (const key in data) {
      const val = data[key as keyof PatientFormData];
      sanitized[key] = typeof val === "string" ? val.trim() : val;
    }
    return sanitized;
  };

  const handleSubmit = async () => {
    setShowAlert(null);
    setFormErrors((prev) => ({ ...prev, email: "" }));

    if (!validateCurrentStep(currentStep)) {
      console.warn("Form validation failed");
      return;
    }

    // 👇 Always sanitize before submit
    const sanitizedData = sanitizeFormData(formData);

    // Combine country code with phone number
    const fullPhoneNumber = selectedCountry?.code + sanitizedData.phone;
    sanitizedData.phone = fullPhoneNumber;

    if (sanitizedData.email !== originalEmail) {
      const emailExists = await checkEmailExistsAction(sanitizedData.email);
      if (emailExists) {
        setFormErrors((prev) => ({ ...prev, email: t("Emailexist") }));
        return;
      }
    }

    setLoading(true);

    try {
      const response = await updatePatientAction(Number(id), {
        ...sanitizedData,
        date_of_birth: sanitizedData.dateOfBirth,
        organisation_id: sanitizedData.organization_id,
      });

      if (response.success) {
        sessionStorage.setItem(
          "PatientUpdatedSuccessfully",
          t("PatientUpdatedSuccessfully")
        );
        const from = localStorage.getItem("from");
        const orgId = localStorage.getItem("CrumbsOrg");

        if (from == "org") {
          navigate(`/organisations-settings/${orgId}`, {
            state: { alertMessage: t("PatientUpdatedSuccessfully") },
          });
        } else {
          navigate("/patients", {
            state: { alertMessage: t("PatientUpdatedSuccessfully") },
          });
        }
      } else {
        setShowAlert({
          variant: "danger",
          message: response.message || t("patientUpdateError"),
        });
      }
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;

      setShowAlert({
        variant: "danger",
        message:
          backendMessage === "emailExists"
            ? t("Emailexist")
            : t("patientUpdateError"),
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

  useEffect(() => {
    const fetchCountries = async () => {
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
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="name" className="font-bold">
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
                  <FormLabel htmlFor="email" className="font-bold">
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
                  <FormLabel htmlFor="phone" className="font-bold">
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
                  className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
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
                  <FormLabel htmlFor="date-of-birth" className="font-bold">
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
                <p className="text-red-500 text-sm">{formErrors.dateOfBirth}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2 grid grid-cols-2 gap-6">
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
                  }}
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

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="address" className="font-bold">
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
                  <FormLabel htmlFor="category" className="font-bold">
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
                  <FormLabel htmlFor="ethnicity" className="font-bold">
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
                  <FormLabel htmlFor="height" className="font-bold">
                    {t("height")} (cm)
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
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="weight" className="font-bold">
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
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="scenarioLocation" className="font-bold">
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
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="roomType" className="font-bold">
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
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-5">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="socialEconomicHistory"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.socialEconomicHistory && (
                <p className="text-red-500 text-sm">
                  {formErrors.socialEconomicHistory}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="familyMedicalHistory"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.familyMedicalHistory && (
                <p className="text-red-500 text-sm">
                  {formErrors.familyMedicalHistory}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="lifestyleAndHomeSituation"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.lifestyleAndHomeSituation && (
                <p className="text-red-500 text-sm">
                  {formErrors.lifestyleAndHomeSituation}
                </p>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="medicalEquipment" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.medicalEquipment && (
                <p className="text-red-500 text-sm">
                  {formErrors.medicalEquipment}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="pharmaceuticals" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.pharmaceuticals && (
                <p className="text-red-500 text-sm">
                  {formErrors.pharmaceuticals}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="diagnosticEquipment"
                    className="font-bold"
                  >
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.diagnosticEquipment && (
                <p className="text-red-500 text-sm">
                  {formErrors.diagnosticEquipment}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="bloodTests" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.bloodTests && (
                <p className="text-red-500 text-sm">{formErrors.bloodTests}</p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="initialAdmissionObservations"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.initialAdmissionObservations && (
                <p className="text-red-500 text-sm">
                  {formErrors.initialAdmissionObservations}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="expectedObservationsForAcuteCondition"
                    className="font-bold"
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
                placeholder={t(
                  "enter_expected_observations_for_acute_condition"
                )}
                value={formData.expectedObservationsForAcuteCondition}
                onChange={handleInputChange}
                rows={3}
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.expectedObservationsForAcuteCondition && (
                <p className="text-red-500 text-sm">
                  {formErrors.expectedObservationsForAcuteCondition}
                </p>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="patientAssessment" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.patientAssessment && (
                <p className="text-red-500 text-sm">
                  {formErrors.patientAssessment}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="recommendedObservationsDuringEvent"
                    className="font-bold"
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
                  "border-danger":
                    formErrors.recommendedObservationsDuringEvent,
                })}`}
                name="recommendedObservationsDuringEvent"
                placeholder={t("enter_recommended_observations_during_event")}
                value={formData.recommendedObservationsDuringEvent}
                onChange={handleInputChange}
                rows={3}
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.recommendedObservationsDuringEvent && (
                <p className="text-red-500 text-sm">
                  {formErrors.recommendedObservationsDuringEvent}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="observationResultsRecovery"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.observationResultsRecovery && (
                <p className="text-red-500 text-sm">
                  {formErrors.observationResultsRecovery}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="observationResultsDeterioration"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.observationResultsDeterioration && (
                <p className="text-red-500 text-sm">
                  {formErrors.observationResultsDeterioration}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="recommendedDiagnosticTests"
                    className="font-bold"
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.recommendedDiagnosticTests && (
                <p className="text-red-500 text-sm">
                  {formErrors.recommendedDiagnosticTests}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="treatmentAlgorithm" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.treatmentAlgorithm && (
                <p className="text-red-500 text-sm">
                  {formErrors.treatmentAlgorithm}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="correctTreatment" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.correctTreatment && (
                <p className="text-red-500 text-sm">
                  {formErrors.correctTreatment}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="expectedOutcome" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.expectedOutcome && (
                <p className="text-red-500 text-sm">
                  {formErrors.expectedOutcome}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel
                    htmlFor="healthcareTeamRoles"
                    className="font-bold"
                  >
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.healthcareTeamRoles && (
                <p className="text-red-500 text-sm">
                  {formErrors.healthcareTeamRoles}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <FormLabel htmlFor="teamTraits" className="font-bold">
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
                onKeyDown={preventLeadingSpace}
              />
              {formErrors.teamTraits && (
                <p className="text-red-500 text-sm">{formErrors.teamTraits}</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("editPatient")}</h2>
      </div>

      <div className="grid grid-cols-12 gap-3 mb-0">
        <div className="col-span-12 intro-y lg:col-span-12">
          <div className="py-10 mt-5 intro-y box sm:py-20">
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
            <div className="px-5 pt-10 mt-10 border-t sm:px-20 border-slate-200/60 dark:border-darkmode-400">
              <div className="text-base font-medium">
                {currentStep === 1}
                {currentStep === 2}
                {currentStep === 3}
                {currentStep === 4}
                {currentStep === 5}
              </div>
              <div className="grid gap-4 mt-5 gap-y-5">
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

            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                className="w-24"
                onClick={nextStep}
              >
                {t("next")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                className="w-24"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  t("update")
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EditPatient;
