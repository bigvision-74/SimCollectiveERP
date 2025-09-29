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
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

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
    amount: string;
    planType: string;
    icon: File | null;
    purchaseOrder: File | null;
  }>({
    orgName: "",
    email: "",
    amount: "",
    planType: "1 Year Licence",
    icon: null,
    purchaseOrder: null,
  });

  interface FormErrors {
    orgName: string;
    email: string;
    amount: string;
    icon?: string | File | null;
    plantype: string;
    purchaseOrder: string;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({
    orgName: "",
    email: "",
    amount: "",
    icon: null,
    plantype: "",
    purchaseOrder: "",
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
  const [iconError, setIconError] = useState<string | null>(null);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const validateOrgName = (orgName: string) => {
    if (!orgName) return t("OrgNameValidation1");
    if (orgName.length < 4) return t("OrgNameValidation2");
    if (orgName.length > 150) return t("OrgNameValidationMaxLength");
    if (!isValidInput(orgName)) return t("invalidInput");
    return "";
  };

  const validatePlantype = (plantype: string) => {
    if (!plantype) return t("plantypeValidation1");
    return "";
  };

  const validateAmount = (amount: string) => {
    if (!amount && formData.planType != "free") return t("amountValidation1");
    return "";
  };

  const validatePurchaseOrder = (purchaseOrder: File | null) => {
    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (purchaseOrder && purchaseOrder.size > MAX_FILE_SIZE) {
      return `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`;
    }

    if (!purchaseOrder) return t("purchaseOrderValidation1");
    return "";
  };

  // const validateEmail = (email: string) => {
  //   if (!email) return t("emailValidation1");
  //   if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
  //     return t("emailValidation3");
  //   return "";
  // };

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

  // const validateIcon = (icon: any) => {
  //   return icon ? "" : t("OrgIconValidation");
  // };

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
      // if (name === "icon") {
      //   newErrors.icon = validateIcon(files?.[0] ?? "");
      // }
      if (name === "planType") {
        newErrors.plantype = validatePlantype(value);
      }
      if (name === "amount") {
        newErrors.amount = validateAmount(value);
      }
      if (name === "purchaseOrder") {
        newErrors.purchaseOrder = validatePurchaseOrder(
          files ? files[0] : null
        );
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
        // icon: validateIcon(file),
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];

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
        setIconError(
          "Only PNG, JPG, JPEG, GIF, WEBP, BMP, SVG, TIFF, ICO, and HEIC images are allowed."
        );
        setFormErrors((prev) => ({ ...prev, icon: null }));
        e.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setIconError(`${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
        setFormErrors((prev) => ({ ...prev, icon: null }));
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
        icon: null,
      }));
    }
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {
      orgName: validateOrgName(formData.orgName.trim()),
      plantype: validatePlantype(formData.planType),
      amount: validateAmount(formData.amount),
      email: validateEmail(formData.email.trim()),
      purchaseOrder: validatePurchaseOrder(formData.purchaseOrder),
    };

    return errors;
  };
  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;

    try {
      setLoading(true);
      const formDataObj = new FormData();
      formDataObj.append("orgName", formData.orgName);
      formDataObj.append("email", formData.email);
      formDataObj.append("planType", formData.planType);
      formDataObj.append("amount", formData.amount);

      let upload;
      if (formData.icon != null) {
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
      } else {
        formDataObj.append("icon", "");
      }

      if (formData.purchaseOrder != null) {
        let purchaseOrderData = await getPresignedApkUrlAction(
          formData.purchaseOrder.name,
          formData.purchaseOrder.type,
          formData.purchaseOrder.size
        );
        formDataObj.append("purchaseOrder", purchaseOrderData.url);
        const purchaseOrderTaskId = addTask(
          formData.purchaseOrder,
          `purchase-order-${formData.orgName}`
        );
        await uploadFileAction(
          purchaseOrderData.presignedUrl,
          formData.purchaseOrder,
          purchaseOrderTaskId,
          updateTask
        );
      }

      // if (upload) {
      const createOrg = await createOrgAction(formDataObj);

      setFormData({
        orgName: "",
        email: "",
        icon: null,
        planType: "1 Year Licence",
        amount: "",
        purchaseOrder: null,
      });
      setFileUrl(null);
      setFileName("");
      onShowAlert({
        variant: "success",
        message: t("AddOrgSuccess"),
      });
      // }
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
      setFormData({
        orgName: "",
        email: "",
        icon: null,
        planType: "1 Year Licence",
        amount: "",
        purchaseOrder: null,
      });
      setFileUrl(null);
      setFileName("");

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="intro-y">
        {/* <div className="flex flex-col items-center border-b border-slate-200/60 p-2 dark:border-darkmode-400 sm:flex-row p-5">
          <h2 className="mr-2 text-base font-medium">
            {t("add_new_organisation")}
          </h2>
        </div> */}
        <div className="text-left">
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
            onKeyDown={(e) => {
              handleKeyDown(e);
              if (e.key === " ") {
                e.preventDefault();
              }
            }}
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
              iconError
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
          {typeof iconError === "string" && (
            <p className="text-red-500 text-sm">{iconError}</p>
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
            <FormLabel htmlFor="org-form-3" className="font-bold OrgIconLabel">
              {t("PurchaseOrder")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>

          <label className="block cursor-pointer w-full">
            <FormInput
              type="file"
              name="purchaseOrder"
              onChange={handleInputChange} // Use your existing handler to update the form state
              className="hidden"
            />
            <div
              className={clsx(
                "w-full h-full p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
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
                    {formData.purchaseOrder.name}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;
