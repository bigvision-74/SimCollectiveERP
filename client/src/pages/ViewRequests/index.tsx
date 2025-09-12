import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import { Disclosure } from "@/components/Base/Headless";
import {
  getPatientRequestsAction,
  getCategoryAction,
  getInvestigationParamsAction,
  submitInvestigationResultsAction,
  getReportTemplatesAction,
} from "@/actions/patientActions";
import { useNavigate } from "react-router-dom";
import {
  sendNotificationToAdminAction,
  sendNotificationToAllAdminsAction,
} from "@/actions/notificationActions";
import {
  FormInput,
  FormCheck,
  FormLabel,
  FormTextarea,
  FormSelect,
} from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import {
  addNotificationAction,
  getAdminOrgAction,
  getAdminsByIdAction,
} from "@/actions/adminActions";
import { getSuperadminsAction } from "@/actions/userActions";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "@/components/UploadContext";
import { useAppContext } from "@/contexts/sessionContext";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import MediaLibrary from "@/components/MediaLibrary";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

type InvestigationItem = {
  id: number;
  patient_id: string;
  request_by: string;
  test_name: string;
  category: string;
  investCategory: string;
  status: string;
  created_at: string;
  updated_at: string;
  investId: number;
  // from joined patient_records
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  organisation_id: string;
};

interface TestParameter {
  field_type: string;
  parameter_name: string;
  id: number;
  name: string;
  normal_range: string;
  units: string;
  test_name: string;
  value?: string | File;
  category: string;
  created_at: string;
  updated_at: string;
  investId: number;
  investigation_id: string;
  file?: File;
  fileName?: string;
}

// Add interface for report template
// interface ReportTemplate {
//   id: number;
//   name: string;
//   parameters: {
//     parameter_id: number;
//     value: string;
//   }[];
// }

interface ReportTemplate {
  id: number;
  name: string;
  investigation_id: number;
  patient_id: number;
  submitted_by: string;
  created_at: string;
  parameters: {
    parameter_id: number;
    name: string;
    value: string;
    normal_range: string;
    units: string;
    field_type: string;
  }[];
}

function ViewPatientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<TestParameter[]>([]);
  const [categories, setCatories] = useState<InvestigationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [selectedParamIndex, setSelectedParamIndex] = useState<number | null>(
    null
  );
  const [libraryImages, setLibraryImages] = useState([]);
  const { sessionInfo } = useAppContext();
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [paramErrors, setParamErrors] = useState<{ [key: number]: string }>({});
  const [openIndex, setOpenIndex] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { addTask, updateTask } = useUploads();
  const [scheduledDate, setScheduledDate] = useState("");
  const [showTimeOption, setShowTimeOption] = useState("now");
  const [delayMinutes, setDelayMinutes] = useState<string>("");
  const dispatch = useAppDispatch();

  // Add state for templates modal
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [allTestDetails, setAllTestDetails] = useState<TestParameter[]>([]);

  // Add function to fetch templates
  const fetchTemplates = async () => {
    try {
      if (!selectedTest) return;
      const data = await getReportTemplatesAction(
        selectedTest.investId,
        Number(id) // patient id from URL
      );
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  // Add function to open templates modal
  const handleOpenTemplatesModal = () => {
    fetchTemplates();
    setIsTemplatesModalOpen(true);
  };

  // Add function to apply template values
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const updatedDetails = testDetails.map((param) => {
      const match = selectedTemplate.parameters.find(
        (p) =>
          String(p.parameter_id) === String(param.id) || p.name === param.name
      );

      return match
        ? {
            ...param,
            value: match.value ?? "",
            normal_range: match.normal_range ?? param.normal_range,
            units: match.units ?? param.units,
          }
        : param;
    });

    setTestDetails(updatedDetails);
    setIsTemplatesModalOpen(false);
    setSelectedTemplate(null);
  };

  const fetchPatient = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));
      const currentOrgId = userData?.orgid;

      const PatientRequest = await getPatientRequestsAction(
        Number(id),
        currentOrgId
      );

      setCatories(PatientRequest);

      // Fetch all params for all tests
      const allParams: TestParameter[] = [];
      for (const test of PatientRequest) {
        const params = await getInvestigationParamsAction(test.investId);
        allParams.push(...params);
      }

      setAllTestDetails(allParams);
      return PatientRequest;
    } catch (error) {
      console.error("Error fetching patient", error);
      return [];
    }
  };

  const handleSelectImage = (image: { name: string; url: string }) => {
    if (selectedParamIndex !== null) {
      const updatedDetails = [...testDetails];
      const currentParam = updatedDetails[selectedParamIndex];

      currentParam.value = image.url;
      currentParam.fileName = image.name;
      currentParam.file = undefined;

      setTestDetails(updatedDetails);
    }
    setIsMediaLibraryOpen(false);
    setSelectedParamIndex(null);
  };

  const getInvestigationParamsById = async (id: number) => {
    try {
      const data = await getInvestigationParamsAction(id);
      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  function formatForMySQL(date: Date) {
    const pad = (n: number) => (n < 10 ? "0" + n : n);
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  }

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    setLoading(true);

    try {
      const userID = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userID));
      const submittedBy = userData?.uid;
      const orgId = userData?.orgid;

      const superadmins = await getSuperadminsAction();
      const superadminIds = superadmins.map((admin) => admin.id);

      const finalPayload = [];

      for (const param of testDetails) {
        let valueToSave = param.value || "";

        if (param.field_type === "image" && param.file instanceof File) {
          try {
            const presignedData = await getPresignedApkUrlAction(
              param.file.name,
              param.file.type,
              param.file.size
            );

            const taskId = addTask(param.file, `param-${param.id}`);
            await uploadFileAction(
              presignedData.presignedUrl,
              param.file,
              taskId,
              updateTask
            );

            valueToSave = presignedData.url;
          } catch (uploadErr) {
            console.error(
              `Image upload failed for parameter ${param.id}:`,
              uploadErr
            );
            continue;
          }
        }

        finalPayload.push({
          request_investigation_id: selectedTest?.id,
          investigation_id: param.investigation_id,
          patient_id: id,
          parameter_id: param.id,
          value: valueToSave,
          submitted_by: submittedBy,
          organisation_id: orgId,
          sessionId: Number(sessionInfo.sessionId),

          scheduled_date:
            showTimeOption === "now"
              ? null
              : showTimeOption === "later"
              ? formatForMySQL(new Date(scheduledDate))
              : formatForMySQL(
                  new Date(Date.now() + Number(delayMinutes) * 60000)
                ),
        });
      }

      const userEmail = localStorage.getItem("user");
      const userData1 = await getAdminOrgAction(String(userEmail));
      const facultiesIds = await getAdminsByIdAction(Number(userData1.orgid));

      const createCourse = await submitInvestigationResultsAction({
        payload: finalPayload,
      });

      if (createCourse) {
        setShowAlert({
          variant: "success",
          message: t("ReportSubmitSuccessfully"),
        });

        setShowTimeOption("now");
        setScheduledDate("");

        if (sessionInfo && sessionInfo.sessionId) {
          await sendNotificationToAllAdminsAction(
            facultiesIds,
            userData1.uid,
            sessionInfo.sessionId,
            finalPayload
          );
        }
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (selectedTest?.request_by) {
          try {
          } catch (notifyErr) {
            console.warn("Notification to admin failed:", notifyErr);
          }
        }

        const testNames = testDetails
          .map((p) => p.test_name || p.parameter_name || "Test")
          .join(", ");
        const superadminMsg = `New investigation result(s) ${testNames} have been submitted.`;

        for (const superadminId of superadminIds) {
          try {
            await addNotificationAction(
              superadminMsg,
              superadminId.toString(),
              "Investigation Result Submitted"
            );
          } catch (err) {
            console.warn(`Failed to notify superadmin ${superadminId}:`, err);
          }
        }

        const updatedData = await fetchPatient();

        if (!updatedData || updatedData.length === 0) {
          navigate("/investigations");
        } else {
          setCatories(updatedData);

          const stillExists = updatedData.some(
            (item: any) => item.investId === selectedTest?.investId
          );

          if (!stillExists && updatedData.length > 0) {
            // Auto-select first test again
            const firstCategory = updatedData[0].investCategory;
            const firstTest = updatedData.find(
              (cat: any) => cat.investCategory === firstCategory
            );
            if (firstTest) {
              setSelectedTest(firstTest);
              getInvestigationParamsById(firstTest.investId);
            }
          }
        }
      }
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = Array.from(
    new Set(categories.map((cat) => cat.investCategory))
  ).sort();

  useEffect(() => {
    if (
      !hasInitialized &&
      categories.length > 0 &&
      uniqueCategories.length > 0
    ) {
      const firstCategory = uniqueCategories[0];
      const firstTest = categories.find(
        (cat) => cat.investCategory === firstCategory
      );

      if (firstTest) {
        setSelectedTest(firstTest);
        getInvestigationParamsById(firstTest.investId);
        setHasInitialized(true);
      }
    }
  }, [categories, uniqueCategories, hasInitialized]);

  useEffect(() => {
    fetchPatient();
    const savedTab = localStorage.getItem("selectedPick");
    if (savedTab) {
    }
  }, []);

  const isSubmitDisabled =
    loading ||
    (showTimeOption === "later" && !scheduledDate.trim()) ||
    (showTimeOption === "delay" && !delayMinutes.trim());

  return (
    <>
      <MediaLibrary
        investId={selectedTest?.investId}
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleSelectImage}
      />

      {/* Templates Modal */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black/50">
          <div className="relative w-full max-w-4xl mx-auto my-6">
            <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none dark:bg-darkmode-600">
              <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-slate-200">
                <h3 className="text-xl font-semibold">
                  {t("Select Report Template")}
                </h3>
                <button
                  className="float-right p-1 ml-auto text-2xl font-semibold leading-none bg-transparent border-0 outline-none focus:outline-none"
                  onClick={() => setIsTemplatesModalOpen(false)}
                >
                  <Lucide icon="X" className="w-5 h-5" />
                </button>
              </div>

              <div className="relative p-6 flex-auto max-h-96 overflow-y-auto">
                {/* Scrollable body */}
                <div className="grid grid-cols-1 gap-4 mt-2">
                  {templates.map((template) => {
                    const textParams = template.parameters.filter(
                      (param) =>
                        param.value && // must have value
                        !/^https?:\/\//.test(param.value) &&
                        !/\.(jpg|jpeg|png|gif|mp4|webm|svg)$/i.test(param.value)
                    );

                    if (textParams.length === 0) return null;

                    return (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg cursor-pointer transition ${
                          selectedTemplate?.id === template.id
                            ? "border-2 border-primary bg-primary/5 shadow-md"
                            : "border border-slate-300 hover:border-primary"
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="p-2 text-left">
                                {t("ParameterName")}
                              </th>
                              <th className="p-2 text-left">{t("Value")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {textParams.map((param) => (
                              <tr
                                key={param.parameter_id}
                                className="border-t border-slate-200"
                              >
                                <td className="p-2">{param.name}</td>
                                <td className="p-2">{param.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                  {templates.length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      {t("No templates available")}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end p-6 border-t border-solid rounded-b border-slate-200">
                <Button
                  variant="outline-secondary"
                  className="mr-2"
                  onClick={() => setIsTemplatesModalOpen(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplate}
                >
                  {t("Apply Template")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patient_report")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="box">
            <div className="p-5 space-y-2">
              {uniqueCategories.map((investCategory, index) => {
                const key = investCategory.replace(/\s+/g, "");
                const itemsInCategory = categories.filter(
                  (cat) => cat.investCategory === investCategory
                );

                const isOpen = openIndex === index;

                return (
                  <Disclosure.Group variant="boxed" key={key}>
                    <Disclosure defaultOpen={isOpen}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            onClick={() => setOpenIndex(open ? -1 : index)}
                            className="w-full text-left"
                          >
                            {investCategory}
                          </Disclosure.Button>
                          {open && (
                            <Disclosure.Panel className="leading-relaxed text-slate-600 dark:text-slate-500">
                              <ul className="list-disc ml-6">
                                {itemsInCategory.map((item) => (
                                  <li
                                    key={item.id}
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => {
                                      setSelectedTest(item);
                                      getInvestigationParamsById(item.investId);
                                    }}
                                  >
                                    {item.test_name}
                                  </li>
                                ))}
                              </ul>
                            </Disclosure.Panel>
                          )}
                        </>
                      )}
                    </Disclosure>
                  </Disclosure.Group>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 box">
            {selectedTest && testDetails?.length > 0 && (
              <div className="p-4 bg-white">
                {selectedTest.session_name && (
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-slate-700">
                      {t("Session")}:
                    </span>
                    <span className="ml-2 text-sm ">
                      {selectedTest.session_name}
                    </span>
                  </div>
                )}

                <h3 className="mb-4 text-lg font-semibold text-primary flex justify-between">
                  <span>{selectedTest.test_name}</span>
                  <span className="mb-4 text-lg font-semibold text-primary flex justify-between">
                    {t("requested_by")}:-
                    {selectedTest.request_first_name &&
                    selectedTest.request_last_name
                      ? `${selectedTest.request_first_name} ${selectedTest.request_last_name}`
                      : "N/A"}
                  </span>
                </h3>

                {/* Add Template Button */}
                <div className="mb-4">
                  <Button
                    variant="outline-primary"
                    onClick={handleOpenTemplatesModal}
                    className="flex items-center"
                  >
                    <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                    {t("Use Template")}
                  </Button>
                </div>

                <div className="space-y-4 overflow-x-auto">
                  <table className="min-w-full border text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-4 py-2 border">
                          {t("ParameterName")}
                        </th>
                        <th className="px-4 py-2 border">{t("Value")}</th>
                        <th className="px-4 py-2 border">{t("NormalRange")}</th>
                        <th className="px-4 py-2 border">{t("Units")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testDetails?.map((param, index) => (
                        <tr
                          key={param.id}
                          className="bg-white hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 border">{param.name}</td>
                          <td className="px-4 py-2 border">
                            {param.field_type === "text" ? (
                              <FormInput
                                type="text"
                                value={
                                  typeof param.value === "string"
                                    ? param.value
                                    : ""
                                }
                                onChange={(e) => {
                                  const updated = [...testDetails];
                                  updated[index] = {
                                    ...updated[index],
                                    value: e.target.value,
                                  };
                                  setTestDetails(updated);
                                }}
                                className="w-full p-1 border rounded"
                              />
                            ) : param.field_type === "textarea" ? (
                              <CKEditor
                                editor={ClassicEditor}
                                data={
                                  typeof param.value === "string"
                                    ? param.value
                                    : ""
                                }
                                config={{
                                  toolbar: [
                                    "heading",
                                    "|",
                                    "bold",
                                    "italic",
                                    "|",
                                    "bulletedList",
                                    "numberedList",
                                    "|",
                                    "link",
                                    "|",
                                    "undo",
                                    "redo",
                                  ],
                                  removePlugins: [
                                    "Image",
                                    "MediaEmbed",
                                    "Table",
                                    "CKFinder",
                                    "EasyImage",
                                    "BlockQuote",
                                  ],
                                }}
                                onChange={(event, editor) => {
                                  const data = editor.getData();
                                  const updated = [...testDetails];
                                  updated[index] = {
                                    ...updated[index],
                                    value: data,
                                  };
                                  setTestDetails(updated);
                                }}
                              />
                            ) : param.field_type === "image" ? (
                              <div className="">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {/* File Upload Button */}
                                  <label className="flex-1 cursor-pointer">
                                    <FormInput
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        const MAX_FILE_SIZE =
                                          data.fileSize * 1024 * 1024;
                                        if (file) {
                                          // Allowed types (same as AddOrganisation)
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
                                            "video/mp4",
                                          ];
                                          if (
                                            !allowedTypes.includes(file.type)
                                          ) {
                                            setParamErrors((prev) => ({
                                              ...prev,
                                              [param.id]: t(
                                                "Only PNG, JPG, JPEG, GIF, WEBP, BMP, SVG, TIFF, ICO, HEIC and mp4 are allowed."
                                              ),
                                            }));
                                            e.target.value = "";
                                            return;
                                          }
                                          if (file.size > MAX_FILE_SIZE) {
                                            setParamErrors((prev) => ({
                                              ...prev,
                                              [param.id]: `${t("exceed")} ${
                                                MAX_FILE_SIZE / (1024 * 1024)
                                              } MB.`,
                                            }));
                                            e.target.value = "";
                                            return;
                                          }
                                          setParamErrors((prev) => ({
                                            ...prev,
                                            [param.id]: "",
                                          }));
                                          const updated = [...testDetails];
                                          // When uploading a new file, clear any library selection
                                          updated[index] = {
                                            ...updated[index],
                                            file,
                                            fileName: undefined,
                                            value: undefined,
                                          };
                                          setTestDetails(updated);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <div className="w-full h-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {t("upload_new")}
                                      </span>
                                    </div>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedParamIndex(index);
                                      setIsMediaLibraryOpen(true);
                                    }}
                                    className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center gap-1 transition-all hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-2"
                                  >
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                      {t("existing")}
                                    </span>
                                  </button>
                                </div>

                                {(param.file || param.fileName) && (
                                  <div className="p-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 mt-2">
                                        <div className="p-1 bg-primary dark:bg-blue-900/30 rounded-md">
                                          {/* Icon here */}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-gray-600 dark:text-white">
                                            {param.file?.name || param.fileName}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {paramErrors[param.id] && (
                                  <div className="text-red-500 text-xs mt-1">
                                    {paramErrors[param.id]}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-red-500">
                                Unknown field type
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 border">
                            {param.normal_range}
                          </td>
                          <td className="px-4 py-2 border">{param.units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Schedule Visibility Section */}
                  <div className="mt-5">
                    <FormLabel className="font-bold">
                      {t("Whenshouldthis")}
                    </FormLabel>
                    <div className="flex items-center gap-4 mt-2 ml-2">
                      {/* Instant Option */}
                      <FormCheck>
                        <FormCheck.Input
                          id="instant"
                          type="radio"
                          value="now"
                          checked={showTimeOption === "now"}
                          onChange={() => {
                            setShowTimeOption("now");
                            setScheduledDate("");
                            setDelayMinutes("");
                          }}
                          className="form-radio"
                        />
                        <FormCheck.Label
                          htmlFor="instant"
                          className="font-normal ml-2"
                        >
                          {t("Instant")}
                        </FormCheck.Label>
                      </FormCheck>

                      {/* Schedule Option */}
                      <FormCheck>
                        <FormCheck.Input
                          id="schedule"
                          type="radio"
                          value="later"
                          checked={showTimeOption === "later"}
                          onChange={() => {
                            setShowTimeOption("later");
                            setDelayMinutes("");
                          }}
                          className="form-radio"
                        />
                        <FormCheck.Label
                          htmlFor="schedule"
                          className="font-normal ml-2"
                        >
                          {t("Schedule")}
                        </FormCheck.Label>
                      </FormCheck>

                      {/* Delay Option */}
                      <FormCheck>
                        <FormCheck.Input
                          id="delay"
                          type="radio"
                          value="delay"
                          checked={showTimeOption === "delay"}
                          onChange={() => {
                            setShowTimeOption("delay");
                            setScheduledDate("");
                          }}
                          className="form-radio"
                        />
                        <FormCheck.Label
                          htmlFor="delay"
                          className="font-normal ml-2"
                        >
                          {t("delay")}
                        </FormCheck.Label>
                      </FormCheck>
                    </div>

                    {/* Schedule Input */}
                    {showTimeOption === "later" && (
                      <div className="mt-3">
                        <FormLabel className="font-bold">
                          {t("select_date_time")}
                        </FormLabel>
                        <div className="w-full sm:w-64">
                          <FormInput
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e: { target: { value: string } }) => {
                              setScheduledDate(e.target.value);
                            }}
                            className="w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary"
                          />
                          {!scheduledDate && (
                            <p className="text-red-500 text-xs mt-1">
                              {t("Please select a date and time")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delay Dropdown */}
                    {showTimeOption === "delay" && (
                      <div className="mt-3">
                        <FormLabel className="font-bold">
                          {t("select_delay_minutes")}
                        </FormLabel>
                        <div className="w-full sm:w-40">
                          <select
                            value={delayMinutes}
                            onChange={(e) => setDelayMinutes(e.target.value)}
                            className="w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary"
                          >
                            <option value="">{t("Select minutes")}</option>
                            {Array.from({ length: 60 }, (_, i) => i + 1).map(
                              (minute) => (
                                <option key={minute} value={minute}>
                                  {minute} {t("minutes")}
                                </option>
                              )
                            )}
                          </select>
                          {!delayMinutes && (
                            <p className="text-red-500 text-xs mt-1">
                              {t("Please select delay minutes")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 text-right">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-42"
                      onClick={handleSubmit}
                      disabled={isSubmitDisabled}
                    >
                      {loading ? (
                        <div className="loader">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      ) : (
                        t("push_result")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewPatientDetails;
