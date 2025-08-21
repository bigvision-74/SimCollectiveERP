import React, { useState } from "react";
import Button from "@/components/Base/Button";
import {
  FormInput,
  FormLabel,
  FormSwitch,
  FormCheck,
} from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { saveSettingsAction, getSettingsAction } from "@/actions/settingAction";
import { useEffect } from "react";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "@/components/UploadContext";
import { Dialog } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import {
  addMailAction,
  getAllMailAction,
  updateMailStatusAction,
} from "@/actions/organisationAction";

interface Mail {
  id: string;
  fname: string;
  lname: string;
  email: string;
  status: string;
}

function Settings() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("inactive");
  const [addMailModal, setAddMailModal] = useState(false);
  const [lname, setLname] = useState("");
  const [fname, setFname] = useState("");
  const [email, setEmail] = useState("");
  const [mails, setMails] = useState<Mail[]>([]);
  const { addTask, updateTask } = useUploads();
  const [files, setFiles] = useState<{ favicon?: File; logo?: File }>({});
  const [errors1, setErrors1] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keywords: "",
    favicon: null as File | null,
    logo: null as File | null,
    stripeMode: "test" as "test" | "live",
  });

  const [preview, setPreview] = useState({
    faviconUrl: "",
    logoUrl: "",
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    keywords: "",
    favicon: "",
    logo: "",
  });

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/x-icon"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [name]: "Only PNG, JPG, or ICO files allowed.",
      }));
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    // Update preview
    setPreview((prev) => ({
      ...prev,
      [`${name}Url`]: fileUrl,
    }));

    // Update selected files
    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));

    // Update form
    setFormData((prev) => ({
      ...prev,
      [name]: file,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async () => {
    let hasError = false;
    const newErrors = {
      title: "",
      description: "",
      keywords: "",
      favicon: "",
      logo: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = t("Titlerequired");
      hasError = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = t("Descriptionrequired");
      hasError = true;
    }

    if (!formData.keywords.trim()) {
      newErrors.keywords = t("Keywordsrequired");
      hasError = true;
    }
    if (!preview.faviconUrl && !files.favicon) {
      newErrors.favicon = t("Faviconrequired");
      hasError = true;
    }

    if (!preview.logoUrl && !files.logo) {
      newErrors.logo = t("Logoisrequired");
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    const formPayload = new FormData();
    formPayload.append("title", formData.title);
    formPayload.append("description", formData.description);
    formPayload.append("keywords", formData.keywords);
    formPayload.append("stripeMode", formData.stripeMode);

    // Favicon Upload
    if (files.favicon) {
      const data = await getPresignedApkUrlAction(
        files.favicon.name,
        files.favicon.type,
        files.favicon.size
      );
      formPayload.append("favicon", data.url);
      const taskId = addTask(files.favicon, formData.title);
      await uploadFileAction(
        data.presignedUrl,
        files.favicon,
        taskId,
        updateTask
      );
    }

    // Logo Upload
    if (files.logo) {
      const data = await getPresignedApkUrlAction(
        files.logo.name,
        files.logo.type,
        files.logo.size
      );
      formPayload.append("logo", data.url);
      const taskId = addTask(files.logo, formData.title);
      await uploadFileAction(data.presignedUrl, files.logo, taskId, updateTask);
    }

    try {
      const result = await saveSettingsAction(formPayload);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "success",
        message: "Settings saved successfully!",
      });
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleStripeModeChange = (mode: "test" | "live") => {
    setFormData((prev) => ({
      ...prev,
      stripeMode: mode,
    }));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    fieldName: "logo" | "favicon"
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];

    if (file) {
      if (!["image/png", "image/jpeg", "image/x-icon"].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "Only PNG, JPG, or ICO files allowed.",
        }));
        return;
      }

      const url = URL.createObjectURL(file);

      // Set preview
      setPreview((prev) => ({
        ...prev,
        [`${fieldName}Url`]: url,
      }));

      // Set file for upload
      setFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }));

      // Update formData for submission
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));

      // Clear errors
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));

      // Optional cleanup
      return () => URL.revokeObjectURL(url);
    } else {
      // Clear preview and set error
      setPreview((prev) => ({
        ...prev,
        [`${fieldName}Url`]: "",
      }));

      setErrors((prev) => ({
        ...prev,
        [fieldName]: t("Thisfieldrequired"),
      }));
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettingsAction();

        setFormData({
          title: settings.title || "",
          description: settings.description || "",
          keywords: settings.keywords || "",
          favicon: null,
          logo: null,
          stripeMode: settings.keyType || "test",
        });

        setPreview({
          faviconUrl: settings.favicon || "",
          logoUrl: settings.logo || "",
        });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const fetchMails = async () => {
    try {
      const res = await getAllMailAction();
      setMails(res);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  useEffect(() => {
    fetchMails();
  }, []);

  const handleSubmit1 = async () => {
    // Reset errors
    setErrors1({});

    // Validate required fields
    const newErrors: { [key: string]: string } = {};

    if (!fname.trim()) {
      newErrors.fname = "First name is required";
    }

    if (!lname.trim()) {
      newErrors.lname = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // If there are validation errors, set them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors1(newErrors);
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append("fname", fname);
      formPayload.append("lname", lname);
      formPayload.append("email", email);

      const response = await addMailAction(formPayload);

      if (response.success) {
        setShowAlert({
          variant: "success",
          message: response.message || "Mail added successfully!",
        });
        fetchMails();
        setFname("");
        setLname("");
        setEmail("");
        // Close modal
        setAddMailModal(false);
      } else {
        setShowAlert({
          variant: "danger",
          message: response.message || "Failed to add mail.",
        });
      }
    } catch (error: any) {
      console.error("Error adding mail:", error);
      setShowAlert({
        variant: "danger",
        message:
          error.response?.data?.message ||
          "Failed to add mail. Please try again.",
      });
    }
  };

  const handleToggleStatus = async (mailId: string, currentStatus: string) => {
    try {
      setShowAlert(null);
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const formPayload = new FormData();
      formPayload.append("id", mailId);
      formPayload.append("status", newStatus);

      const res = await updateMailStatusAction(formPayload);
      if (res.success) {
        fetchMails();

        setShowAlert({
          variant: "success",
          message: t("mailupdatesuccess"),
        });
      }
    } catch (error) {
      console.error("Error updating mail status:", error);
      setShowAlert({
        variant: "danger",
        message: t("mailupdateerror"),
      });
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("settings")}</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5 items-start">
        <div className="col-span-12 intro-y lg:col-span-7">
          <div className="p-5 intro-y box">
            {/* Title */}
            <div className="mb-5">
              <FormLabel className="font-bold">{t("setting_title")}</FormLabel>
              <FormInput
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={clsx("w-full", { "border-danger": errors.title })}
                placeholder="Enter title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-5">
              <FormLabel className="font-bold">{t("description")}</FormLabel>
              <FormInput
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={clsx("w-full", {
                  "border-danger": errors.description,
                })}
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Keywords */}
            <div className="mb-5">
              <FormLabel className="font-bold">{t("keywords")}</FormLabel>
              <FormInput
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className={clsx("w-full", { "border-danger": errors.keywords })}
                placeholder="Enter keywords"
              />
              {errors.keywords && (
                <p className="text-red-500 text-sm">{errors.keywords}</p>
              )}
            </div>

            {/* Favicon Upload */}
            <div className="flex items-center justify-between mt-5">
              <FormLabel
                htmlFor="favicon-upload"
                className="font-bold AddUserLabelThumbnail"
              >
                {t("favicon")}
              </FormLabel>
            </div>

            <div
              className={`relative w-full mb-2 p-4 border-2 ${
                errors.favicon
                  ? "border-dotted border-danger"
                  : "border-dotted border-gray-300"
              } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
              onDrop={(e) => handleDrop(e, "favicon")}
              onDragOver={handleDragOver}
            >
              <input
                id="favicon-upload"
                type="file"
                accept="image/*"
                name="favicon"
                className="absolute inset-0 w-full mb-2 opacity-0 cursor-pointer"
                onClick={() => console.log("Favicon input clicked")}
                onChange={handleFileChange}
              />

              {/* Label moves up if file is selected */}
              <label
                htmlFor="favicon-upload"
                className={`cursor-pointer text-center w-full mb-2 font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                  preview.faviconUrl || files.favicon
                    ? "top-2 mb-1"
                    : "top-1/2 transform -translate-y-1/2"
                }`}
              >
                {formData.favicon
                  ? `${t("selected")} ${formData.favicon.name}`
                  : t("drop")}
              </label>

              {/* Preview image below label */}
              {preview.faviconUrl && (
                <img
                  src={preview.faviconUrl}
                  alt="Favicon Preview"
                  className="absolute inset-0 w-full mb-2 object-contain preview-image"
                />
              )}
            </div>

            {errors.favicon && (
              <p className="text-red-500 text-sm">{errors.favicon}</p>
            )}

            {/* Logo Upload */}
            <div className="flex items-center justify-between mt-5">
              <FormLabel
                htmlFor="logo-upload"
                className="font-bold AddUserLabelThumbnail"
              >
                {t("logo")}
              </FormLabel>
            </div>

            <div
              className={`relative w-full mb-2 p-4 border-2 ${
                errors.logo
                  ? "border-dotted border-danger"
                  : "border-dotted border-gray-300"
              } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
              onDrop={(e) => handleDrop(e, "logo")}
              onDragOver={handleDragOver}
            >
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                name="logo"
                className="absolute inset-0 w-full mb-2 opacity-0 cursor-pointer"
                onClick={() => console.log("Logo input clicked")}
                onChange={handleFileChange}
              />

              {/* Floating label */}
              <label
                htmlFor="logo-upload"
                className={`cursor-pointer text-center w-full mb-2 font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                  preview.logoUrl || files.logo
                    ? "top-2 mb-1"
                    : "top-1/2 transform -translate-y-1/2"
                }`}
              >
                {formData.logo
                  ? `${t("selected")} ${formData.logo.name}`
                  : t("drop")}
              </label>

              {/* Preview */}
              {preview.logoUrl && (
                <img
                  src={preview.logoUrl}
                  alt="Logo Preview"
                  className="absolute inset-0 w-full mb-2 object-contain preview-image"
                />
              )}
            </div>

            {/* Error message */}
            {errors.logo && (
              <p className="text-red-500 text-sm">{errors.logo}</p>
            )}

            <div className="mt-5">
              <FormLabel className="font-bold block mb-2">
                {t("stripe")}
              </FormLabel>

              <div className="flex items-center space-x-6">
                {/* Test Mode Switch */}
                <div className="flex items-center">
                  <FormSwitch.Input
                    id="stripe-test-mode"
                    type="checkbox"
                    checked={formData.stripeMode === "test"}
                    onChange={() => handleStripeModeChange("test")}
                    disabled={formData.stripeMode === "test"}
                  />
                  <FormLabel htmlFor="stripe-test-mode" className="ml-2">
                    {t("test")}
                  </FormLabel>
                </div>

                {/* Live Mode Switch */}
                <div className="flex items-center">
                  <FormSwitch.Input
                    id="stripe-live-mode"
                    type="checkbox"
                    checked={formData.stripeMode === "live"}
                    onChange={() => handleStripeModeChange("live")}
                    disabled={formData.stripeMode === "live"}
                  />
                  <FormLabel htmlFor="stripe-live-mode" className="ml-2">
                    {t("live")}
                  </FormLabel>
                </div>
              </div>
            </div>

            <div className="text-right mt-6">
              <Button
                variant="primary"
                className="w-32"
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
                  `${t("save")}`
                )}{" "}
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 intro-y lg:col-span-5 box">
          <div className="items-center p-5 flex border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">{t("EnableMail")}</h2>
            <Button
              onClick={() => setAddMailModal(true)}
              variant="primary"
              className="mr-2 shadow-md AddNewUserListbtn"
            >
              {t("addNewMail")}
            </Button>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {mails.map((mail, index) => (
                <div
                  key={mail.id}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex space-x-4">
                    <div className="text-gray-500 font-medium w-6 text-right">
                      {index + 1}.
                    </div>
                    <div>
                      <a
                        href="#"
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {mail.fname} {mail.lname}
                      </a>
                      <div className="text-gray-500 text-sm mt-1">
                        {mail.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FormSwitch.Input
                      id={`status-switch-${mail.id}`}
                      type="checkbox"
                      checked={mail.status === "active"}
                      onChange={() => handleToggleStatus(mail.id, mail.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        size="xl"
        open={addMailModal}
        onClose={() => {
          setAddMailModal(false);
          setErrors1({}); // Changed to setErrors1
        }}
      >
        <Dialog.Panel className="p-10">
          <a
            onClick={(event: React.MouseEvent) => {
              event.preventDefault();
              setAddMailModal(false);
              setErrors1({}); // Changed to setErrors1
            }}
            className="absolute top-0 right-0 mt-3 mr-3"
          >
            <Lucide icon="X" className="w-6 h-6 text-slate-400" />
          </a>
          <div className="box p-5">
            <Dialog.Title className="text-lg font-medium mb-5">
              {t("addNewMail")}
            </Dialog.Title>
            <div className="mt-5">
              <div className="mb-5">
                <FormLabel className="font-bold">{t("first_name")}</FormLabel>
                <FormInput
                  type="text"
                  name="fname"
                  value={fname}
                  onChange={(e) => {
                    setFname(e.target.value);
                    // Clear error when user starts typing - changed to setErrors1
                    if (errors1.fname) {
                      setErrors1((prev) => ({ ...prev, fname: "" }));
                    }
                  }}
                  className={clsx("w-full", { "border-danger": errors1.fname })}
                  placeholder={t("enter_first_name")}
                />
                {errors1.fname && (
                  <p className="text-red-500 text-sm mt-1">{errors1.fname}</p>
                )}
              </div>

              <div className="mb-5">
                <FormLabel className="font-bold">{t("last_name")}</FormLabel>
                <FormInput
                  type="text"
                  name="lname"
                  value={lname}
                  onChange={(e) => {
                    setLname(e.target.value);
                    // Clear error when user starts typing - changed to setErrors1
                    if (errors1.lname) {
                      setErrors1((prev) => ({ ...prev, lname: "" }));
                    }
                  }}
                  className={clsx("w-full", { "border-danger": errors1.lname })}
                  placeholder={t("enter_last_name")}
                />
                {errors1.lname && (
                  <p className="text-red-500 text-sm mt-1">{errors1.lname}</p>
                )}
              </div>

              <div className="mb-5">
                <FormLabel className="font-bold">{t("email")}</FormLabel>
                <FormInput
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing - changed to setErrors1
                    if (errors1.email) {
                      setErrors1((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  className={clsx("w-full", { "border-danger": errors1.email })}
                  placeholder={t("enter_email")}
                />
                {errors1.email && (
                  <p className="text-red-500 text-sm mt-1">{errors1.email}</p>
                )}
              </div>
            </div>

            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                className="w-24"
                onClick={handleSubmit1}
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
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default Settings;
