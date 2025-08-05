import React, { useEffect, useState } from "react";
import {
  getInvestigationsAction,
  saveRequestedInvestigationsAction,
  getRequestedInvestigationsByIdAction,
  addInvestigationAction,
  getCategoryAction,
  updateCategoryAction,
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
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

interface FormData {
  category: string;
  test_name: string;
}

interface FormErrors {
  category: string;
  test_name: string;
}

interface UserData {
  uid: number;
  role: string;
  org_id: number;
}

const RequestInvestigations: React.FC<Props> = ({ data, onShowAlert }) => {
  const userEmail = localStorage.getItem("user") || "";
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
  const [loading2, setLoading2] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
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
  const [editCategoryErrors, setEditCategoryErrors] = useState({
    newCategoryName: "",
  });
  const [editCategoryModal, setEditCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{
    category: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));
      setUserId(userData.uid);
      setOrgId(userData.orgid);
      setUserRole(userData.role);

      const [allTests, savedResponse] = await Promise.all([
        getInvestigationsAction(),
        getRequestedInvestigationsByIdAction(data.id),
      ]);

      const savedData = savedResponse.data || [];

      setInvestigations(allTests);
      setSavedInvestigations(savedData);

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

  useEffect(() => {
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

  const fetchUser = async () => {
    const userData = await getAdminOrgAction(userEmail);
    setUserData({
      uid: userData.uid,
      role: userData.role,
      org_id: userData.organisation_id,
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
        formDataToSend.append("addedBy", formData.test_name);

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
          fetchData();
          onShowAlert({
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
        onShowAlert({
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
    setLoading2(false);
    try {
      setLoading2(true);

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
        onShowAlert({
          variant: "success",
          message: t("Nofacultiesfound"),
        });
        setTimeout(() => setShowAlert(null), 3000);
        return;
      }

      const superadminIds = superadmins.map((admin) => admin.id);

      await sendNotificationToFacultiesAction(facultiesIds, userId, payload);
      await saveRequestedInvestigationsAction(
        payload,
        facultiesIds,
        superadminIds
      );

      onShowAlert({
        variant: "success",
        message: t("Requestsentsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Save failed", err);

      onShowAlert({
        variant: "danger",
        message: t("Failedsendrequest"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading2(false);
    }
  };

  const renderCheckboxGroup = (category: string, tests: Investigation[]) => (
    <div key={category} className="mb-6 bg-gray-50 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm">
            {category}
          </span>
        </h3>
        {(userRole === "Admin" || userRole === "Superadmin") && (
          <button
            onClick={() => {
              fetchCategory();
              setCurrentCategory({ category });
              setNewCategoryName(category);
              setEditCategoryModal(true);
            }}
            className="text-primary hover:text-primary-800 transition-colors"
            title="Edit category"
          >
            <Lucide icon="CheckSquare" className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tests.map((test) => {
          const isChecked = selectedTests.some((t) => t.id === test.id);
          const isDisabled = userRole === "User" || userRole === "Observer";

          return (
            <div
              key={test.id}
              className={`flex items-center p-2 rounded-md ${
                isChecked
                  ? "bg-primary-50 border border-primary-200"
                  : "bg-white border border-gray-200"
              } ${
                isDisabled ? "opacity-60" : "hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => !isDisabled && toggleSelection(test)}
            >
              <FormCheck.Input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelection(test)}
                disabled={isDisabled}
                className="text-primary-600 form-checkbox rounded border-gray-300 mr-2"
              />
              <span
                className={`text-sm ${
                  isChecked ? "font-medium text-primary-800" : "text-gray-700"
                }`}
              >
                {test.test_name}
              </span>
            </div>
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
              disabled={(selectedTests.length === 0, loading2)}
            >
              {loading2 ? (
                <div className="loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                t("save_selected")
              )}
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

      <Dialog
        open={editCategoryModal}
        onClose={() => {
          setEditCategoryModal(false);
          setEditCategoryErrors({ newCategoryName: "" });
        }}
      >
        <Dialog.Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("EditCategory")}</h2>
            <button
              onClick={() => {
                setEditCategoryModal(false);
                setEditCategoryErrors({ newCategoryName: "" });
              }}
            >
              <Lucide icon="X" className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="mb-4">
            <FormInput
              id="edit-category-name"
              type="text"
              className={`w-full ${
                editCategoryErrors.newCategoryName ? "border-danger" : ""
              }`}
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                if (editCategoryErrors.newCategoryName) {
                  setEditCategoryErrors({ newCategoryName: "" });
                }
              }}
              placeholder="Enter new category name"
            />
            {editCategoryErrors.newCategoryName && (
              <p className="text-danger text-sm mt-1">
                {editCategoryErrors.newCategoryName}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setEditCategoryModal(false);
                setEditCategoryErrors({ newCategoryName: "" });
              }}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                // Validate
                if (!newCategoryName.trim()) {
                  setEditCategoryErrors({
                    newCategoryName: t("Categorynamerequired"),
                  });
                  return;
                }

                if (!isValidInput(newCategoryName)) {
                  setEditCategoryErrors({
                    newCategoryName: t("Invalidcategoryname"),
                  });
                  return;
                }

                try {
                  await updateCategoryAction(
                    currentCategory!.category,
                    newCategoryName
                  );

                  // Update local state
                  const updatedInvestigations = investigations.map((item) =>
                    item.category === currentCategory!.category
                      ? { ...item, category: newCategoryName }
                      : item
                  );

                  setInvestigations(updatedInvestigations);

                  const updatedGroupedTests = { ...groupedTests };
                  if (updatedGroupedTests[currentCategory!.category]) {
                    updatedGroupedTests[newCategoryName] =
                      updatedGroupedTests[currentCategory!.category];
                    delete updatedGroupedTests[currentCategory!.category];
                    setGroupedTests(updatedGroupedTests);
                  }

                  setCatoriesData(
                    catoriesData.map((cat) =>
                      cat.category === currentCategory!.category
                        ? { category: newCategoryName }
                        : cat
                    )
                  );

                  setEditCategoryModal(false);
                  onShowAlert({
                    variant: "success",
                    message: t("sucessupdatecategory"),
                  });
                } catch (error) {
                  onShowAlert({
                    variant: "danger",
                    message: t("Failedupdatecategory"),
                  });
                }
              }}
            >
              {t("SaveChanges")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default RequestInvestigations;
