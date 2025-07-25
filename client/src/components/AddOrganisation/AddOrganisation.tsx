import React from "react";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import { t } from "i18next";
import { Dialog, Menu } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { isValidInput } from "@/helpers/validation";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "@/components/UploadContext";
import {
  getAllOrgAction,
  createOrgAction,
  deleteOrgAction,
} from "@/actions/organisationAction";
interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}
const Main: React.FC<Component> = ({ onShowAlert }) => {
  const { addTask, updateTask } = useUploads();

  const [formData, setFormData] = useState<{
    orgName: string;
    email: string;
    icon: File | null;
  }>({
    orgName: "",
    email: "",
    icon: null,
  });

  interface FormErrors {
    orgName: string;
    email: string;
    icon: string;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({
    orgName: "",
    email: "",
    icon: "",
  });
  type Org = {
    id: number;
    name: string;
    organisation_id: string;
    org_email: string;
    user_count: string;
    organisation_icon: "";
    updated_at: string;
  };
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loading1, setLoading1] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const validateOrgName = (orgName: string) => {
    if (!orgName) return t("OrgNameValidation1");
    if (orgName.length < 4) return t("OrgNameValidation2");
    if (!isValidInput(orgName)) return t("invalidInput");
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return t("emailValidation1");
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
      return t("emailValidation3");
    return "";
  };

  const validateIcon = (icon: any) => {
    return icon ? "" : t("OrgIconValidation");
  };
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "orgName") {
        newErrors.orgName = validateOrgName(value);
      }
      if (name === "email") {
        newErrors.email = validateEmail(value);
      }
      if (name === "icon") {
        newErrors.icon = validateIcon(files?.[0] ?? "");
      }

      return newErrors;
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFileUrl(URL.createObjectURL(file));
      setFileName(file.name);

      setFormData((prevData) => ({
        ...prevData,
        icon: file,
      }));

      setFormErrors((prevErrors) => ({
        ...prevErrors,
        icon: validateIcon(file),
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];

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
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          icon: "Only PNG, JPG, JPEG, GIF, WEBP, BMP, SVG, TIFF, ICO, and HEIC images are allowed.",
        }));
        e.target.value = "";
        return;
      }

      setFileUrl(URL.createObjectURL(file));
      setFileName(file.name);

      setFormData((prevData) => ({
        ...prevData,
        icon: file,
      }));

      setFormErrors((prevErrors) => ({
        ...prevErrors,
        icon: "",
      }));
    }
  };
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {
      orgName: validateOrgName(formData.orgName.trim()),
      email: validateEmail(formData.email.trim()),
      icon: validateIcon(formData.icon),
    };

    return errors;
  };
  const handleSubmit = async () => {
    // setLoading(false);
    setShowAlert(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;

    try {
      // setLoading(true);
      const formDataObj = new FormData();
      formDataObj.append("orgName", formData.orgName);
      formDataObj.append("email", formData.email);
      let upload;
      if (formData.icon) {
        let data = await getPresignedApkUrlAction(
          formData.icon.name,
          formData.icon.type,
          formData.icon.size
        );
        formDataObj.append("icon", data.url);
        const taskId = addTask(formData.icon, formData.orgName);
        upload = await uploadFileAction(
          data.presignedUrl,
          formData.icon,
          taskId,
          updateTask
        );
      }

      if (upload) {
        const createOrg = await createOrgAction(formDataObj);

        setFormData({ orgName: "", email: "", icon: null });
        setFileUrl(null);
        setFileName("");
        onShowAlert({
          variant: "success",
          message: t("AddOrgSuccess"),
        });
      }
    } catch (error: any) {
      onShowAlert({
        variant: "danger",
        message: t("AddOrgfailed"),
      });

      console.error("Error creating organisation:", error);
      setShowAlert({
        variant: "danger",
        message: error.response.data.message,
      });
      setFormData({ orgName: "", email: "", icon: null });
      setFileUrl(null);
      setFileName("");

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  };

  return (
    <>
      <div className="intro-y box ">
        <div className="flex flex-col items-center border-b border-slate-200/60 p-2 dark:border-darkmode-400 sm:flex-row p-5">
          <h2 className="mr-2 text-base font-medium">
            {t("add_new_organisation")}
          </h2>
        </div>
        <div className="p-5 text-left">
          <div className="flex items-center justify-between ">
            <FormLabel htmlFor="org-form-1" className="font-bold">
              {t("organisation_name")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>

          <FormInput
            id="org-form-1"
            type="text"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.orgName,
            })}`}
            name="orgName"
            placeholder={t("OrgNameValidation")}
            value={formData.orgName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          {formErrors.orgName && (
            <p className="text-red-500 text-left text-sm">
              {formErrors.orgName}
            </p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="org-form-2" className="font-bold">
              {t("organisation_email")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>
          <FormInput
            id="org-form-2"
            type="email"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.email,
            })}`}
            name="email"
            placeholder={t("emailValidation2")}
            value={formData.email}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          {formErrors.email && (
            <p className="text-red-500 text-left text-sm">{formErrors.email}</p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="org-form-3" className="font-bold OrgIconLabel">
              {t("organisation_icon")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              ({t("required")}, jpg, png, etc.)
            </span>
          </div>
          <div
            className={`relative w-full mb-2 p-4 border-2 ${
              formErrors.icon
                ? "border-dotted border-danger"
                : "border-dotted border-gray-300"
            } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              id="org-form-3"
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full mb-2 h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <label
              htmlFor="org-form-3"
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
          {formErrors.icon && (
            <p className="text-red-500 text-sm">{formErrors.icon}</p>
          )}

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
    </>
  );
};

export default Main;
