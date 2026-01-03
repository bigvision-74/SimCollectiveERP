import React, { useEffect, useState, useRef } from "react";
import {
  getAllInvestigationsAction,
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
  FormSelect,
} from "@/components/Base/Form";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import Lucide from "@/components/Base/Lucide";
import { isValidInput } from "@/helpers/validation";
import {
  getAdministratorsAction,
  getSuperadminsAction,
} from "@/actions/userActions";
import { useAppContext } from "@/contexts/sessionContext";
import { io, Socket } from "socket.io-client";
import { useSocket } from "@/contexts/SocketContext";

interface Investigation {
  id: number;
  name: string;
  status: string | null;
  addedBy: string | null;
  category?: string;
  test_name?: string;
}

interface Category {
  id: number;
  name: string;
  status: string | null;
  addedBy: string | null;
  investigations: Investigation[];
}

interface SavedInvestigation {
  category: string;
  testName: string;
  status: string;
}

interface Props {
  data: { id: number; name?: string };
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted" | "requested"
  ) => void;
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

const RequestInvestigations: React.FC<Props> = ({
  data,
  onShowAlert,
  onDataUpdate,
}) => {
  const userEmail = localStorage.getItem("user") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTests, setSelectedTests] = useState<Investigation[]>([]);

  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [savedInvestigations, setSavedInvestigations] = useState<
    SavedInvestigation[]
  >([]);
  const socket = useRef<Socket | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [catoriesData, setCatoriesData] = useState<{ category: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { sessionInfo } = useAppContext();
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

  const { triggerPatientUpdate, getPatientZone, globalSession } =
    useSocket() || {};

  const fetchData = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));

      setUserId(userData.uid);
      setOrgId(userData.orgid);
      setUserRole(userData.role);

      const [apiResponse, savedResponse] = await Promise.all([
        getAllInvestigationsAction(),
        getRequestedInvestigationsByIdAction(data.id, userData.orgid),
      ]);

      const categoriesList = Array.isArray(apiResponse)
        ? apiResponse
        : apiResponse.data || [];

      const savedData = savedResponse.data || [];

      // Update state with the array, not the wrapper object
      setCategories(categoriesList);
      setSavedInvestigations(savedData);

      const preSelected: Investigation[] = [];

      // FIX: Use categoriesList here instead of apiResponse
      if (Array.isArray(categoriesList)) {
        categoriesList.forEach((cat: Category) => {
          if (cat.investigations && Array.isArray(cat.investigations)) {
            cat.investigations.forEach((test) => {
              const isSaved = savedData.some(
                (saved: SavedInvestigation) =>
                  saved.category === cat.name && saved.testName === test.name
              );

              if (isSaved) {
                preSelected.push({
                  ...test,
                  category: cat.name,
                  test_name: test.name,
                });
              }
            });
          }
        });
      }

      setSelectedTests(preSelected);
    } catch (err) {
      console.error("Fetch failed", err);
      // Prevent map error on failure
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [data.id]);

  const toggleSelection = (test: Investigation, categoryName: string) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.id === test.id);
      if (exists) {
        return prev.filter((t) => t.id !== test.id);
      } else {
        // Add properties needed for saving
        return [
          ...prev,
          {
            ...test,
            category: categoryName,
            test_name: test.name, // Map API 'name' to 'test_name' for compatibility
          },
        ];
      }
    });
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
    const { name, value } = target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
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
        const createCourse = await addInvestigationAction({
          category: formData.category,
          test_name: formData.test_name,
        });

        if (createCourse) {
          setFormData({ category: "", test_name: "" });
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
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    socket.current = io("wss://sockets.mxr.ai:5000", {
      transports: ["websocket"],
    });
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const handleSave = async () => {
    if (!userId || selectedTests.length === 0) return;
    setLoading2(false);
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setLoading2(true);

      // selectedTests now contains { category, test_name } thanks to toggleSelection
      const payload = selectedTests.map((test) => ({
        patient_id: data.id,
        request_by: userId,
        category: test.category!, // Assured by toggleSelection
        test_name: test.test_name || test.name, // Fallback
        status: "pending",
        organisation_id: userData.orgid,
        session_id: sessionInfo.sessionId,
      }));

      const facultiesIds = await getFacultiesByIdAction(Number(orgId));
      const superadmins = await getSuperadminsAction();
      const administrators = await getAdministratorsAction();

      if (!facultiesIds || facultiesIds.length === 0) {
        onShowAlert({ variant: "success", message: t("Nofacultiesfound") });
        setTimeout(() => setShowAlert(null), 3000);
        return;
      }

      const superadminIds = superadmins.map((admin) => admin.id);
      const administratorIds = administrators.map((admin) => admin.id);

      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToFacultiesAction(
          facultiesIds,
          userId,
          sessionInfo.sessionId,
          payload
        );
      }

      const result = await saveRequestedInvestigationsAction(
        payload,
        facultiesIds,
        superadminIds,
        administratorIds,
        Number(sessionInfo.sessionId)
      );

      if (result.success) {
        if (result.insertedCount === 0) {
          onShowAlert({ variant: "success", message: t("Alreadyrequested") });
        } else {
          onShowAlert({
            variant: "success",
            message: t("Requestsentsuccessfully"),
          });
        }

        if (triggerPatientUpdate) {
          let targetRoom = getPatientZone ? getPatientZone(data.id) : null;

          if (!targetRoom && globalSession?.assignedRoom) {
            if (globalSession.assignedRoom !== "all") {
              targetRoom = String(globalSession.assignedRoom);
            }
          }

          triggerPatientUpdate({
            patientId: data.id,
            patientName: data.name || "Patient",
            assignedRoom: targetRoom || "all",
            category: "Investigation",
            action: "requested",
          });
        }
      } else {
        onShowAlert({
          variant: "danger",
          message: result.message || t("Failedsendrequest"),
        });
      }
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Save failed", err);
      onShowAlert({ variant: "danger", message: t("Failedsendrequest") });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading2(false);
    }
  };

  // --- 5. Updated Render Function ---
  // Accepts the full Category object now
  const renderCheckboxGroup = (categoryItem: Category) => (
    <div key={categoryItem.id}>
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm">
            {categoryItem.name}
          </span>
        </h3>
        {(userRole === "Admin" || userRole === "Superadmin") && (
          <button
            onClick={() => {
              fetchCategory();
              setCurrentCategory({ category: categoryItem.name });
              setNewCategoryName(categoryItem.name);
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
        {categoryItem.investigations.map((test) => {
          const isChecked = selectedTests.some((t) => t.id === test.id);
          const isDisabled = userRole === "Observer";
          const isLocked = isDisabled || isChecked;

          return (
            <div
              key={test.id}
              className={`flex items-center p-2 rounded-md ${
                isChecked
                  ? "bg-primary-50 border border-primary-200"
                  : "bg-white border border-gray-200"
              } ${
                isLocked
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() =>
                !isLocked && toggleSelection(test, categoryItem.name)
              }
            >
              <FormCheck.Input
                type="checkbox"
                checked={isChecked}
                disabled={isLocked}
                className="text-primary-600 form-checkbox rounded border-gray-300 mr-2"
                onClick={(e) => e.stopPropagation()}
              />

              <span
                className={`text-sm ${
                  isChecked ? "font-medium text-primary-800" : "text-gray-700"
                }`}
              >
                {test.name}
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
      setCatoriesData(response);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {showAlert && <Alerts data={showAlert} />}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("request_investigations")}
          </h2>
        </div>

        {/* Updated Main Render Loop */}
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((categoryItem) => renderCheckboxGroup(categoryItem))
        ) : (
          <div className="text-gray-500 text-center py-4">
            {/* Optional: Show a loading state or 'No data' message */}
            {loading ? "Loading..." : "No investigations found."}
          </div>
        )}

        <div className="mt-6">
          <Button
            className="bg-primary text-white"
            onClick={handleSave}
            disabled={selectedTests.length === 0 || loading2}
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
      </div>

      {/* ... Modals remain largely unchanged ... */}
      <Dialog size="xl" open={superlargeModalSizePreview} onClose={handleClose}>
        <Dialog.Panel className="p-10">
          {/* ... Add Investigation Form (Same as before) ... */}
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

                  // Update local state - categories array
                  const updatedCategories = categories.map((cat) =>
                    cat.name === currentCategory!.category
                      ? { ...cat, name: newCategoryName }
                      : cat
                  );
                  setCategories(updatedCategories);

                  // Also update catoriesData (used in dropdown)
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
