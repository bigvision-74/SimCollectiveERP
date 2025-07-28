import React, { useState, useCallback, useEffect } from "react";
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
import debounce from "lodash/debounce";
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

interface Organisation {
  id: string;
  name: string;
}

interface User {
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
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [isEmailExists, setIsEmailExists] = useState<boolean | null>(null);
  const [orgId, setOrgId] = useState();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const location = useLocation();

  const alertMessage = location.state?.alertMessage || "";

  // useEffect(() => {
  //   if (alertMessage) {
  //     setShowAlert({
  //       variant: "success",
  //       message: alertMessage,
  //     });

  //     window.history.replaceState(
  //       { ...location.state, alertMessage: null },
  //       document.title
  //     );
  //     setTimeout(() => {
  //       setShowAlert(null);
  //     }, 3000);
  //   }
  // }, [alertMessage]);

  const username = localStorage.getItem("user");

  const fetchOrganisationId = async () => {
    const userRole = localStorage.getItem("role");
    if (username) {
      try {
        const data = await getUserOrgIdAction(username);
        if (data && data.organisation_id) {
          setOrgId(data.organisation_id);
          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            organisationSelect:
              userRole === "Superadmin" ? "" : data.organisation_id,
            email: "",
            role: "Admin",
          });
          console.log("Fetched organisation_id:", data.organisation_id);
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
    email: string;
    organisationSelect: string;
    role: string;
  }

  interface FormErrors {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    organisationSelect: string;
    thumbnail: string;
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    organisationSelect: "",
    email: "",
    role: "Admin",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    firstName: "",
    lastName: "",
    username: "",
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
      case "lastName":
      case "username":
      case "email":
      case "organisationSelect":
        if (!value?.trim()) {
          return t(`${fieldName}Validation`);
        }
        if (!isValidInput(value)) {
          return t("invalidInput");
        }
      //   return "";
      // case "thumbnail":
      //   return file ? "" : t("thumbnailValidation");
      default:
        return "";
    }
  };

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
    if (isEmailExists) {
      errors.email = " ";
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
    if (name === "username") {
      const newValue = value.replace(/\s/g, "");
      setFormData((prev) => ({ ...prev, [name]: newValue }));

      if (newValue.length < 2) {
        setFormErrors((prev) => ({
          ...prev,
          username: t("userNameValidation"),
        }));
        setIsUserExists(null);
      } else {
        setFormErrors((prev) => ({
          ...prev,
          username: "",
        }));

        debouncedCheckUsername(newValue);
      }
    }

    if (name === "email") {
      if (value.trim() === "") {
        setIsEmailExists(null);
        debouncedCheckEmail.cancel();
      } else {
        debouncedCheckEmail(value);
      }
    }

    setFormErrors((prev) => ({
      ...prev,
      [name as keyof FormData]: validateField(name as keyof FormData, value),
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
        console.error("Failed to fetch organizations:", error);
      }
    };

    fetchOrganisations();
  }, []);

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
    setFile(file);

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

    return () => URL.revokeObjectURL(url);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFile(file);

      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

      return () => URL.revokeObjectURL(url);
    } else {
      setFileName("");
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
    }, 10),
    []
  );

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

  const debouncedCheckEmail = useCallback(
    debounce((value: string) => {
      if (value.trim() !== "") {
        checkEmailExists(value);
      }
    }, 10),
    []
  );

  const defaultFormErrors: FormErrors = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    organisationSelect: "",
    thumbnail: "",
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    if (validateForm()) {
      setLoading(true);
      setShowAlert(null);
      fetchOrganisationId();
      setFileName("");
      setFileUrl("");
      setIsEmailExists(null);
      setIsUserExists(null);
      setFormErrors(defaultFormErrors);
      try {
        const formDataToSend = new FormData();
        const superadmins = await getSuperadminsAction();

        formDataToSend.append("firstName", formData.firstName);
        formDataToSend.append("lastName", formData.lastName);
        formDataToSend.append("username", formData.username);
        formDataToSend.append("email", formData.email);

        const userRole = localStorage.getItem("role");
        const superadminIds = superadmins.map((admin) => admin.id);

        if (!userRole) {
          throw new Error("Role not found in localStorage.");
        }

        const data = await getUserOrgIdAction(userRole);

        if (userRole === "Superadmin" && formData.organisationSelect) {
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
        formDataToSend.append("uid", data.id);
        formDataToSend.append("superadminIds", JSON.stringify(superadminIds));

        let imageUpload;
        if (file) {
          let data = await getPresignedApkUrlAction(
            file.name,
            file.type,
            file.size
          );
          formDataToSend.append("thumbnail", data.url);
          const taskId = addTask(file, formData.username);
          imageUpload = await uploadFileAction(
            data.presignedUrl,
            file,
            taskId,
            updateTask
          );
        }

        if (imageUpload) {
          const response = await createUserAction(formDataToSend);

          if (response.success) {
            setFormData({
              firstName: "",
              lastName: "",
              username: "",
              organisationSelect:
                localStorage.getItem("role") === "Superadmin"
                  ? ""
                  : orgId || "",
              email: "",
              role: "Admin",
            });

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
        }
      } catch (error: any) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        onShowAlert({
          variant: "success",
          message:
            error.response.data.message === "Username Exists"
              ? t("usernameExist")
              : error.response.data.message === "Email Exists"
              ? t("Emailexist")
              : t("UserAddedError"),
        });
        // setShowAlert({
        //   variant: "danger",
        //   message:
        //     error.response.data.message === "Username Exists"
        //       ? t("usernameExist")
        //       : error.response.data.message === "Email Exists"
        //       ? t("Emailexist")
        //       : t("UserAddedError"),
        // });
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



  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      {/* <div className="flex col-8 items-center  intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("newUser")}</h2>
      </div> */}

      {userCount !== undefined && userCount >= 10 && userrole === "Admin" && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-300 rounded mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-indigo-900">
                User limit reached
              </h3>
              <p className="text-sm text-indigo-700">
                Upgrade your plan to add more users and access premium features
              </p>
            </div>
            <Button
              onClick={() => setShowUpsellModal(true)}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              View Plans
            </Button>
          </div>
        </div>
      )}
      <div className="grid  gap-6 mb-0">
        <div className=" col-span-12 intro-y lg:col-span-8">
          <div className="intro-y">
            <div className="flex items-center justify-between">
              <FormLabel
                htmlFor="crud-form-1"
                className="font-bold AddUserLabel"
              >
                {t("first_name")}
              </FormLabel>
              <span className="text-xs text-gray-500 font-bold ml-2">
                {t("organisation_details_validations2char")}
              </span>
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
              <FormLabel
                htmlFor="crud-form-2"
                className="font-bold AddUserLabel"
              >
                {t("last_name")}
              </FormLabel>
              <span className="text-xs text-gray-500 font-bold ml-2">
                {t("organisation_details_validations2char")}
              </span>
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
              <FormLabel
                htmlFor="crud-form-3"
                className="font-bold AddUserLabel"
              >
                {t("username")}
              </FormLabel>
              <span className="text-xs text-gray-500 font-bold ml-2">
                {t("organisation_details_validations2char")}
              </span>
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
            {(isUserExists == null || formData.username == "") && <p></p>}

            {formErrors.username && (
              <p className="text-red-500 text-sm">{formErrors.username}</p>
            )}

            <div className="flex items-center justify-between mt-5">
              <FormLabel htmlFor="crud-form-4" className="font-bold">
                {t("email")}
              </FormLabel>
              <span className="text-xs text-gray-500 font-bold ml-2"></span>
            </div>
            <FormInput
              id="crud-form-4"
              type="email"
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.email,
              })}`}
              name="email"
              placeholder={t("enter_email")}
              required
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e)}
            />

            {isEmailExists && user && (
              <>
                {user.user_deleted == 1 || user.org_delete == 1 ? (
                  <div>
                    <p className="text-red-500 text-sm">
                      {t("email_exists_but_deleted")}
                    </p>
                    <p className="text-sm">
                      {t("org1")}: {user.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">{t("emailExist")}</p>
                )}
              </>
            )}
            {isEmailExists === null && <p></p>}
            {/* {isEmailExists === false && (
              <p className='text-green-500 text-sm'>{t('available')}</p>
            )} */}
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
                  <span className="text-xs text-gray-500 font-bold ml-2">
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
              <FormLabel
                htmlFor="crud-form-6"
                className="font-bold AddUserLabelThumbnail"
              >
                {t("thumbnail")}
              </FormLabel>
              <span className="text-xs text-gray-500 font-bold ml-2">
                {t("thumbnail_validation")}
              </span>
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
                className="absolute inset-0 w-full mb-2 h-full opacity-0 cursor-pointer dark:text-white"
                onChange={handleFileChange}
              />
              <label
                htmlFor="crud-form-6"
                className={`cursor-pointer text-center w-full mb-2 font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                  fileUrl ? "top-2 mb-1" : "top-1/2 transform -translate-y-1/2"
                }`}
              >
                {fileName ? `${t("selected")} ${fileName}` : t("drop")}
              </label>
              {fileUrl && (
                <img
                  src={fileUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full mb-2 h-full object-contain preview-image"
                />
              )}
            </div>

            {formErrors.thumbnail && (
              <p className="text-red-500 text-sm">{formErrors.thumbnail}</p>
            )}
            {/* {uploadStatus && (
              <p className='mt-2 text-green-500'>{uploadStatus}</p>
            )} */}
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
                onClick={() => {
                  if (
                    userCount !== undefined &&
                    userCount >= 10 &&
                    userrole === "Admin"
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
          {/* END: Form Layout */}
        </div>
      </div>
    </>
  );
};

export default Adduser;
