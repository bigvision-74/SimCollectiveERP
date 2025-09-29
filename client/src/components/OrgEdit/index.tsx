import _ from "lodash";
import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import "./addUserStyle.css";
import "./addUserStyle.css";
import { useNavigate, useParams } from "react-router-dom";
import { FormInput, FormLabel, FormCheck } from "@/components/Base/Form";
import { getOrgAction, editOrgAction } from "@/actions/organisationAction";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import { useUploads } from "../UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

interface ComponentProps {
  onAction: (message: string, variant: "success" | "danger") => void;
}

const Main: React.FC<ComponentProps> = ({ onAction }) => {
  const { id } = useParams<string>();
  const { addTask, updateTask } = useUploads();
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

  interface FormData {
    name: string;
    organisation_id: string;
    org_email: string;
    id: string;
    amount: string;
    planType: string;
    org_icon: string;
    purchaseOrder: File | null | string; // Can be a File, null, or a URL string
  }

  interface FormErrors {
    name: string;
    organisation_id: string;
    org_email: string;
    id: string;
    thumbnail: string;
    amount: string;
    plantype: string;
    purchaseOrder: string;
  }

  interface Organisation {
    organisation_id: string;
    id: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    organisation_id: "",
    org_email: "",
    id: "",
    amount: "",
    planType: "1 Year Licence",
    org_icon: "",
    purchaseOrder: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    organisation_id: "",
    org_email: "",
    id: "",
    thumbnail: "",
    amount: "",
    plantype: "",
    purchaseOrder: "",
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
          planType: data.planType,
          amount: data.amount,
          purchaseOrder: data.purchaseOrder || null,
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

  const validateName = (orgName: string) => {
    if (!orgName) return t("OrgNameValidation1");
    if (orgName.length < 4) return t("OrgNameValidation2");
    if (orgName.length > 150) return t("OrgNameValidationMaxLength");
    if (!isValidInput(orgName)) return t("invalidInput");
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return t("emailValidation1");
    const atIndex = email.indexOf("@");
    if (atIndex === -1 || atIndex > 64) {
      return t("Maximumcharacter64before");
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
      return t("emailValidation3");
    return "";
  };

  const validatePurchaseOrder = (purchaseOrder: File | null | string) => {
    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;
    if (purchaseOrder && typeof purchaseOrder !== "string" && purchaseOrder.size > MAX_FILE_SIZE) {
      return `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`;
    }
    return "";
  };


  const validateThumbnail = (fileName: string | null) => {
    if (!fileName) return t("emailValidation");
    return "";
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {
      name: validateName(formData.name),
      org_email: validateEmail(formData.org_email),
      thumbnail: fileName ? validateThumbnail(fileName) : "",
      organisation_id: "",
      plantype: "",
      amount: "",
      id: "",
      purchaseOrder: validatePurchaseOrder(formData.purchaseOrder),
    };

    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));


    let error = "";
    if (name === "name") {
      error = validateName(value);
    } else if (name === "org_email") {
      error = validateEmail(value);
    } else if (name === "purchaseOrder") {
      error = validatePurchaseOrder(files ? files[0] : null);
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
      setFileName("");
      setUploadStatus("");
      setFileUrl("");
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus(t("Imageuploadedsuccessfully"));
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
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("org_email", formData.org_email);
      formDataToSend.append("planType", formData.planType);
      formDataToSend.append("amount", formData.amount);

      if (typeof org == "object" && org != null) {
        formDataToSend.append("organisation_id", org.organisation_id);
        formDataToSend.append("id", org.id);
      }

      // Handle organisation icon
      if (iconFile && iconFile instanceof File) {
        let data = await getPresignedApkUrlAction(
          iconFile.name,
          iconFile.type,
          iconFile.size
        );
        formDataToSend.append("organisation_icon", data.url);
        const taskId = addTask(iconFile, formData.name);
        await uploadFileAction(
          data.presignedUrl,
          iconFile,
          taskId,
          updateTask
        );
      } else {
        formDataToSend.append("organisation_icon", iconFile || "");
      }

      // Handle purchase order file
      if (formData.purchaseOrder && formData.purchaseOrder instanceof File) {
        let poData = await getPresignedApkUrlAction(
          formData.purchaseOrder.name,
          formData.purchaseOrder.type,
          formData.purchaseOrder.size
        );
        formDataToSend.append("purchaseOrder", poData.url);
        const poTaskId = addTask(formData.purchaseOrder, `po-${formData.name}`);
        await uploadFileAction(
          poData.presignedUrl,
          formData.purchaseOrder,
          poTaskId,
          updateTask
        );
      } else {
        formDataToSend.append("purchaseOrder", formData.purchaseOrder || '');
      } 


      const createOrg = await editOrgAction(formDataToSend, orgName);
      onAction(t("Organisationupdatedsuccessfully"), "success");
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (createOrg) {
        fetchOrgs();
      }
    } catch (error) {
      onAction(t("OrganisationupdatedError"), "danger");
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e: any) => {
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
              {t("organisation_name")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("organisation_details_validations")}
            </span>
          </div>
          <FormInput
            id="crud-form-1"
            type="text"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.name,
            })}`}
            name="name"
            placeholder={t("OrgNameValidation")}
            value={formData.name}
            onChange={handleInputChange}
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm">{formErrors.name}</p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="crud-form-4" className="font-bold">
              {t("organisation_email")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2"></span>
          </div>
          <FormInput
            id="crud-form-4"
            type="email"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.org_email,
            })}`}
            name="org_email"
            placeholder={t("orgEmail")}
            required
            value={formData.org_email}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              handleKeyDown(e);
              if (e.key === " ") {
                e.preventDefault();
              }
            }}
          />
          {formErrors.org_email && (
            <p className="text-red-500 text-sm">{formErrors.org_email}</p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="crud-form-6" className="font-bold">
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
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <label
              htmlFor="crud-form-6"
              className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300  ${
                fileUrl ? "top-2 mb-1" : "top-1/2 transform -translate-y-1/2"
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
                className="absolute inset-0 w-full h-full object-contain preview-image "
              />
            )}
          </div>

          {formErrors.thumbnail && (
            <p className="text-red-500 text-sm">{formErrors.thumbnail}</p>
          )}

          <div className="mb-3 mt-5">
            <FormLabel className="font-bold block mb-3">
              {t("planType")}
            </FormLabel>
            <div className="flex flex-col space-y-2">
              <FormCheck>
                <FormCheck.Input
                  id="admin"
                  type="radio"
                  name="planType"
                  value="free"
                  checked={formData.planType === "free"}
                  onChange={handleInputChange}
                  className="form-radio"
                  onKeyDown={(e) => handleKeyDown(e)}
                />
                <FormCheck.Label htmlFor="admin" className="font-normal ml-2">
                  {t("30day_free_trial")}
                </FormCheck.Label>
              </FormCheck>

              <FormCheck>
                <FormCheck.Input
                  id="admin"
                  type="radio"
                  name="planType"
                  value="1 Year Licence"
                  checked={formData.planType === "1 Year Licence"}
                  onChange={handleInputChange}
                  className="form-radio"
                  onKeyDown={(e) => handleKeyDown(e)}
                />
                <FormCheck.Label htmlFor="admin" className="font-normal ml-2">
                  {t("1year_licence")}
                </FormCheck.Label>
              </FormCheck>

              <FormCheck>
                <FormCheck.Input
                  id="Faculty"
                  type="radio"
                  name="planType"
                  value="5 Year Licence"
                  checked={formData.planType === "5 Year Licence"}
                  onChange={handleInputChange}
                  className="form-radio"
                  onKeyDown={(e) => handleKeyDown(e)}
                />
                <FormCheck.Label htmlFor="Faculty" className="font-normal ml-2">
                  {t("5_year_licence")}
                </FormCheck.Label>
              </FormCheck>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="org-form-2" className="font-bold">
              {t("amount")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>
          <FormInput
            id="org-form-2"
            type="number"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.amount,
            })}`}
            name="amount"
            placeholder={t("amountValidation")}
            value={formData.amount}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              handleKeyDown(e);
              if (e.key === " ") {
                e.preventDefault();
              }
            }}
          />
          {formErrors.amount && (
            <p className="text-red-500 text-left text-sm">
              {formErrors.amount}
            </p>
          )}

          <div className="flex items-center justify-between mt-5">
            <FormLabel htmlFor="org-form-po" className="font-bold OrgIconLabel">
              {t("PurchaseOrder")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>
          <label className="block cursor-pointer w-full">
            <FormInput
              id="org-form-po"
              type="file"
              name="purchaseOrder"
              onChange={handleInputChange}
              className="hidden"
            />
            <div
              className={clsx(
                "w-full h-10 p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
                {
                  "border-danger": formErrors.purchaseOrder,
                  "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20":
                    !formErrors.purchaseOrder,
                }
              )}
            >
              {formData.purchaseOrder ? (
                <div className="flex items-center">
                  <span className="w-2 h-2 mr-2 bg-primary rounded-full"></span>
                  <span className="text-sm font-medium text-primary">
                    {typeof formData.purchaseOrder === "string"
                      ? formData.purchaseOrder.split('/').pop()?.split('-').pop() // Display name from URL
                      : formData.purchaseOrder.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("uploadpurachaseorder")}
                </span>
              )}
            </div>
          </label>
          {formErrors.purchaseOrder && (
            <p className="text-red-500 text-left text-sm mt-2">
              {formErrors.purchaseOrder}
            </p>
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
            {uploadStatusapi && (
              <p className="text-green-500 mt-3">{uploadStatusapi}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;