import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import "./addUserStyle.css";
import Lucide from "@/components/Base/Lucide";
import { useNavigate, useParams } from "react-router-dom";
import {
  FormCheck,
  FormInput,
  FormLabel,
  FormSelect,
} from "@/components/Base/Form";
import { getAllOrgAction } from "@/actions/organisationAction";
import {
  getUserAction,
  updateUserAction,
  getUsername,
  getUserOrgIdAction,
  getSuperadminsAction,
} from "@/actions/userActions";
import { t } from "i18next";
import { resetProfilePasswordAction } from "@/actions/adminActions";
import { isValidInput } from "@/helpers/validation";
import { FormSwitch } from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { useUploads } from "@/components/UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { getAdminsByIdAction } from "@/actions/adminActions";

function Main() {
  type User = {
    id: string;
    name: string;
    email: string;
    user_thumbnail: string;
    updated_at: string;
    fname: string;
    lname: string;
    username: string;
    uemail: string;
    organisation_id: string;
    role: string;
    token: string;
    user_deleted: number;
    org_delete: number;
  };

  interface Organisation {
    id: string;
    name: string;
  }

  interface PermissionResponse {
    user_id: string;
    permissions: string[];
  }
  
  const { addTask, updateTask } = useUploads();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const username = localStorage.getItem("user");
  const { id } = useParams<{ id?: string }>();

  // State for admin exists check
  const [isAdminExists, setIsAdminExists] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };
  const toggleconfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  const [orgId, setOrgId] = useState();
  const [activeUsername, setUserName] = useState();

  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [thumbnailToUpload, setThumbnailToUpload] = useState<File | undefined>(
    undefined
  );
  const [uploadStatus, setUploadStatus] = useState("");

  const [initialUserData, setInitialUserData] = useState<User | null>(null);
  const [foundUserForCheck, setFoundUserForCheck] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingPassword, setLoadingpassword] = useState(false);
  const [loadingIns, setLoadingIns] = useState(false);
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  interface PasswordStrength {
    hasCapital: boolean;
    hasSpecial: boolean;
    hasMinLength: boolean;
  }
  
  interface FormData {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    organisationSelect: string;
    role: string;
    uid: string;
  }

  interface FormErrors {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    organisationSelect: string;
    thumbnail: string;
  }

  interface PasswordErrors {
    new: string;
    confirm: string;
  }

  // Define formData state BEFORE any useEffect hooks that reference it
  const [formData, setFormData] = useState<FormData>({
    id: "",
    firstName: "",
    lastName: "",
    username: "",
    organisationSelect: "",
    email: "",
    role: "",
    uid: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    id: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    organisationSelect: "",
    thumbnail: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
    new: "",
    confirm: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasCapital: false,
    hasSpecial: false,
    hasMinLength: false,
  });

  // Check if admin exists for organization
  const checkAdminExists = async (orgId: string) => {
    try {
      const admins = await getAdminsByIdAction(Number(orgId));
      
      // If the current user being edited is an admin, don't hide the admin option
      if (initialUserData && initialUserData.role === "Admin") {
        setIsAdminExists(false);
      } else {
        // Check if there are any admins in this organization
        const hasAdmin = admins && admins.length > 0;
        setIsAdminExists(hasAdmin);
        
        // If admin exists and current role is Admin, change it to Faculty
        if (hasAdmin && formData.role === "Admin") {
          setFormData((prev) => ({ ...prev, role: "Faculty" }));
        }
      }
    } catch (err) {
      console.error("Error checking admin:", err);
      setIsAdminExists(false);
    }
  };

  // Handle organization change
  const handleOrgChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    setSelectedOrg(orgId);
    setFormData((prev) => ({ ...prev, organisationSelect: orgId }));

    if (orgId) {
      await checkAdminExists(orgId);
    }
  };

  // Auto-adjust role when Admin is hidden/shown - FIXED LOGIC
  useEffect(() => {
    // Only auto-change role if:
    // 1. User is not already an admin AND 
    // 2. An admin already exists for this organization OR current user is Admin role
    const shouldHideAdmin = (isAdminExists && (!initialUserData || initialUserData.role !== "Admin")) || 
                           localStorage.getItem("role") === "Admin";
    
    if (shouldHideAdmin && formData.role === "Admin") {
      setFormData((prev) => ({ ...prev, role: "Faculty" }));
    }
  }, [isAdminExists, formData.role]);

  const fetchOrganisationId = async () => {
    if (id) {
      try {
        const userData = await getUserAction(id);
        if (userData) {
          const orgData = await getUserOrgIdAction(userData.username);
          setOrgId(orgData?.organisation_id || "");
          setUserName(orgData?.username);

          setFormData({
            id: userData.id || "",
            uid: userData.token || "",
            firstName: userData.fname || "",
            lastName: userData.lname || "",
            username: userData.username || "",
            organisationSelect: orgData?.organisation_id,
            email: userData.uemail || "",
            role: userData.role ? userData.role : "Unknown Role",
          });
          setFileUrl(userData.user_thumbnail);
          if (userData && userData.user_thumbnail) {
            const parts = userData.user_thumbnail.split("-");
            const lastPart = parts.pop() || "";
            const fileName = lastPart.replace(/^\d+-/, "");
            setFileName(fileName || "");
          }
          
          // Check if admin exists for the user's organization
          if (orgData?.organisation_id) {
            await checkAdminExists(orgData.organisation_id);
          }
        } else {
          console.error("User data not found.");
        }
      } catch (error) {
        console.error("Error fetching user or organisation data:", error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const data = await getUserAction(id);
          setInitialUserData(data);
          setFileUrl(data.user_thumbnail);
          if (data && data.user_thumbnail) {
            const parts = data.user_thumbnail.split("-");
            const lastPart = parts.pop() || "";
            const fileName = lastPart.replace(/^\d+-/, "");
            setFileName(fileName || "");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUser();
    } else {
      console.error("No user ID found in URL");
    }
  }, [id]);

  if (!id) {
    return <div>No user ID found in URL.</div>;
  }

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = t("firstNameValidation");
    } else if (!isValidInput(formData.firstName)) {
      errors.firstName = t("invalidInput");
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = t("lastNameValidation");
    } else if (!isValidInput(formData.lastName)) {
      errors.lastName = t("invalidInput");
    }

    if (!formData.username || formData.username.length < 2) {
      errors.username = t("userNameValidation");
    } else if (!isValidInput(formData.username)) {
      errors.username = t("invalidInput");
    }

    if (!formData.organisationSelect || formData.organisationSelect === "") {
      errors.organisationSelect = t("organisationValidation");
    }

    if (!formData.email) {
      errors.email = t("emailValidation1");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("emailValidation");
    }

    if (!fileName) {
      errors.thumbnail = t("thumbnailValidation");
    }

    if (isUserExists) {
      errors.username = t("exists");
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

    switch (name) {
      case "firstName":
        setFormErrors((prev) => ({
          ...prev,
          firstName:
            value.length >= 2
              ? isValidInput(value)
                ? ""
                : t("invalidInput")
              : t("firstNameValidation"),
        }));
        break;

      case "lastName":
        setFormErrors((prev) => ({
          ...prev,
          lastName:
            value.length >= 2
              ? isValidInput(value)
                ? ""
                : t("invalidInput")
              : t("lastNameValidation"),
        }));
        break;

      case "username":
        if (initialUserData && value !== initialUserData.username) {
          const isUsernameFormatValid =
            value.length >= 2 && isValidInput(value);
          if (!isUsernameFormatValid) {
            setFormErrors((prev) => ({
              ...prev,
              username:
                value.length < 2 ? t("userNameValidation") : t("invalidInput"),
            }));
            setIsUserExists(null);
            setFoundUserForCheck(null);
          } else {
            setFormErrors((prev) => ({ ...prev, username: "" }));
            checkUsernameExists(value);
          }
        } else {
          setIsUserExists(null);
          setFoundUserForCheck(null);
          setFormErrors((prev) => ({ ...prev, username: "" }));
        }
        break;

      case "email":
        setFormErrors((prev) => ({
          ...prev,
          email: isValidInput(value) ? "" : t("invalidInput"),
        }));
        break;

      case "organisationSelect":
        // Use handleOrgChange instead of direct state update
        handleOrgChange(e as React.ChangeEvent<HTMLSelectElement>);
        break;
        
      case "role":
        setFormData((prev) => ({ ...prev, role: value }));
        break;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedImageTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Only PNG, JPG, JPEG images allowed.",
      }));
      return;
    }
    setFileName(file.name);
    setUploadStatus(t("uploadedImg"));
    setThumbnailToUpload(file);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFormErrors((prev) => ({ ...prev, thumbnail: "" }));
    event.target.value = "";
    return () => URL.revokeObjectURL(url);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus(t("uploadedImg"));
      setThumbnailToUpload(file);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));
      return () => URL.revokeObjectURL(url);
    } else {
      setFileName("");
      setUploadStatus("");
      setFileUrl("");
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "This field is required",
      }));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    if (validateForm()) {
      setLoading(true);
      try {
        const formDataToSend = new FormData();
        const superadmins = await getSuperadminsAction();

        formDataToSend.append("id", formData.id);
        formDataToSend.append("firstName", formData.firstName);
        formDataToSend.append("lastName", formData.lastName);
        formDataToSend.append("username", formData.username);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("role", formData.role);

        const userRole = localStorage.getItem("role");
        const superadminIds = superadmins.map((admin) => admin.id);

        if (!userRole) {
          throw new Error("Role not found in localStorage.");
        }

        const data = await getUserOrgIdAction(String(activeUsername));

        if (userRole === "Superadmin" && formData.organisationSelect) {
          formDataToSend.append("organisationId", formData.organisationSelect);
        }

        formDataToSend.append("uid", data.id);
        formDataToSend.append("superadminIds", JSON.stringify(superadminIds));

        if (thumbnailToUpload && thumbnailToUpload.name) {
          let data = await getPresignedApkUrlAction(
            thumbnailToUpload.name,
            thumbnailToUpload.type,
            thumbnailToUpload.size
          );
          formDataToSend.append("thumbnail", data.url);
          const taskId = addTask(thumbnailToUpload, formData.username);
          await uploadFileAction(
            data.presignedUrl,
            thumbnailToUpload,
            taskId,
            updateTask
          );
        } else {
          formDataToSend.append("thumbnail", fileUrl || "");
        }

        await updateUserAction(formDataToSend);
        navigate("/users", { state: { alertMessage: t("userUpdateSuccess") } });
        setThumbnailToUpload(undefined);
        setUploadStatus(t("uploadSuccess"));
      } catch (error: any) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowAlert({
          variant: "danger",
          message:
            error.response?.data?.message === "Username Exists"
              ? t("usernameExist")
              : error.response?.data?.message === "Email Exists"
              ? t("Emailexist")
              : t("userediterror"),
        });
        console.error("Error:", error);
        setUploadStatus(t("failedDataSubmit"));
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

  const checkUsernameExists = async (username: string) => {
    try {
      const data = await getUsername(username);
      if (data) {
        setFoundUserForCheck(data.user);
        setIsUserExists(data.exists);
      } else {
        setFoundUserForCheck(null);
        setIsUserExists(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setFoundUserForCheck(null);
      setIsUserExists(null);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (newPassword && value === newPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
    }
  };

  const checkPasswordStrength = (password: string) => {
    const hasCapital = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;
    setPasswordStrength({ hasCapital, hasSpecial, hasMinLength });
    setNewPassword(password);
    if (password && hasCapital && hasSpecial && hasMinLength) {
      setPasswordErrors((prev) => ({ ...prev, new: "" }));
    }
    if (confirmPassword && password === confirmPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
    }
  };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateForm1 = (): PasswordErrors => {
    const errors: PasswordErrors = { new: "", confirm: "" };
    const hasCapital = /[A-Z]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    if (!newPassword) {
      errors.new = t("newPassword");
    } else if (!hasCapital || !hasSpecial || !hasMinLength) {
      let errorMsg = t("passwordContain");
      if (!hasMinLength) errorMsg += ` ${t("eightChar")}`;
      if (!hasCapital)
        errorMsg +=
          (errorMsg.endsWith(t("passwordContain")) ? " " : ", ") + t("oneCap");
      if (!hasSpecial)
        errorMsg +=
          (errorMsg.endsWith(t("passwordContain")) ? " " : ", ") +
          t("oneSpecial");
      errors.new = errorMsg;
    }
    if (!confirmPassword) {
      errors.confirm = t("confirmPass");
    } else if (
      newPassword &&
      confirmPassword &&
      newPassword !== confirmPassword
    ) {
      errors.confirm = t("Passwordsdonotmatch");
    }
    return errors;
  };

  const handleSubmit1 = async () => {
    setShowAlert(null);
    const errors = validateForm1();
    setPasswordErrors(errors);
    const hasErrors = Object.values(errors).some((error) => error !== "");

    if (!hasErrors) {
      try {
        setLoadingpassword(true);
        const formDataToSend = new FormData();
        formDataToSend.append("newPassword", newPassword);
        if (initialUserData) {
          formDataToSend.append("username", initialUserData.username);
        }
        await resetProfilePasswordAction(formDataToSend);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowAlert({
          variant: "success",
          message: t("passwordChangedSuccessfully"),
        });
        setTimeout(() => setShowAlert(null), 3000);
      } catch (error: any) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowAlert({
          variant: "danger",
          message: t("passwordChangedFailed"),
        });
        setTimeout(() => setShowAlert(null), 3000);
        console.error("Error:", error);
      } finally {
        setLoadingpassword(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      const data = await getAllOrgAction();
      setOrganisations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOrganisationId();
  }, [id]); 

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("edit_user")}</h2>
      </div>
      <div className="grid grid-cols-12 gap-6 mt-5 mb-0">
        <div className="col-span-12 intro-y lg:col-span-8">
          <div className="p-5 intro-y box">
            <FormLabel htmlFor="crud-form-1" className="font-bold">
              {t("first_name")}
            </FormLabel>
            <FormInput
              id="crud-form-1"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.firstName,
              })}`}
              name="firstName"
              placeholder={t("enter_first_name")}
              value={formData.firstName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-sm">{formErrors.firstName}</p>
            )}

            <div className="mt-5">
              <FormLabel htmlFor="crud-form-2" className="font-bold">
                {t("last_name")}
              </FormLabel>
            </div>
            <FormInput
              id="crud-form-2"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.lastName,
              })}`}
              name="lastName"
              placeholder={t("enter_last_name")}
              value={formData.lastName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-sm">{formErrors.lastName}</p>
            )}

            <div className="mt-5">
              <FormLabel htmlFor="crud-form-3" className="font-bold">
                {t("username")}
              </FormLabel>
            </div>
            <FormInput
              id="crud-form-3"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.username || isUserExists,
              })}`}
              name="username"
              placeholder={t("enter_user_name")}
              value={formData.username}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            {formErrors.username && (
              <p className="text-red-500 text-sm">{formErrors.username}</p>
            )}
            {!formErrors.username && isUserExists === false && (
              <p className="text-green-500 text-sm">{t("available")}</p>
            )}
            {!formErrors.username && isUserExists && foundUserForCheck && (
              <>
                {foundUserForCheck.user_deleted == 1 ||
                foundUserForCheck.org_delete == 1 ? (
                  <div>
                    <p className="text-red-500 text-sm mt-2">
                      {t("user_exists_but_deleted")}
                    </p>
                    <p className="text-sm">
                      {t("org1")}: {foundUserForCheck.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">{t("exists")}</p>
                )}
              </>
            )}

            <div className="mt-5">
              <FormLabel htmlFor="crud-form-4" className="font-bold">
                {t("email")}
              </FormLabel>
            </div>
            <FormInput
              id="crud-form-4"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.email,
              })}`}
              name="email"
              placeholder={t("enter_email")}
              required
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}

            {localStorage.getItem("role") === "Superadmin" && (
              <div className="mt-5">
                <FormLabel htmlFor="crud-form-org" className="font-bold">
                  {t("organisations")}
                </FormLabel>
                <FormSelect
                  id="crud-form-org"
                  name="organisationSelect"
                  value={formData.organisationSelect}
                  onChange={handleOrgChange}
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.organisationSelect,
                  })}`}
                >
                  <option value="" disabled>
                    {t("SelectOrganisation")}
                  </option>
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </FormSelect>
                {formErrors.organisationSelect && (
                  <p className="text-red-500 text-sm">
                    {formErrors.organisationSelect}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5">
              <FormLabel htmlFor="crud-form-6" className="font-bold">
                {t("thumbnail")}
              </FormLabel>
            </div>
            <div
              className={`relative w-full mb-2 p-4 border-2 ${
                formErrors.thumbnail
                  ? "border-dotted border-danger"
                  : "border-dotted border-gray-300"
              } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                id="crud-form-6"
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <label
                htmlFor="crud-form-6"
                className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 dark:text-gray-100 ${
                  fileUrl ? "top-2 mb-1" : "top-1/2 transform -translate-y-1/2"
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
              <p className="text-red-500 text-sm">{formErrors.thumbnail}</p>
            )}

            <div className="mt-5">
              <label className="font-bold">{t("role")}</label>
              <div className="flex flex-col space-y-2">
                {/* Show Admin option only if no admin exists for the org OR if user is already an admin */}
                {(localStorage.getItem("role") === "Superadmin" && 
                 (!isAdminExists || (initialUserData && initialUserData.role === "Admin"))) && (
                  <FormCheck className="mr-2" key="Admin">
                    <FormCheck.Input
                      id="Admin"
                      type="radio"
                      name="role"
                      value="Admin"
                      checked={formData.role === "Admin"}
                      onChange={handleInputChange}
                      className="form-radio"
                      onKeyDown={handleKeyDown}
                    />
                    <FormCheck.Label htmlFor="Admin" className="font-normal">
                      {t("admin")}
                    </FormCheck.Label>
                  </FormCheck>
                )}
                
                {["Faculty", "Observer", "User"].map((role) => (
                  <FormCheck className="mr-2" key={role}>
                    <FormCheck.Input
                      id={role}
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleInputChange}
                      className="form-radio"
                      onKeyDown={handleKeyDown}
                    />
                    <FormCheck.Label htmlFor={role} className="font-normal">
                      {t(role.toLowerCase())}
                    </FormCheck.Label>
                  </FormCheck>
                ))}
              </div>
            </div>

            <div className="mt-5 text-right">
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
                  t("save")
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 intro-y lg:col-span-4">
          <div className="intro-y box">
            <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
              <h2 className="mr-auto text-base font-medium">
                {t("Change_password")}
              </h2>
            </div>
            <div className="p-5">
              <div className="relative mt-4 w-full">
                <FormInput
                  type={passwordVisible ? "text" : "password"}
                  className="block px-4 py-3 pr-10 w-full mb-2"
                  placeholder={t("New_password")}
                  value={newPassword}
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  <Lucide
                    icon={passwordVisible ? "Eye" : "EyeOff"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-red-500 text-sm">{passwordErrors.new}</p>
              )}
              <div className="text-sm mb-3">
                <p className="mb-1">{t("passwordContain")}:</p>
                <ul className="list-disc pl-5">
                  <li
                    className={
                      passwordStrength.hasMinLength
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span>{t("eightChar")}</span>
                  </li>
                  <li
                    className={
                      passwordStrength.hasCapital
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span>{t("oneCap")}</span>
                  </li>
                  <li
                    className={
                      passwordStrength.hasSpecial
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span>{t("oneSpecial")}</span>
                  </li>
                </ul>
              </div>
              <div className="relative mt-4 w-full">
                <FormInput
                  type={confirmPasswordVisible ? "text" : "password"}
                  className="block px-4 py-3 pr-10 w-full mb-2"
                  placeholder={t("Confirm_new_password")}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={toggleconfirmPasswordVisibility}
                >
                  <Lucide
                    icon={confirmPasswordVisible ? "Eye" : "EyeOff"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-red-500 text-sm">{passwordErrors.confirm}</p>
              )}
              <div className="mt-5 text-right">
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={handleSubmit1}
                  disabled={loadingPassword}
                >
                  {loadingPassword ? (
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
      </div>
    </>
  );
}

export default Main;