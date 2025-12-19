import React, { useState, useEffect } from "react";
import { ClassicEditor } from "@/components/Base/Ckeditor";
import TomSelect from "@/components/Base/TomSelect";
import Button from "@/components/Base/Button";
import "./addUserStyle.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import { getAllOrgAction } from "@/actions/organisationAction";
import { FormCheck } from "@/components/Base/Form";
import {
  createUserAction,
  getUsername,
  getUserOrgIdAction,
  getEmailAction,
  getSuperadminsAction,
} from "@/actions/userActions";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { useUploads } from "@/components/UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import SubscriptionModal from "@/components/SubscriptionModal.tsx";
import { getAdminsByIdAction } from "@/actions/adminActions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";
import Lucide from "@/components/Base/Lucide";

interface Organisation {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  user_deleted: number;
  org_delete: number;
}
interface Component {
  userCount?: number;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

const Adduser: React.FC<Component> = ({ userCount, onShowAlert }) => {
  const userrole = localStorage.getItem("role");
  const { addTask, updateTask } = useUploads();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [isEmailExists, setIsEmailExists] = useState<boolean | null>(null);
  const [orgId, setOrgId] = useState();
  const [activeUsername, setUserName] = useState();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [isAdminExists, setIsAdminExists] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";
  const username = localStorage.getItem("user");

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);

    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);

    const currentDate = new Date();

    return currentDate > expirationDate;
  }

  const fetchOrganisationId = async () => {
    const userRole = localStorage.getItem("role");
    if (username && userRole === "Admin") {
      try {
        const data = await getUserOrgIdAction(username);
        if (data && data.organisation_id) {
          setPlanDate(data.planDate);
          setSubscriptionPlan(data.planType);
          setOrgId(data.organisation_id);
          setUserName(data.username);
          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            password: "",
            organisationSelect: data.organisation_id,
            email: "",
            role: "Admin",
          });
        } else {
          console.error("No organisation_id found for user");
        }
      } catch (error) {
        console.error("Error fetching organisation_id:", error);
      }
    }
  };

  useEffect(() => {
    fetchOrganisationId();
  }, []);

  interface FormData {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    organisationSelect: string;
    role: string;
  }

  interface FormErrors {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    organisationSelect: string;
    thumbnail: string;
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    organisationSelect: "",
    email: "",
    role: "Admin",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    organisationSelect: "",
    thumbnail: "",
  });

  const validateField = (
    fieldName: keyof FormData | "thumbnail",
    value: string | null
  ): string => {
    switch (fieldName) {
      case "firstName":
        if (!value?.trim()) {
          return t("firstNameValidation");
        }
        if (value.length > 50) {
          return t("firstNameMaxLength");
        }
        if (!isValidInput(value)) {
          return t("invalidInput");
        }
        return "";
      case "lastName":
        if (!value?.trim()) {
          return t("lastNameValidation");
        }
        if (value.length > 50) {
          return t("lastNameMaxLength");
        }
        if (!isValidInput(value)) {
          return t("invalidInput");
        }
        return "";
      case "username":
        if (!value?.trim()) {
          return t("userNameValidation");
        }
        if (value.length > 30) {
          return t("userNameMaxLength");
        }
        if (!isValidInput(value)) {
          return t("invalidInput");
        }
        return "";

      case "password":
        // Only validate password field here if the role is NOT admin
        if (formData.role !== "Admin") {
          if (!value) {
            return t("Passwordrequired") || "Password is required";
          }
          if (value.length < 6) {
            return (
              t("passwordMinLength") || "Password must be at least 6 characters"
            );
          }
        }
        return "";

      case "email":
        // --- UPDATED LOGIC: Required if Admin, Optional otherwise ---
        if (formData.role === "Admin" && !value?.trim()) {
          return t("emailValidation") || "Email is required";
        }

        if (!value?.trim()) {
          return ""; // Valid if empty (for non-Admin roles)
        }
        // If not empty, validate format
        const atIndex = value.indexOf("@");
        if (atIndex === -1 || atIndex > 64) {
          return t("emailValidation");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t("emailValidation");
        }
        return "";

      case "organisationSelect":
        if (!value?.trim()) {
          return t("organisationValidation");
        }
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

    // First Name validation
    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = t("firstNameValidation");
    } else if (formData.firstName.length > 50) {
      errors.firstName = t("firstNameMaxLength");
    } else if (!isValidInput(formData.firstName)) {
      errors.firstName = t("invalidInput");
    }

    // Last Name validation
    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = t("lastNameValidation");
    } else if (formData.lastName.length > 50) {
      errors.lastName = t("lastNameMaxLength");
    } else if (!isValidInput(formData.lastName)) {
      errors.lastName = t("invalidInput");
    }

    // Username validation
    if (!formData.username || formData.username.length < 2) {
      errors.username = t("userNameValidation");
    } else if (formData.username.length > 30) {
      errors.username = t("userNameMaxLength");
    } else if (!isValidInput(formData.username)) {
      errors.username = t("invalidInput");
    }

    // Password validation - SKIP IF ROLE IS ADMIN
    if (formData.role !== "Admin") {
      if (!formData.password) {
        errors.password = t("Passwordrequired") || "Password is required";
      } else if (formData.password.length < 6) {
        errors.password =
          t("passwordMinLength") || "Password must be at least 6 characters";
      }
    }

    // Organisation validation
    if (
      formData.role !== "Administrator" &&
      (!formData.organisationSelect || formData.organisationSelect === "")
    ) {
      errors.organisationSelect = t("organisationValidation");
    }

    // --- UPDATED LOGIC: Email validation ---
    // If role is Admin, email is mandatory.
    if (
      formData.role === "Admin" &&
      (!formData.email || formData.email.trim() === "")
    ) {
      errors.email = t("emailValidation") || "Email is required";
    }
    // If email is present (regardless of role), check format.
    else if (formData.email && formData.email.trim() !== "") {
      const atIndex = formData.email.indexOf("@");
      if (atIndex === -1 || atIndex > 64) {
        errors.email = t("emailValidation");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = t("emailValidation");
      }
    }

    // Existing user/email checks from backend
    if (isUserExists) {
      errors.username = t("usernameExist"); // Ensure message is set
    }
    if (isEmailExists && formData.email) {
      errors.email = t("Emailexist");
    }

    setFormErrors(errors as FormErrors);

    return Object.keys(errors).length === 0;
  };

  const checkUsernameExists = async (username: string) => {
    if (username.trim().length < 2) {
      setIsUserExists(null);
      setFormErrors((prev) => ({
        ...prev,
        username: t("userNameValidation"),
      }));
      return;
    }

    try {
      const data = await getUsername(username);
      if (data) {
        setUser(data.user);
        setIsUserExists(data.exists);
        if (data.exists) {
          setFormErrors((prev) => ({
            ...prev,
            username: t("usernameExist"),
          }));
        }
      } else {
        setIsUserExists(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setIsUserExists(null);
    }
  };

  const checkEmailExists = async (email: string) => {
    if (email.trim() === "") {
      setIsEmailExists(null);
      return;
    }

    try {
      const data = await getEmailAction(email);

      if (data) {
        setUser(data.user);
        setIsEmailExists(data.exists);
      } else {
        setIsEmailExists(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setIsEmailExists(null);
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

    if (name === "username") {
      const newValue = value.replace(/\s/g, "");
      setFormData((prev) => ({ ...prev, [name]: newValue }));

      if (newValue.length < 2) {
        setFormErrors((prev) => ({
          ...prev,
          username: t("userNameValidation"),
        }));
        setIsUserExists(null);
      } else if (newValue.length > 30) {
        setFormErrors((prev) => ({
          ...prev,
          username: t("userNameMaxLength"),
        }));
        setIsUserExists(null);
      } else {
        setFormErrors((prev) => ({
          ...prev,
          username: "",
        }));
        checkUsernameExists(newValue);
      }
    }

    if (name === "email") {
      if (value.trim() === "") {
        setIsEmailExists(null);
        // UPDATED: Check if Admin when clearing email
        if (formData.role === "Admin") {
          setFormErrors((prev) => ({ ...prev, email: t("emailValidation") }));
        } else {
          setFormErrors((prev) => ({ ...prev, email: "" }));
        }
      } else {
        const atIndex = value.indexOf("@");
        if (atIndex > 64) {
          setFormErrors((prev) => ({
            ...prev,
            email: t("emailValidation"),
          }));
        } else {
          // Only check existence if email is typed
          checkEmailExists(value);
        }
      }
    }

    // Validate the field and set errors
    const error = validateField(name as keyof FormData, value);
    setFormErrors((prev) => ({
      ...prev,
      [name as keyof FormData]: error,
    }));

    if (name === "thumbnail") {
      setFileName(value);
    }
  };

  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const data = await getAllOrgAction();
        setOrganisations(data);
      } catch (error) {
        console.error("Failed to fetch organisations:", error);
      }
    };

    fetchOrganisations();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (!file) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "",
      }));
      return;
    }

    const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedImageTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: t("Onlyimagesallowed"),
      }));
      setFileName("");
      setFileUrl("");
      setFile(undefined);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        thumbnail: `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
      }));
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setFile(file);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFormErrors((prev) => ({ ...prev, thumbnail: "" }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];

    if (!file) {
      setFileName("");
      setFileUrl("");
      setFile(undefined);
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: t("thumbnailValidation"),
      }));
      return;
    }

    const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedImageTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Only PNG, JPG, JPEG images allowed.",
      }));
      setFileName("");
      setFileUrl("");
      setFile(undefined);
      return;
    }

    setFileName(file.name);
    setFile(file);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFormErrors((prev) => ({ ...prev, thumbnail: "" }));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const defaultFormErrors: FormErrors = {
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    organisationSelect: "",
    thumbnail: "",
  };

  // check admin exicest by org id
  const checkAdminExists = async (orgId: string) => {
    try {
      const admins = await getAdminsByIdAction(Number(orgId));
      setIsAdminExists(admins && admins.length > 0);
    } catch (err) {
      console.error("Error checking admin:", err);
      setIsAdminExists(false);
    }
  };

  const handleOrgChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    setFormData((prev) => ({ ...prev, organisationSelect: orgId }));

    if (orgId && formErrors.organisationSelect) {
      setFormErrors((prev) => ({
        ...prev,
        organisationSelect: "",
      }));
    }

    if (orgId) {
      await checkAdminExists(orgId);
    }
  };

  useEffect(() => {
    const shouldHideAdmin =
      isAdminExists || localStorage.getItem("role") === "Admin";

    if (shouldHideAdmin && formData.role === "Admin") {
      setFormData((prev) => ({ ...prev, role: "Faculty" }));
    }
  }, [isAdminExists, formData.role]);

  const handleSubmit = async () => {
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");
    setLoading(false);
    setShowAlert(null);
    if (validateForm()) {
      setLoading(true);
      setShowAlert(null);
      fetchOrganisationId();
      setIsEmailExists(null);
      setIsUserExists(null);
      setFormErrors(defaultFormErrors);

      try {
        const formDataToSend = new FormData();
        const superadmins = await getSuperadminsAction();

        formDataToSend.append("firstName", formData.firstName);
        formDataToSend.append("lastName", formData.lastName);
        formDataToSend.append("username", formData.username);
        // Only append password if role is not Admin
        if (formData.role !== "Admin") {
          formDataToSend.append("password", formData.password);
        }
        formDataToSend.append("email", formData.email); // Sends empty string if empty
        formDataToSend.append("addedBy", String(data1?.id));

        const userRole = localStorage.getItem("role");
        const superadminIds = superadmins.map((admin) => admin.id);

        if (!userRole) {
          throw new Error("Role not found in localStorage");
        }

        if (formData.role === "Administrator") {
          formDataToSend.append("organisationId", "");
        } else if (
          userRole === "Superadmin" ||
          (userRole === "Administrator" && formData.organisationSelect)
        ) {
          formDataToSend.append("organisationId", formData.organisationSelect);
        } else if (userRole === "Admin") {
          if (!orgId) {
            setFormErrors((prev) => ({
              ...prev,
              organisationSelect: t("organisationSelectValidation", {
                defaultValue: "Organisation ID is required.",
              }),
            }));
            setLoading(false);
            return;
          }
          formDataToSend.append("organisationId", String(orgId));
        }

        formDataToSend.append("role", formData.role);
        formDataToSend.append("superadminIds", JSON.stringify(superadminIds));

        if (file) {
          let data = await getPresignedApkUrlAction(
            file.name,
            file.type,
            file.size
          );
          formDataToSend.append("thumbnail", data.url);
          const taskId = addTask(file, formData.username);
          await uploadFileAction(data.presignedUrl, file, taskId, updateTask);
        }

        const response = await createUserAction(formDataToSend);

        if (response.success) {
          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            password: "", // Clear password
            organisationSelect:
              localStorage.getItem("role") === "Superadmin" ? "" : orgId || "",
            email: "",
            role: "Admin",
          });

          const fileInput = document.getElementById(
            "crud-form-6"
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = "";
          }

          setFileName("");
          setFileUrl("");
          setFile(undefined);

          onShowAlert({
            variant: "success",
            message: t("UserAddedSuccessfully"),
          });
        } else {
          setFormErrors((prev) => ({
            ...prev,
            general: response.message || t("formSubmissionError"),
          }));
        }
      } catch (error: any) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        onShowAlert({
          variant: "danger",
          message:
            error.response?.data?.message === "Username Exists"
              ? t("usernameExist")
              : error.response?.data?.message === "Email Exists"
              ? t("Emailexist")
              : t("UserAddedError"),
        });
        console.error("Error submitting the form:", error);
        setFormErrors((prev) => ({
          ...prev,
          general: t("formSubmissionError"),
        }));
      } finally {
        setLoading(false);
      }
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

  const isFreePlanLimitReached =
    subscriptionPlan === "free" &&
    userCount != undefined &&
    userCount >= (data?.trialRecords || 10) &&
    (userrole === "Admin" || userrole === "Faculty" || userrole === "User");

  const isPerpetualLicenseExpired =
    subscriptionPlan === "5 Year Licence" &&
    isPlanExpired(planDate) &&
    (userrole === "Admin" ||
      userrole === "Faculty" ||
      userrole === "User" ||
      userrole === "Observer");

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />
      {(isFreePlanLimitReached || isPerpetualLicenseExpired) && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-300 rounded mb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-indigo-900">
                {t("Userreached")}
              </h3>
              <p className="text-sm text-indigo-700">{t("Upgradeyourplan")}</p>
            </div>
            <Button
              onClick={() => setShowUpsellModal(true)}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              {t("ViewPlans")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-0">
        <div className="col-span-12 intro-y">
          <div className="">
            {/* First Name */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <FormLabel htmlFor="crud-form-1" className="font-bold">
                  {t("first_name")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("organisation_details_validations2char")}
                </span>
              </div>
              <FormInput
                id="crud-form-1"
                type="text"
                className={`w-full ${clsx({
                  "border-danger": formErrors.firstName,
                })}`}
                name="firstName"
                placeholder={t("enter_first_name")}
                value={formData.firstName}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e)}
              />
              {formErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <FormLabel htmlFor="crud-form-2" className="font-bold">
                  {t("last_name")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("organisation_details_validations2char")}
                </span>
              </div>
              <FormInput
                id="crud-form-2"
                type="text"
                className={`w-full ${clsx({
                  "border-danger": formErrors.lastName,
                })}`}
                name="lastName"
                placeholder={t("enter_last_name")}
                value={formData.lastName}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e)}
              />
              {formErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.lastName}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <FormLabel htmlFor="crud-form-3" className="font-bold">
                  {t("username")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("organisation_details_validations2char")}
                </span>
              </div>
              <FormInput
                id="crud-form-3"
                type="text"
                className={`w-full ${clsx({
                  "border-danger": formErrors.username || isUserExists,
                })}`}
                name="username"
                placeholder={t("enter_user_name")}
                value={formData.username}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e)}
              />
              {isUserExists && (
                <p className="text-red-500 text-sm mt-1">
                  {t("usernameExist")}
                </p>
              )}
              {formErrors.username && !isUserExists && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Email - UPDATED: Optional unless Admin */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <FormLabel htmlFor="crud-form-4" className="font-bold">
                  {t("email")}
                </FormLabel>
                {/* Dynamically show Required or Optional based on Role */}
                <span className="text-xs text-gray-500 font-bold">
                  {formData.role === "Admin" ? t("required") : t("optional")}
                </span>
              </div>
              <FormInput
                id="crud-form-4"
                type="email"
                className={`w-full ${clsx({
                  "border-danger": formErrors.email || isEmailExists,
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
              {isEmailExists && user && (
                <>
                  {user.user_deleted == 1 || user.org_delete == 1 ? (
                    <div className="mt-1">
                      <p className="text-red-500 text-sm">
                        {t("email_exists_but_deleted")}
                      </p>
                      <p className="text-sm">
                        {t("org1")}: {user.name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-500 text-sm mt-1">
                      {t("emailExist")}
                    </p>
                  )}
                </>
              )}
              {formErrors.email && !isEmailExists && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            {formData.role !== "Admin" && (
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <FormLabel htmlFor="crud-form-password" className="font-bold">
                    {t("password")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold">
                    {t("required")}
                  </span>
                </div>
                <div className="relative w-full">
                  <FormInput
                    id="crud-form-password"
                    type={showPassword ? "text" : "password"}
                    className={`w-full pr-10 ${clsx({
                      "border-danger": formErrors.password,
                    })}`}
                    name="password"
                    placeholder={t("enter_password")}
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Lucide icon="EyeOff" className="w-5 h-5" />
                    ) : (
                      <Lucide icon="Eye" className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Thumbnail Upload */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <FormLabel htmlFor="crud-form-6" className="font-bold">
                  {t("thumbnail")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("optional")}{" "}
                </span>
              </div>
              <div
                className={`relative w-full p-4 border-2 ${
                  formErrors.thumbnail
                    ? "border-dotted border-danger"
                    : "border-dotted border-gray-300"
                } rounded flex items-center justify-center h-32 sm:h-40 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  id="crud-form-6"
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer dark:text-white"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="crud-form-6"
                  className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                    fileUrl ? "top-2" : "top-1/2 transform -translate-y-1/2"
                  }`}
                >
                  {fileName ? `${t("selected")} ${fileName}` : t("drop")}
                </label>
                {fileUrl && (
                  <img
                    src={fileUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain preview-image"
                  />
                )}
              </div>
              {formErrors.thumbnail && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.thumbnail}
                </p>
              )}
            </div>

            <div className="mb-6">
              <FormLabel className="font-bold block mb-3">
                {t("role")}
              </FormLabel>

              <div className="flex flex-col space-y-3">
                {(localStorage.getItem("role") === "Superadmin" ||
                  localStorage.getItem("role") === "Administrator") &&
                  !isAdminExists && (
                    <FormCheck>
                      <FormCheck.Input
                        id="admin"
                        type="radio"
                        name="role"
                        value="Admin"
                        checked={formData.role === "Admin"}
                        onChange={handleInputChange}
                        className="form-radio"
                        onKeyDown={(e) => handleKeyDown(e)}
                      />
                      <FormCheck.Label
                        htmlFor="admin"
                        className="font-normal ml-2"
                      >
                        {t("admin")}
                      </FormCheck.Label>
                    </FormCheck>
                  )}

                <FormCheck>
                  <FormCheck.Input
                    id="Faculty"
                    type="radio"
                    name="role"
                    value="Faculty"
                    checked={formData.role === "Faculty"}
                    onChange={handleInputChange}
                    className="form-radio"
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <FormCheck.Label
                    htmlFor="Faculty"
                    className="font-normal ml-2"
                  >
                    {t("faculty")}
                  </FormCheck.Label>
                </FormCheck>

                <FormCheck>
                  <FormCheck.Input
                    id="Observer"
                    type="radio"
                    name="role"
                    value="Observer"
                    checked={formData.role === "Observer"}
                    onChange={handleInputChange}
                    className="form-radio"
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <FormCheck.Label
                    htmlFor="Observer"
                    className="font-normal ml-2"
                  >
                    {t("Observer")}
                  </FormCheck.Label>
                </FormCheck>

                <FormCheck>
                  <FormCheck.Input
                    id="User"
                    type="radio"
                    name="role"
                    value="User"
                    checked={formData.role === "User"}
                    onChange={handleInputChange}
                    className="form-radio"
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  <FormCheck.Label htmlFor="User" className="font-normal ml-2">
                    {t("Students")}
                  </FormCheck.Label>
                </FormCheck>

                {localStorage.getItem("role") === "Superadmin" && (
                  <FormCheck>
                    <FormCheck.Input
                      id="Administrator"
                      type="radio"
                      name="role"
                      value="Administrator"
                      checked={formData.role === "Administrator"}
                      onChange={handleInputChange}
                      className="form-radio"
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                    <FormCheck.Label
                      htmlFor="Administrator"
                      className="font-normal ml-2"
                    >
                      {t("Administrator")}
                    </FormCheck.Label>
                  </FormCheck>
                )}
              </div>
            </div>

            {(localStorage.getItem("role") === "Superadmin" ||
              localStorage.getItem("role") === "Administrator") &&
              formData.role !== "Administrator" && (
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <FormLabel
                      htmlFor="organisationSelect"
                      className="font-bold"
                    >
                      {t("organisations")}
                    </FormLabel>
                    <span className="text-xs text-gray-500 font-bold">
                      {t("required")}
                    </span>
                  </div>
                  <FormSelect
                    name="organisationSelect"
                    value={formData.organisationSelect}
                    onChange={handleOrgChange}
                    className={`w-full ${clsx({
                      "border-danger": formErrors.organisationSelect,
                    })}`}
                  >
                    <option value="" disabled>
                      {t("SelectOrganisation")}
                    </option>
                    {organisations.map((orgs) => (
                      <option key={orgs.id} value={orgs.id}>
                        {orgs.name}
                      </option>
                    ))}
                  </FormSelect>
                  {formErrors.organisationSelect && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.organisationSelect}
                    </p>
                  )}
                </div>
              )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto sm:px-8"
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
                  <div className="flex items-center justify-center gap-2">
                    <div className="loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
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

export default Adduser;
