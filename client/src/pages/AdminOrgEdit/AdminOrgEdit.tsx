import _ from "lodash";
import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
// import './addUserStyle.css';
import "@/components/OrgEdit/addUserStyle.css";
import { useNavigate, useParams } from "react-router-dom";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { getOrgAction, editOrgAction } from "@/actions/organisationAction";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

const EditOrganisation: React.FC = () => {
  const { id } = useParams<string>();

  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [iconFile, setIconFile] = useState<File | undefined>(undefined);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadStatusapi, setUploadStatusapi] = useState("");
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  interface Data {
    orgData: OrgData;
  }

  interface OrgData {
    name: string;
    id: number;
  }
  interface FormData {
    name: string;
    organisation_id: string;
    org_email: string;
    id: string;
    org_icon: string;
  }

  interface FormErrors {
    name: string;
    organisation_id: string;
    org_email: string;
    id: string;
    thumbnail: string;
  }

  interface Organisation {
    organisation_id: string;
    id: string;
    name: string;
    org_email: string;
    organisation_icon: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    organisation_id: "",
    org_email: "",
    id: "",
    org_icon: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    organisation_id: "",
    org_email: "",
    id: "",
    thumbnail: "",
  });

  const fetchOrgs = async () => {
    try {
      if (!id) {
        console.error("ID is undefined");
        return;
      }
      const numericId = Number(id);
      const data = await getOrgAction(numericId);
      setOrg(data);
      if (data) {
        setFormData({
          name: data.name,
          organisation_id: data.organisation_id,
          org_email: data.org_email,
          id: data.id,
          org_icon: data.organisation_icon,
        });
        setFileUrl(data.organisation_icon);
        setIconFile(data.organisation_icon);
        setOrgName(data.name);

        if (data && data.organisation_icon) {
          const parts = data.organisation_icon.split("-");
          const lastPart = parts.pop() || "";
          const fileName = lastPart.replace(/^\d+-/, "");
          setFileName(fileName || "");
        }
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const validateName = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 3) return t("Name3characters");
    if (!isValidInput(trimmedName)) return t("invalidInput");

    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return t("EmailRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return t("Invalidemailformat");
    return "";
  };

  const validateThumbnail = (fileName: string | null) => {
    if (!fileName) return t("thumbnailValidation");
    return "";
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {
      name: validateName(formData.name),
      org_email: validateEmail(formData.org_email),
      thumbnail: validateThumbnail(fileName),
      organisation_id: "",
      id: "",
    };

    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "name") {
      error = validateName(value);
    } else if (name === "org_email") {
      error = validateEmail(value);
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (file) {
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

      if (file.size > MAX_FILE_SIZE) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          thumbnail: `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        }));
        event.target.value = "";
        return;
      }

      setFileName(file.name);
      setIconFile(file);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

      return () => URL.revokeObjectURL(url);
    } else {
      return;
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus("Image uploaded successfully!");
      setIconFile(file);

      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFormErrors((prev) => ({ ...prev, thumbnail: "" }));

      return () => URL.revokeObjectURL(url);
    } else {
      setFileName("");
      setUploadStatus("");
      setFileUrl("");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("org_email", formData.org_email);

      if (typeof org == "object" && org != null) {
        formDataToSend.append("organisation_id", org.organisation_id);
        formDataToSend.append("id", org.id);
      }

      if (iconFile) {
        formDataToSend.append("organisation_icon", iconFile);
      }

      const createOrg = await editOrgAction(formDataToSend, orgName);

      setShowAlert({
        variant: "success",
        message: t("Organisationupdatedsuccessfully"),
      });
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: t("OrganisationupdatedError"),
      });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("OrganisationEdit")}</h2>
      </div>
      <div className="grid grid-cols-12 gap-6 mt-8">
        <div className="col-span-12 lg:col-span-8 2xl:col-span-9">
          <div className="mt-5 box p-5 overflow-auto lg:overflow-visible">
            <div className="col-span-12 intro-y lg:col-span-8">
              {/* Organisation Name Field */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center">
                  <FormLabel htmlFor="crud-form-1" className="font-bold">
                    {t("organisation_name")}
                  </FormLabel>
                  <span className="md:hidden text-red-500 ml-1">*</span>
                </div>
                <span className="hidden sm:block text-xs text-gray-500 font-bold ml-2">
                  {t("organisation_details_validations3")}
                </span>
              </div>
              <FormInput
                id="crud-form-1"
                type="text"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.name,
                })}`}
                name="name"
                placeholder="Enter Organisation Name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm">{formErrors.name}</p>
              )}

              {/* Organisation Email Field */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-5">
                <FormLabel htmlFor="crud-form-4" className="font-bold">
                  {t("organisation_email")}
                </FormLabel>
                <span className="hidden sm:block text-xs text-gray-500 font-bold ml-2"></span>
              </div>
              <FormInput
                id="crud-form-4"
                type="email"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.org_email,
                })}`}
                name="org_email"
                placeholder="Enter Organisation Email"
                required
                value={formData.org_email}
                onChange={handleInputChange}
              />
              {formErrors.org_email && (
                <p className="text-red-500 text-sm">{formErrors.org_email}</p>
              )}

              {/* Thumbnail Upload Field */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-5">
                <div className="flex items-center">
                  <FormLabel htmlFor="crud-form-6" className="font-bold">
                    {t("thumbnail")}
                  </FormLabel>
                  <span className="md:hidden text-red-500 ml-1">*</span>
                </div>
                <span className="hidden sm:block text-xs text-gray-500 font-bold ml-2">
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="crud-form-6"
                  className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                    fileUrl
                      ? "top-2 mb-1 text-sm sm:text-base"
                      : "top-1/2 transform -translate-y-1/2 text-sm sm:text-base"
                  }`}
                >
                  {fileName ? `${t("selected")} ${fileName}` : t("drop")}
                </label>
                {fileUrl && (
                  <img
                    src={
                      fileUrl?.startsWith("http") || fileUrl?.startsWith("blob")
                        ? fileUrl
                        : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${fileUrl}`
                    }
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain preview-image"
                  />
                )}
              </div>
              {formErrors.thumbnail && (
                <p className="text-red-500 text-sm">{formErrors.thumbnail}</p>
              )}

              {/* Submit Button */}
              <div className="mt-5 text-right">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-24"
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
                {uploadStatusapi && (
                  <p className="text-green-500 mt-3">{uploadStatusapi}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditOrganisation;
