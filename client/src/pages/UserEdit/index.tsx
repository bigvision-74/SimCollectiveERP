import React, { useState, useEffect, useCallback } from "react";
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
import debounce from "lodash/debounce";
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

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };
  const toggleconfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  const [orgId, setOrgId] = useState();

  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [thumbnailToUpload, setThumbnailToUpload] = useState<File | undefined>(
    undefined
  );
  const [uploadStatus, setUploadStatus] = useState("");
  const [user, setUser] = useState<User | null>(null);
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

  const fetchOrganisationId = async () => {
    const userRole = localStorage.getItem("role");
    if (id) {
      try {
        const userData = await getUserAction(id);
        if (userData) {
          const orgData = await getUserOrgIdAction(userData.username);
          setOrgId(orgData?.organisation_id || "");

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
          setUser(data);
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

  // useEffect(() => {
  //   if (user) {
  //     setFormData({
  //       uid: user.token,
  //       id: user.id,
  //       firstName: user.fname,
  //       lastName: user.lname,
  //       username: user.username,
  //       email: user.uemail,
  //       organisationSelect: user.organisation_id,
  //       role:
  //         user.role === "admin"
  //           ? "Organization_Owner"
  //           : user.role === "manager"
  //           ? "Instructor"
  //           : user.role === "worker"
  //           ? "User"
  //           : "Unknown Role",
  //     });
  //     setFileUrl(user.user_thumbnail);
  //     if (user && user.user_thumbnail) {
  //       const parts = user.user_thumbnail.split("-");
  //       const lastPart = parts.pop() || "";
  //       const fileName = lastPart.replace(/^\d+-/, "");
  //       setFileName(fileName || "");
  //     }
  //   }
  // }, [user]);

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
      errors.username = " ";
    }

    setFormErrors(errors as FormErrors);
    console.log(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox" || type === "radio") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked ? value : "",
      }));
    } else {
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
          if (user && value != user.username) {
            const isUsernameValid = value.length >= 2 && isValidInput(value);
            setFormErrors((prev) => ({
              ...prev,
              username: isUsernameValid
                ? ""
                : value.length >= 2
                ? t("invalidInput")
                : t("userNameValidation"),
            }));

            if (isUsernameValid) {
              debouncedCheckUsername(value);
            } else {
              setIsUserExists(null);
              debouncedCheckUsername.cancel();
            }
          }
          break;

        case "email":
          setFormErrors((prev) => ({
            ...prev,
            email: isValidInput(value) ? "" : t("invalidInput"),
          }));
          break;

        case "organisationSelect":
          setFormErrors((prev) => ({
            ...prev,
            organisationSelect: value ? "" : t("organisationValidation"),
          }));
          break;
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedImageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      // 'image/gif',
      // 'image/webp',
      // 'image/bmp',
      // 'image/svg+xml',
      // 'image/tiff',
      // 'image/x-icon',
      // 'image/heic',
    ];

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
        // formDataToSend.append("uid", formData.uid);

        const userRole = localStorage.getItem("role");
        const superadminIds = superadmins.map((admin) => admin.id);

        if (!userRole) {
          throw new Error("Role not found in localStorage.");
        }

        const data = await getUserOrgIdAction(userRole);

        if (userRole === "Superadmin" && formData.organisationSelect) {
          formDataToSend.append("organisationId", formData.organisationSelect);
        }

        formDataToSend.append("uid", data.id);
        formDataToSend.append("superadminIds", JSON.stringify(superadminIds));

        let upload;
        if (thumbnailToUpload && thumbnailToUpload.name) {
          let data = await getPresignedApkUrlAction(
            thumbnailToUpload.name,
            thumbnailToUpload.type,
            thumbnailToUpload.size
          );
          formDataToSend.append("thumbnail", data.url);
          const taskId = addTask(thumbnailToUpload, formData.username);
          upload = await uploadFileAction(
            data.presignedUrl,
            thumbnailToUpload,
            taskId,
            updateTask
          );
        } else {
          formDataToSend.append("thumbnail", fileUrl || "");
        }

        const updateUser = await updateUserAction(formDataToSend);
        if (userRole === "Superadmin")
          navigate("/users", {
            state: { alertMessage: t("userUpdateSuccess") },
          });
        else {
          navigate("/users", {
            state: { alertMessage: t("userUpdateSuccess") },
          });
        }
        setThumbnailToUpload(undefined);
        setUploadStatus(t("uploadSuccess"));
      } catch (error: any) {
        window.scrollTo({ top: 0, behavior: "smooth" });

        setShowAlert({
          variant: "danger",
          message:
            error.response.data.message === "Username Exists"
              ? t("usernameExist")
              : error.response.data.message === "Email Exists"
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
      } else {
        setIsUserExists(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setIsUserExists(null);
    }
  };

  const debouncedCheckUsername = useCallback(
    debounce((value: string) => {
      if (value.trim() !== "") {
        checkUsernameExists(value);
      }
    }, 1000),
    []
  );

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (newPassword && value === newPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "",
      }));
    }
  };
  const checkPasswordStrength = (password: string): void => {
    const hasCapital = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    setPasswordStrength({
      hasCapital,
      hasSpecial,
      hasMinLength,
    });

    setNewPassword(password);

    if (password && hasCapital && hasSpecial && hasMinLength) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: "",
      }));
    }

    if (confirmPassword && password === confirmPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "",
      }));
    }
  };
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateForm1 = (): Partial<PasswordErrors> => {
    const errors: PasswordErrors = {
      new: "",
      confirm: "",
    };

    const hasCapital = /[A-Z]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    if (!newPassword) {
      errors.new = t("newPassword");
    } else if (!hasCapital || !hasSpecial || !hasMinLength) {
      let errorMsg = t("passwordContain");
      if (!hasMinLength) errorMsg += t("eightChar");
      if (!hasCapital) errorMsg += (!hasMinLength ? ", " : "") + t("oneCap");
      if (!hasSpecial)
        errorMsg +=
          (!hasMinLength || !hasCapital ? ", " : "") + t("oneSpecial");
      errors.new = errorMsg;
    }

    if (!confirmPassword) {
      errors.confirm = t("confirmPass");
    } else if (!isValidInput(confirmPassword)) {
      errors.confirm = t("confirmPassInalid");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirm = t("Passwordsdonotmatch");
    }

    setPasswordErrors(errors);
    return errors;
  };

  const handleSubmit1 = async () => {
    setShowAlert(null);
    setLoadingpassword(false);

    // const errors = validateForm1();

    // setFormErrors(errors as FormErrors);

    // const hasErrors = Object.values(errors).some(
    //   (error) =>
    //     error !== "" &&
    //     (!Array.isArray(error) || error.some((msg) => msg !== ""))
    // );

    // if (!hasErrors) {
    setLoadingpassword(false);

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setFormErrors((prev) => ({
          ...prev,
          password: t("Passwordsdonotmatch"),
        }));
      }
      try {
        setLoadingpassword(true);

        const formDataToSend = new FormData();

        formDataToSend.append("newPassword", newPassword);

        if (user) {
          formDataToSend.append("username", user.username);
        }

        const newPass = await resetProfilePasswordAction(formDataToSend);
        if (newPass) {
        }
        window.scrollTo({ top: 0, behavior: "smooth" });

        setShowAlert({
          variant: "success",
          message: t("passwordChangedSuccessfully"),
        });
        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
        setLoadingpassword(false);
      } catch (error: any) {
        setLoadingpassword(false);

        window.scrollTo({ top: 0, behavior: "smooth" });

        setShowAlert({
          variant: "danger",
          message: t("passwordChangedFailed"),
        });
        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
        setLoadingpassword(false);

        console.error("Error:", error);
      }
    }
    // }
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
  }, []);

  const handleSave = async () => {
    setLoadingIns(false);
    setShowAlert(null);

    try {
      setLoadingIns(true);

      const permissions = [];
      if (canAdd) permissions.push("add");
      if (canEdit) permissions.push("edit");
      if (canDelete) permissions.push("delete");

      const formDataToSend = new FormData();

      formDataToSend.append("id", formData.id);
      formDataToSend.append("permissions", JSON.stringify(permissions));

      window.scrollTo({ top: 0, behavior: "smooth" });

      setShowAlert({
        variant: "success",
        message: t("PermissionUpdateSuccess"),
      });
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
      setLoadingIns(false);
    } catch (error) {
      setLoadingIns(false);

      window.scrollTo({ top: 0, behavior: "smooth" });

      setShowAlert({
        variant: "danger",
        message: t("PermissionUpdateError"),
      });
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
      console.error("Error updating language status:", error);
    }
  };

  useEffect(() => {
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
          {/* BEGIN: Form Layout */}
          <div className="p-5 intro-y box">
            <div className="flex items-center justify-between">
              <FormLabel htmlFor="crud-form-1" className="font-bold">
                {t("first_name")}
              </FormLabel>
            </div>
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
              onKeyDown={(e) => handleKeyDown(e)}
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-sm">{formErrors.firstName}</p>
            )}

            <div className="flex items-center justify-between mt-5">
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
              onKeyDown={(e) => handleKeyDown(e)}
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-sm">{formErrors.lastName}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <FormLabel htmlFor="crud-form-3" className="font-bold">
                {t("username")}
              </FormLabel>
            </div>
            <FormInput
              id="crud-form-3"
              type="text"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.username,
              })}`}
              name="username"
              placeholder={t("enter_user_name")}
              value={formData.username}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e)}
            />

            {isUserExists && user && (
              <>
                {user.user_deleted == 1 || user.org_delete == 1 ? (
                  <div>
                    <p className="text-red-500 text-sm mt-2">
                      {t("user_exists_but_deleted")}
                    </p>
                    <p className="text-sm">
                      {t("org1")}: {user.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">{t("exists")}</p>
                )}
              </>
            )}
            {isUserExists === false && (
              <p className="text-green-500 text-sm">{t("available")}</p>
            )}
            {isUserExists === null && <p></p>}
            {formErrors.username && (
              <p className="text-red-500 text-sm">{formErrors.username}</p>
            )}

            <div className="flex items-center justify-between mt-5">
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
              onKeyDown={(e) => handleKeyDown(e)}
              disabled
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}

            {localStorage.getItem("role") === "Superadmin" && (
              <div>
                <div className="flex items-center justify-between mt-5">
                  <FormLabel
                    htmlFor="crud-form-2"
                    className="font-bold AddCourseFormlabel"
                  >
                    {t("organisations")}
                  </FormLabel>
                  <span className="text-sm text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>

                <FormSelect
                  name="organisationSelect"
                  value={formData.organisationSelect}
                  onChange={handleInputChange}
                  className={`w-full mb-2 ${clsx({
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
                  <p className="text-red-500 text-sm">
                    {formErrors.organisationSelect}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
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
                <FormCheck className="mr-2">
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
                  <FormCheck.Label htmlFor="admin" className="font-normal">
                    {t("admin")}
                  </FormCheck.Label>
                </FormCheck>

                <FormCheck className="mr-2">
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
                  <FormCheck.Label htmlFor="Faculty" className="font-normal">
                    {t("faculty")}
                  </FormCheck.Label>
                </FormCheck>

                <FormCheck className="mr-2">
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
                  <FormCheck.Label htmlFor="Observer" className="font-normal">
                    {t("Observer")}
                  </FormCheck.Label>
                </FormCheck>

                <FormCheck className="mr-2">
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
                  <FormCheck.Label htmlFor="User" className="font-normal">
                    {t("user")}
                  </FormCheck.Label>
                </FormCheck>
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
                {" "}
                {t("Change_password")}
              </h2>
            </div>
            <div className="p-5">
              <div className="relative mt-4 w-full xl:w-[100%]">
                <FormInput
                  type={passwordVisible ? "text" : "password"}
                  className="block px-4 py-3 pr-10 w-full mb-2"
                  name="password"
                  placeholder={t("New_password")}
                  value={newPassword.trim()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    checkPasswordStrength(e.target.value);
                  }}
                  aria-describedby="password-error"
                  style={{ zIndex: 1 }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  style={{ zIndex: 2 }}
                  onClick={togglePasswordVisibility}
                >
                  <Lucide
                    icon={passwordVisible ? "Eye" : "EyeOff"}
                    className="w-4 h-4 "
                  />
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-red-500 text-sm">{passwordErrors.new}</p>
              )}
              <div className="text-sm mb-3">
                <p className="mb-1">{t("passwordContain")}</p>
                <ul className="pl-4">
                  <li
                    className={
                      passwordStrength.hasMinLength
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span
                      className={
                        passwordStrength.hasMinLength ? "font-bold" : ""
                      }
                    >
                      {passwordStrength.hasMinLength ? "✓" : "•"}{" "}
                      {t("eightChar")}
                    </span>
                  </li>
                  <li
                    className={
                      passwordStrength.hasCapital
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span
                      className={passwordStrength.hasCapital ? "font-bold" : ""}
                    >
                      {passwordStrength.hasCapital ? "✓" : "•"} {t("oneCap")}
                    </span>
                  </li>
                  <li
                    className={
                      passwordStrength.hasSpecial
                        ? "text-green-500"
                        : "text-gray-500"
                    }
                  >
                    <span
                      className={passwordStrength.hasSpecial ? "font-bold" : ""}
                    >
                      {passwordStrength.hasSpecial ? "✓" : "•"}{" "}
                      {t("oneSpecial")}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="relative mt-4 w-full xl:w-[100%]">
                <FormInput
                  type={confirmPasswordVisible ? "text" : "password"}
                  className="block px-4 py-3 pr-10 w-full mb-2"
                  name="confirmPassword"
                  placeholder={t("Confirm_new_password")}
                  value={confirmPassword.trim()}
                  onChange={handleConfirmPasswordChange}
                  aria-describedby="confirm-password-error"
                  style={{ zIndex: 1 }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  style={{ zIndex: 2 }}
                  onClick={toggleconfirmPasswordVisibility}
                >
                  <Lucide
                    icon={confirmPasswordVisible ? "Eye" : "EyeOff"}
                    className="w-4 h-4 "
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
                  disabled={loading}
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

          {formData.role && formData.role === "Instructor" && (
            <div className="intro-y box mt-5">
              <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 className="text-base font-medium">{t("Permissions")}</h2>
              </div>

              <div className="p-5">
                {/* Can Add Permission */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                  <div className="flex-1">
                    <FormLabel
                      htmlFor="crud-form-3"
                      className="font-bold block"
                    >
                      {t("can_add")}
                    </FormLabel>
                    <div className="text-slate-500 text-sm mt-0.5">
                      {t("choose_if_add")}
                    </div>
                  </div>
                  <FormSwitch.Input
                    type="checkbox"
                    checked={canAdd}
                    onChange={() => setCanAdd(!canAdd)}
                    className="sm:self-center"
                  />
                </div>

                {/* Can Edit Permission */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                  <div className="flex-1">
                    <FormLabel
                      htmlFor="crud-form-3"
                      className="font-bold block"
                    >
                      {t("can_edit")}
                    </FormLabel>
                    <div className="text-slate-500 text-sm mt-0.5">
                      {t("choose_if_edit")}
                    </div>
                  </div>
                  <FormSwitch.Input
                    type="checkbox"
                    checked={canEdit}
                    onChange={() => setCanEdit(!canEdit)}
                    className="sm:self-center"
                  />
                </div>

                {/* Can Delete Permission */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                  <div className="flex-1">
                    <FormLabel
                      htmlFor="crud-form-3"
                      className="font-bold block"
                    >
                      {t("can_delete")}
                    </FormLabel>
                    <div className="text-slate-500 text-sm mt-0.5">
                      {t("choose_if_delete")}
                    </div>
                  </div>
                  <FormSwitch.Input
                    type="checkbox"
                    checked={canDelete}
                    onChange={() => setCanDelete(!canDelete)}
                    className="sm:self-center"
                  />
                </div>

                {/* Save Button */}
                <div className="mt-6 text-right">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full sm:w-24"
                    onClick={handleSave}
                  >
                    {loadingIns ? (
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
          )}
        </div>
      </div>
    </>
  );
}

export default Main;
