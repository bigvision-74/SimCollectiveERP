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
import Litepicker from "@/components/Base/Litepicker";
import { useAppContext } from "@/contexts/sessionContext";

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
}

function ViewPatientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<TestParameter[]>([]);
  const [categories, setCatories] = useState<InvestigationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { sessionInfo } = useAppContext();
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { addTask, updateTask } = useUploads();

  // ✅ New states for scheduling
  const [scheduledDate, setScheduledDate] = useState("");
  const [showTimeOption, setShowTimeOption] = useState("now");

  const fetchPatient = async () => {
    try {
      const PatientRequest = await getPatientRequestsAction(Number(id));
      setCatories(PatientRequest);

      return PatientRequest;
    } catch (error) {
      console.error("Error fetching patient", error);
      return [];
    }
  };

  const getInvestigationParamsById = async (id: number) => {
    try {
      const data = await getInvestigationParamsAction(id);
      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    setLoading(true);

    try {
      const userID = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userID));
      const submittedBy = userData?.uid;

      const superadmins = await getSuperadminsAction();
      const superadminIds = superadmins.map((admin) => admin.id);

      const finalPayload = [];

      for (const param of testDetails) {
        let valueToSave = param.value || "";
        let imageUploadedUrl = "";

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

            imageUploadedUrl = presignedData.url;
            valueToSave = imageUploadedUrl;
          } catch (uploadErr) {
            console.error(
              `Image upload failed for parameter ${param.id}:`,
              uploadErr
            );
          }
        }

        finalPayload.push({
          investigation_id: param.investigation_id,
          patient_id: id,
          parameter_id: param.id,
          value: valueToSave,
          submitted_by: submittedBy,
          scheduled_date: showTimeOption === "now" ? null : scheduledDate,
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
            // await sendNotificationToAdminAction(
            //   selectedTest.request_by,
            //   selectedTest.patient_name || "patient"
            // );
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

    // restore selected tab from localStorage
    const savedTab = localStorage.getItem("selectedPick");
    if (savedTab) {
    }
  }, []);

  // const isSubmitDisabled =
  //   loading ||
  //   !testDetails?.every((param) =>
  //     param.field_type === "image"
  //       ? param.file instanceof File
  //       : String(param.value ?? "").trim()
  //   );
  const isSubmitDisabled =
    loading ||
    !testDetails?.every((param) =>
      param.field_type === "image"
        ? param.file instanceof File
        : String(param.value ?? "").trim()
    ) ||
    (showTimeOption === "later" && !scheduledDate);

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patient_report")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
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
          <div className="p-5 rounded-md box">
            {selectedTest && testDetails?.length > 0 && (
              <div className="p-4 rounded-lg bg-white">
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
                            ) : param.field_type === "image" ? (
                              <FormInput
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const updated = [...testDetails];
                                    updated[index] = {
                                      ...updated[index],
                                      file,
                                    };
                                    setTestDetails(updated);
                                  }
                                }}
                              />
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
                      <FormCheck>
                        <FormCheck.Input
                          id="instant"
                          type="radio"
                          value="now"
                          checked={showTimeOption === "now"}
                          onChange={() => {
                            setShowTimeOption("now");
                            setScheduledDate("");
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

                      <FormCheck>
                        <FormCheck.Input
                          id="Schedule"
                          type="radio"
                          value="later"
                          checked={showTimeOption === "later"}
                          onChange={() => setShowTimeOption("later")}
                          className="form-radio"
                        />
                        <FormCheck.Label
                          htmlFor="Schedule"
                          className="font-normal ml-2"
                        >
                          {t("Schedule")}
                        </FormCheck.Label>
                      </FormCheck>
                    </div>
                    {showTimeOption === "later" && (
                      <div className="mt-3">
                        <FormLabel className="font-bold">
                          {t("select_date_time")}
                        </FormLabel>
                        <div className="w-full sm:w-64">
                          {" "}
                          <FormInput
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e: { target: { value: string } }) => {
                              setScheduledDate(e.target.value);
                            }}
                            className="w-full rounded-lg text-xs sm:text-sm border-gray-200 focus:ring-1 focus:ring-primary"
                          />
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
