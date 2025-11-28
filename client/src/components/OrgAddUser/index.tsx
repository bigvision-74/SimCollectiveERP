import _ from "lodash";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/Base/Button";
import "./addUserStyle.css";
import "./addUserStyle.css";
import { useParams } from "react-router-dom";
import { FormInput, FormLabel, FormCheck } from "@/components/Base/Form";
import {
  createUserAction,
  getUsername,
  getEmailAction,
} from "@/actions/userActions";
import debounce from "lodash/debounce";

import { t } from "i18next";
import clsx from "clsx";
import { isValidInput } from "@/helpers/validation";
import { useUploads } from "../UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { getAdminsByIdAction } from "@/actions/adminActions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";

import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

interface ComponentProps {
  onAction: (message: string, variant: "success" | "danger") => void;
}

interface User {
  id: string;
  name: string;
  user_deleted: number;
  org_delete: number;
}

const Main: React.FC<ComponentProps> = ({ onAction }) => {
  const { id } = useParams();
  const { addTask, updateTask } = useUploads();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<File | undefined>(undefined);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [isEmailExists, setIsEmailExists] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdminExists, setIsAdminExists] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  interface FormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    // thumbnail: File | null;
  }

  interface FormErrors {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    thumbnail: string;
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "Admin",
    // thumbnail: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    thumbnail: "",
  });

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

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

    if (!formData.email) {
      errors.email = t("emailValidation1");
    } else {
      const atIndex = formData.email.indexOf("@");

      if (atIndex === -1 || atIndex > 64) {
        errors.email = t("Maximumcharacter64before");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = t("emailValidation");
      } else if (isEmailExists === true) {
        errors.email = t("emailExist");
      }
    }

    // if (!fileName) {
    //   errors.thumbnail = t("thumbnailValidation");
    // }

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
      if (value.trim() === "") {
        setIsUserExists(null);
        debouncedCheckUsername.cancel();
      } else {
        debouncedCheckUsername(value);
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

    // Update validation for each field
    switch (name) {
      case "firstName":
        setFormErrors((prev) => ({
          ...prev,
          firstName:
            !value || value.length < 2
              ? t("firstNameValidation")
              : value.length > 50
              ? t("firstNameMaxLength")
              : !isValidInput(value)
              ? t("invalidInput")
              : "",
        }));
        break;

      case "lastName":
        setFormErrors((prev) => ({
          ...prev,
          lastName:
            !value || value.length < 2
              ? t("lastNameValidation")
              : value.length > 50
              ? t("lastNameMaxLength")
              : !isValidInput(value)
              ? t("invalidInput")
              : "",
        }));
        break;

      case "username":
        setFormErrors((prev) => ({
          ...prev,
          username:
            !value || value.length < 2
              ? t("userNameValidation")
              : value.length > 30
              ? t("userNameMaxLength")
              : !isValidInput(value)
              ? t("invalidInput")
              : "",
        }));
        break;

      case "email":
        const atIndex = value.indexOf("@");
        setFormErrors((prev) => ({
          ...prev,
          email: !value
            ? t("emailValidation1")
            : atIndex > 64
            ? t("Maximumcharacter64before")
            : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? t("emailValidation")
            : "",
        }));
        break;
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

  const debouncedCheckEmail = useCallback(
    debounce((value: string) => {
      if (value.trim() !== "") {
        checkEmailExists(value);
      }
    }, 1000),
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (file) {
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml",
        "image/tiff",
        "image/x-icon",
        "image/heic",
      ];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          thumbnail: "Only PNG, JPG, JPEG, GIF, and WEBP images are allowed.",
        }));
        event.target.value = "";
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
      setUploadStatus(t("uploadedImg"));
      setThumbnail(file);
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

      return () => URL.revokeObjectURL(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus(t("uploadedImg"));
      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setThumbnail(file);
      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));
      return () => URL.revokeObjectURL(url);
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

  // get admin by org id use for role hide and show
  const checkAdminExists = async (orgId: string) => {
    try {
      const admins = await getAdminsByIdAction(Number(orgId));
      setIsAdminExists(admins && admins.length > 0);
    } catch (err) {
      console.error("Error checking admin:", err);
      setIsAdminExists(false);
    }
  };

  useEffect(() => {
    if (id) {
      checkAdminExists(id);
    }
  }, [id]);

  // ✅ Auto-adjust role when Admin is hidden/shown
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: isAdminExists ? "Faculty" : "Admin",
    }));
  }, [isAdminExists]);

  // check auth user role
  useEffect(() => {
    const role = localStorage.getItem("role");
    setCurrentUserRole(role || "");
  }, []);

  const debouncedCheckUsername = useCallback(
    debounce((value: string) => {
      if (value.trim() !== "") {
        checkUsernameExists(value);
      }
    }, 1000),
    []
  );

  const handleSubmit = async () => {
    setLoading(false);
    if (validateForm()) {
      setLoading(true);

      try {
        const formDataToSend = new FormData();

        formDataToSend.append("firstName", formData.firstName);
        formDataToSend.append("lastName", formData.lastName);
        formDataToSend.append("username", formData.username);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("role", formData.role);
        formDataToSend.append("addedBy", String(user?.id));
        if (id) {
          formDataToSend.append("organisationId", id);
        }

        let upload;
        if (thumbnail) {
          let data = await getPresignedApkUrlAction(
            thumbnail.name,
            thumbnail.type,
            thumbnail.size
          );
          formDataToSend.append("thumbnail", data.url);
          const taskId = addTask(thumbnail, formData.username);
          upload = await uploadFileAction(
            data.presignedUrl,
            thumbnail,
            taskId,
            updateTask
          );
        }

        const createUser = await createUserAction(formDataToSend);

        if (createUser) {
          onAction(t("Useraddedsuccessfully"), "success");

          if (id) {
            await checkAdminExists(id);
          }

          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            role: isAdminExists ? "User" : "Admin",
          });

          setFileName("");
          setFileUrl("");
          setThumbnail(undefined);
          setUploadStatus("");
          setIsUserExists(null);

          if (id) {
            checkAdminExists(id);
          }

        }

      } catch (error: any) {
        onAction(
          error.response.data.message === "Username Exists"
            ? t("usernameExist")
            : error.response.data.message === "Email Exists"
            ? t("Emailexist")
            : t("UserAddedError"),
          "danger"
        );

        console.error("Error:", error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (error.code === "auth/email-already-in-use") {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            email: t("Emailalreadyuse"),
          }));
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <div className="mt-5 overflow-auto lg:overflow-visible">
        <div className="col-span-12 intro-y lg:col-span-8">
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="crud-form-1" className="font-bold">
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
            <FormLabel htmlFor="crud-form-2" className="font-bold">
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
            <FormLabel htmlFor="crud-form-3" className="font-bold">
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
            onKeyDown={(e) => {
              handleKeyDown(e);
              if (e.key === " ") {
                e.preventDefault();
              }
            }}
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
            // <p className="text-green-500 text-sm">{t("available")}</p>
            <p className="text-green-500 text-sm"></p>
          )}
          {isUserExists === null && <p></p>}

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
            type="text"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.email,
            })}`}
            name="email"
            placeholder={t("enter_email")}
            required
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
          {formErrors.email && (
            <p className="text-red-500 text-sm">{formErrors.email}</p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="crud-form-6" className="font-bold">
              {t("thumbnail")}
            </FormLabel>
            {/* <span className="text-xs text-gray-500 font-bold ml-2">
              {t("thumbnail_validation")}
            </span> */}
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
              onKeyDown={(e) => handleKeyDown(e)}
            />
            <label
              htmlFor="crud-form-6"
              className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
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
              {/* {currentUserRole === "Superadmin" || "Administrator" && !isAdminExists && ( */}
              {(currentUserRole === "Superadmin" ||
                currentUserRole === "Administrator") &&
                !isAdminExists && (
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
                )}

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
              disabled={
                loading || isEmailExists === true || isUserExists === true
              }
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
    </>
  );
};
export default Main;
