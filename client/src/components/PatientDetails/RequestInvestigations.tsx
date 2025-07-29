import React, { useEffect, useState } from "react";
import {
  getInvestigationsAction,
  saveRequestedInvestigationsAction,
  getRequestedInvestigationsByIdAction,
  addInvestigationAction,
  getCategoryAction,
} from "@/actions/patientActions";
import {
  getAdminOrgAction,
  getFacultiesByIdAction,
} from "@/actions/adminActions";
import { sendNotificationToFacultiesAction } from "@/actions/notificationActions";
import {
  FormInput,
  FormCheck,
  FormLabel,
  FormTextarea,
  FormSelect,
} from "@/components/Base/Form";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import { isValidInput } from "@/helpers/validation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getSuperadminsAction } from "@/actions/userActions";

interface Investigation {
  id: number;
  category: string;
  test_name: string;
  status: string;
}

interface SavedInvestigation {
  category: string;
  testName: string;
  status: string;
}

interface Props {
  data: { id: number };
}

interface FormData {
  category: string;
  test_name: string;
}

interface FormErrors {
  category: string;
  test_name: string;
}

const RequestInvestigations: React.FC<Props> = ({ data }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [groupedTests, setGroupedTests] = useState<
    Record<string, Investigation[]>
  >({});
  const [selectedTests, setSelectedTests] = useState<Investigation[]>([]);
  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [savedInvestigations, setSavedInvestigations] = useState<
    SavedInvestigation[]
  >([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [catoriesData, setCatoriesData] = useState<{ category: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    category: "",
    test_name: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    category: "",
    test_name: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));
        console.log(userData, "userDatauserData");
        setUserId(userData.uid);
        setOrgId(userData.orgid);
        setUserRole(userData.role);

        const [allTests, savedResponse] = await Promise.all([
          getInvestigationsAction(),
          getRequestedInvestigationsByIdAction(data.id),
        ]);

        const savedData = savedResponse.data || [];
        // setSavedInvestigations(savedData);

        setInvestigations(allTests);
        setSavedInvestigations(savedData || []);

        const preSelected = allTests.filter(
          (test: { category: any; test_name: any }) =>
            savedData.some(
              (saved: { category: any; testName: any }) =>
                saved.category === test.category &&
                saved.testName === test.test_name
            )
        );
        setSelectedTests(preSelected);

        const grouped: Record<string, Investigation[]> = {};
        allTests.forEach((item: Investigation) => {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        });
        setGroupedTests(grouped);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchData();
  }, [data.id]);

  const toggleSelection = (test: Investigation) => {
    setSelectedTests((prev) =>
      prev.find((t) => t.id === test.id)
        ? prev.filter((t) => t.id !== test.id)
        : [...prev, test]
    );
  };

  const handleClose = () => {
    setFormData({
      category: "",
      test_name: "",
    });

    setFormErrors({
      category: "",
      test_name: "",
    });

    setShowCustomCategoryInput(false);
    setSuperlargeModalSizePreview(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name, value, type } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = (): Partial<FormErrors> => {
    const errors: Partial<FormErrors> = {};

    if (!formData.category || formData.category === "") {
      errors.category = t("SelectOneCategory");
    }

    if (!formData.test_name) {
      errors.test_name = t("InvestigationTitle");
    } else if (!isValidInput(formData.test_name)) {
      errors.test_name = t("invalidInput");
    }

    setFormErrors(errors as FormErrors);
    return errors;
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    const errors = validateForm();
    setFormErrors(errors as FormErrors);

    const hasErrors = Object.values(errors).some(
      (error) =>
        error !== "" &&
        (!Array.isArray(error) || error.some((msg) => msg !== ""))
    );
    if (!hasErrors) {
      setLoading(true);
      try {
        const formDataToSend = new FormData();

        formDataToSend.append("category", formData.category);
        formDataToSend.append("test_name", formData.test_name);

        const createCourse = await addInvestigationAction({
          category: formData.category,
          test_name: formData.test_name,
        });

        if (createCourse) {
          setFormData({
            category: "",
            test_name: "",
          });
          setSelectedTests([]);
          setSuperlargeModalSizePreview(false);
          window.scrollTo({ top: 0, behavior: "smooth" });

          setShowAlert({
            variant: "success",
            message: t("investicationsuccess"),
          });
          setTimeout(() => {
            setShowAlert(null);
          }, 3000);
        }
      } catch (error) {
        setSuperlargeModalSizePreview(false);

        window.scrollTo({ top: 0, behavior: "smooth" });
        setShowAlert({
          variant: "danger",
          message: t("investicationfailed"),
        });
        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
        // onAction(t("moduleAddError"), "danger");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!userId || selectedTests.length === 0) return;

    try {
      const payload = selectedTests.map((test) => ({
        patient_id: data.id,
        request_by: userId,
        category: test.category,
        test_name: test.test_name,
        status: "pending",
      }));

      const facultiesIds = await getFacultiesByIdAction(Number(orgId));
      const superadmins = await getSuperadminsAction();

      if (!facultiesIds || facultiesIds.length === 0) {
        setShowAlert({
          variant: "success",
          message:
            "No faculties found. Please create faculty to receive notifications.",
        });
        setTimeout(() => setShowAlert(null), 3000);
        return;
      }

      const superadminIds = superadmins.map((admin) => admin.id);
      
      await sendNotificationToFacultiesAction(facultiesIds, userId, payload);
      await saveRequestedInvestigationsAction(payload,facultiesIds,superadminIds);

      setShowAlert({
        variant: "success",
        message: "Request sent successfully",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Save failed", err);

      setShowAlert({
        variant: "danger",
        message: "Failed to send request. Try again.",
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const renderCheckboxGroup = (category: string, tests: Investigation[]) => (
    <div key={category} className="mb-6">
      <h3 className="font-semibold border-b pb-1 mb-3 text-gray-700">
        {category}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tests.map((test) => {
          const isChecked = selectedTests.some((t) => t.id === test.id);
          const isDisabled = userRole === "User" || userRole === "Observer";

          return (
            <FormLabel
              key={test.id}
              className={`flex items-center space-x-2 text-sm ${
                isDisabled ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <FormCheck.Input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelection(test)}
                disabled={isDisabled}
                className="text-primary-600 form-checkbox rounded border-gray-300"
              />
              <span>{test.test_name}</span>
            </FormLabel>
          );
        })}
      </div>
    </div>
  );

  const fetchCategory = async () => {
    try {
      const response = await getCategoryAction();
      console.log(response, "response");
      setCatoriesData(response);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  return (
    <>
      <div className="space-y-6 p-4 bg-white rounded shadow">
        {showAlert && <Alerts data={showAlert} />}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("request_investigations")}
          </h2>

          {(userRole === "Admin" || userRole === "Superadmin") && (
            <Button
              className="bg-primary text-white"
              onClick={() => {
                fetchCategory();
                setSuperlargeModalSizePreview(true);
              }}
            >
              {t("add_Investigation")}
            </Button>
          )}
        </div>

        {Object.entries(groupedTests).map(([category, tests]) =>
          renderCheckboxGroup(category, tests)
        )}

        {userRole !== "User" && (
          <div className="mt-6">
            <Button
              className="bg-primary text-white"
              onClick={handleSave}
              disabled={selectedTests.length === 0}
            >
              {t("save_selected")}
            </Button>
          </div>
        )}
      </div>

      <Dialog
        size="xl"
        open={superlargeModalSizePreview}
        onClose={() => {
          setFormData({
            category: "",
            test_name: "",
          });
          setFormErrors({
            category: "",
            test_name: "",
          });
          setSuperlargeModalSizePreview(false);
        }}
      >
        <Dialog.Panel className="p-10">
          <>
            <a
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                handleClose();
                setSuperlargeModalSizePreview(false);
              }}
              className="absolute top-0 right-0 mt-3 mr-3"
            >
              <Lucide icon="X" className="w-6 h-6 text-slate-400" />
            </a>
            <div className="col-span-12 intro-y lg:col-span-8 box mt-3">
              <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
                <h2 className="mr-auto text-base font-medium">
                  {t("add_Investigation")}
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <FormLabel
                    htmlFor="category"
                    className="font-bold videoModuleName"
                  >
                    {t("Category")}
                  </FormLabel>
                </div>

                {/* Dropdown */}
                {/* <FormSelect
                  id="category"
                  name="category"
                  className={`w-full mb-2 form-select ${clsx({
                    "border-danger": formErrors.category,
                  })}`}
                  value={formData.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "other") {
                      setShowCustomCategoryInput(true);
                      setFormData({ ...formData, category: "" });
                    } else {
                      setShowCustomCategoryInput(false);
                      setFormData({ ...formData, category: value });
                    }
                  }}
                >
                  <option value="">{t("SelectCategory")}</option>
                  {catoriesData &&
                    catoriesData.map((item, index) => (
                      <option key={index} value={item.category}>
                        {item.category}
                      </option>
                    ))}
                  <option value="other">{t("Other")}</option>
                </FormSelect> */}

                <FormSelect
                  id="category"
                  name="category"
                  className={`w-full mb-2 form-select ${clsx({
                    "border-danger": formErrors.category,
                  })}`}
                  value={showCustomCategoryInput ? "other" : formData.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "other") {
                      setShowCustomCategoryInput(true);
                      setFormData({ ...formData, category: "" });
                    } else {
                      setShowCustomCategoryInput(false);
                      setFormData({ ...formData, category: value });
                    }
                    setFormErrors((prev) => ({ ...prev, category: "" }));
                  }}
                >
                  <option value="">{t("SelectCategory")}</option>
                  {catoriesData &&
                    catoriesData.map((item, index) => (
                      <option key={index} value={item.category}>
                        {item.category}
                      </option>
                    ))}
                  <option value="other">{t("Other")}</option>
                </FormSelect>
                {/* Show this input only when "Other" is selected */}
                {showCustomCategoryInput && (
                  <FormInput
                    type="text"
                    name="category"
                    placeholder={t("EnterCategory")}
                    className={`w-full mb-2 ${clsx({
                      "border-danger": formErrors.category,
                    })}`}
                    value={formData.category}
                    onChange={handleInputChange}
                  />
                )}

                {formErrors.category && (
                  <p className="text-red-500 text-sm">{formErrors.category}</p>
                )}

                <div className="flex items-center justify-between mt-5">
                  <FormLabel
                    htmlFor="crud-form-2"
                    className="font-bold videoModuleName"
                  >
                    {t("Investigation_title")}
                  </FormLabel>
                </div>
                <FormInput
                  id="crud-form-2"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.test_name,
                  })}`}
                  name="test_name"
                  placeholder={t("Entertitle")}
                  value={formData.test_name}
                  onChange={handleInputChange}
                />
                {formErrors.test_name && (
                  <p className="text-red-500 text-sm">{formErrors.test_name}</p>
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
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default RequestInvestigations;
