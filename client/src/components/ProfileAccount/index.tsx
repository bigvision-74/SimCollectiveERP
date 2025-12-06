import React, { useEffect } from "react";
import _ from "lodash";
import { useState } from "react";
import fakerData from "@/utils/faker";
import Button from "@/components/Base/Button";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/Base/Form";
import {
  getUserAction,
  updateUserAction,
  getUserOrgIdAction,
} from "@/actions/userActions";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import { useUploads } from "@/components/UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

interface ComponentProps {
  onAction: (message: string, variant: "success" | "danger") => void;
}

interface User {
  id: string;
  fname: string;
  lname: string;
  username: string;
  uemail: string;
  user_thumbnail: string;
  role: string;
  error: unknown;
}

interface FormData {
  id: string;
  fname: string;
  lname: string;
  username: string;
  uemail: string;
  role: string;
}
const main: React.FC<ComponentProps> = ({ onAction }) => {
  const { addTask, updateTask } = useUploads();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: "",
    fname: "",
    lname: "",
    username: "",
    uemail: "",
    role: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const username = localStorage.getItem("username");

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  useEffect(() => {
    const username = localStorage.getItem("user");
    const fetchUser = async () => {
      if (username) {
        try {
          const data = await getUserAction(username);
          setFormData({
            id: data.id,
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            uemail: data.isTempMail == "1" ? "" : data.uemail,
            role: data.role ? data.role : "Unknown Role",
          });
          if (data && data.user_thumbnail) {
            const parts = data.user_thumbnail.split("-");
            const lastPart = parts.pop() || "";
            const fileName = lastPart.replace(/^\d+-/, "");
            setFileName(fileName || "");
          }
          setFileUrl(data.user_thumbnail);
          setFile(data.user_thumbnail);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (file) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          file: t("invalidfileformat"),
        }));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          file: `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        }));
        event.target.value = "";
        return;
      }

      setErrors((prevErrors) => ({ ...prevErrors, file: "" }));

      setFileName(file.name);
      setFile(file);

      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          file: t("invalidfileformat"),
        }));
        return;
      }

      setErrors((prevErrors) => ({ ...prevErrors, file: "" }));

      setFileName(file.name);
      setFile(file);

      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handleSubmit = async () => {
    setLoading(false);
    setLoading(true);
    const newErrors: { [key: string]: string } = {};

    if (!formData.fname || formData.fname.length < 2) {
      newErrors.fname = t("firstNameValidation");
    } else if (!isValidInput(formData.fname)) {
      newErrors.fname = t("invalidInput");
    }

    if (!formData.lname || formData.lname.length < 2) {
      newErrors.lname = t("lastNameValidation");
    } else if (!isValidInput(formData.lname)) {
      newErrors.lname = t("invalidInput");
    }

    // if (!file) {
    //   newErrors.file = t("thumbnailValidation");
    // }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id", formData.id);
      formDataToSend.append("firstName", formData.fname);
      formDataToSend.append("lastName", formData.lname);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.uemail);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("addedBy", data1.id);

      let imageUpload;
      if (file && file.name) {
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

      const updateUser = await updateUserAction(formDataToSend);
      if (updateUser) {
        window.scrollTo({ top: 0, behavior: "smooth" });

        onAction(t("profileUpdated"), "success");
        window.scrollTo(0, 0);
        setLoading(false);
      }
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });

      let errorMessage = t("errorUpdateProfile");

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      onAction(t("errorinupdatingprofile"), "danger");
      setLoading(false);
      window.scrollTo(0, 0);
      console.error("Error:", error);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 mt-5 intro-y">
      {" "}
      {/* Changed gap-6 to gap-4 */}
      <div className="col-span-12 box">
        <div className="flex px-4 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
          {" "}
          {/* Reduced padding */}
          <div className="ml-2 mr-auto content-center">
            {" "}
            {/* Reduced margin */}
            <a className="font-medium text-sm sm:text-base">
              {t("user_details")}
            </a>{" "}
            {/* Responsive text */}
          </div>
        </div>
        <div className="p-4">
          {" "}
          {/* Reduced padding */}
          <div className="flex flex-col">
            <div className="mt-4">
              {" "}
              {/* Reduced margin-top */}
              <div className="grid grid-cols-12 gap-y-4 gap-x-4">
                {" "}
                {/* Added gap-y-4 */}
                {/* First Column */}
                <div className="col-span-12 xl:col-span-6">
                  {/* First Name */}
                  <div className="mt-3">
                    {" "}
                    {/* Consistent mt-3 */}
                    <FormLabel htmlFor="update-profile-form-1">
                      <div className="font-medium text-sm sm:text-base mb-1">
                        {" "}
                        {/* Responsive text */}
                        {t("first_name")}
                      </div>
                    </FormLabel>
                    <FormInput
                      id="crud-form-1"
                      type="text"
                      className={`w-full ${clsx({
                        "border-danger": errors.fname,
                      })}`}
                      name="fname"
                      placeholder={t("enter_first_name")}
                      value={formData.fname}
                      onChange={handleInputChange}
                    />
                    {errors.fname && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1">
                        {" "}
                        {/* Responsive text */}
                        {errors.fname}
                      </span>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="mt-3">
                    {" "}
                    {/* Consistent mt-3 */}
                    <FormLabel htmlFor="update-profile-form-4">
                      <div className="font-medium text-sm sm:text-base mb-1">
                        {t("last_name")}
                      </div>
                    </FormLabel>
                    <FormInput
                      id="crud-form-1"
                      type="text"
                      className={`w-full ${clsx({
                        "border-danger": errors.lname,
                      })}`}
                      name="lname"
                      placeholder={t("enter_last_name")}
                      value={formData.lname}
                      onChange={handleInputChange}
                    />
                    {errors.lname && (
                      <span className="text-red-500 text-xs sm:text-sm mt-1">
                        {errors.lname}
                      </span>
                    )}
                  </div>
                </div>
                {/* Second Column */}
                <div className="col-span-12 xl:col-span-6">
                  {/* Username */}
                  <div className="mt-3">
                    {" "}
                    {/* Consistent mt-3 */}
                    <FormLabel htmlFor="update-profile-form-1">
                      <div className="font-medium text-sm sm:text-base mb-1">
                        {t("username")}
                      </div>
                    </FormLabel>
                    <FormInput
                      id="crud-form-1"
                      type="text"
                      className="w-full"
                      name="username"
                      placeholder="Enter user name"
                      value={formData.username}
                      disabled
                    />
                  </div>

                  {/* Email */}
                  <div className="mt-3">
                    {" "}
                    {/* Consistent mt-3 */}
                    <FormLabel htmlFor="update-profile-form-4">
                      <div className="font-medium text-sm sm:text-base mb-1">
                        {t("email")}
                      </div>
                    </FormLabel>
                    <FormInput
                      id="crud-form-1"
                      type="text"
                      className="w-full"
                      name="uemail"
                      placeholder="Enter First Name"
                      value={formData.uemail}
                      disabled
                    />
                  </div>
                </div>
                {/* Thumbnail Upload */}
                <div className="col-span-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3">
                    {" "}
                    {/* Consistent mt-3 */}
                    <FormLabel
                      htmlFor="crud-form-6"
                      className="font-bold text-sm sm:text-base"
                    >
                      {t("thumbnail")}
                    </FormLabel>
                  </div>
                  <div
                    className={`relative w-full mt-1 p-3 border-2 ${
                      errors.file
                        ? "border-dotted border-danger"
                        : "border-dotted border-gray-300"
                    } rounded flex items-center justify-center h-28 sm:h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
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
                      className={`cursor-pointer text-center w-full font-bold text-gray-500 text-xs sm:text-sm absolute z-10 transition-transform duration-300 ${
                        fileUrl ? "top-1" : "top-1/2 transform -translate-y-1/2"
                      }`}
                    >
                      {fileName
                        ? `${t("selected")} ${fileName}`
                        : `${t("drop")}`}
                    </label>
                    {fileUrl && (
                      <img
                        src={fileUrl}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain preview-image"
                      />
                    )}
                  </div>
                  {errors.file && (
                    <span className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.file}
                    </span>
                  )}
                </div>
              </div>
              {/* Save Button */}
              <div className="text-end mt-4">
                {" "}
                {/* Consistent mt-4 */}
                <Button
                  variant="primary"
                  type="button"
                  className="w-full sm:w-20 py-2"
                  onClick={() => {
                    handleSubmit();
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
      </div>
    </div>
  );
};

export default main;
