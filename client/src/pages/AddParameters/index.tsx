import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import clsx from "clsx";
import { t } from "i18next";
import {
  getCategoryAction,
  getInvestigationsAction,
  saveParamtersAction,
  deleteParamsAction,
  addInvestigationAction,
  getInvestigationParamsAction,
} from "@/actions/patientActions";
import { Dialog } from "@/components/Base/Headless";
import { getAdminOrgAction } from "@/actions/adminActions";
import Lucide from "@/components/Base/Lucide";
import { isValidInput } from "@/helpers/validation";
import { getUserOrgIdAction } from "@/actions/userActions";

// --- Interfaces ---

interface Investigation {
  id: number | string;
  name: string;
  category: string;
  status?: string;
  added_by?: number | null;
  organisation_id?: number | null;
  role?: string | null;
}

interface TestParameter {
  id: number;
  investigation_id: number;
  name: string;
  normal_range: string;
  units: string;
  added_by?: number | null;
  organisation_id?: number | null;
  role?: string | null;
}

interface UserData {
  uid: number;
  role: string;
  org_id: number;
}

interface Category {
  id: string | number;
  name: string;
  status?: string;
  addedBy?: string;
}

interface ComponentProps {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

// --- Main Component ---

const Main: React.FC<ComponentProps> = ({ onShowAlert }) => {
  // --- State ---
  const [loading2, setLoading2] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [testParameters, setTestParameters] = useState<TestParameter[]>([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [paramId, setParamId] = useState<number | null>(null);
  const [currentInvestigation, setCurrentInvestigation] =
    useState<Investigation | null>(null);

  const initialFormData = {
    title: "",
    normal_range: "",
    units: "",
    category_2: "",
    test_name: "",
    field_type: "",
    newCategory: "",
    newTestName: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const initialErrors = {
    title: "",
    normal_range: "",
    units: "",
    category_2: "",
    test_name: "",
    field_type: "",
    newCategory: "",
    newTestName: "",
  };

  const [errors, setErrors] = useState(initialErrors);

  // --- Helpers ---

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // --- API Calls ---

  const fetchInitialData = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      if (userEmail) {
        const uData = await getAdminOrgAction(userEmail);
        setUserData({
          uid: uData.uid,
          role: uData.role,
          org_id: uData.organisation_id,
        });
      }

      const categoryData = await getCategoryAction();
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      onShowAlert({
        variant: "danger",
        message: "Failed to load initial data. Please try again.",
      });
    }
  };

  const fetchInvestigations = async (categoryId: string) => {
    try {
      const investigationData = await getInvestigationsAction(categoryId);
      setInvestigations(investigationData);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
      setInvestigations([]);
      onShowAlert({
        variant: "danger",
        message: "Failed to load investigations.",
      });
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- Handlers ---

  const handleCategoryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCategory = e.target.value;
    const isNewCategory = selectedCategory === "add_new";

    setFormData((prev) => ({
      ...prev,
      category_2: selectedCategory,
      test_name: isNewCategory ? "add_new" : "",
      newCategory: "",
      newTestName: "",
    }));

    setErrors((prev) => ({ ...prev, category_2: "", test_name: "" }));

    if (selectedCategory && !isNewCategory) {
      await fetchInvestigations(selectedCategory);
    } else {
      setInvestigations([]);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...initialErrors };

    if (!formData.title.trim()) newErrors.title = t("Titlerequired");
    if (!formData.normal_range.trim())
      newErrors.normal_range = t("NormalRangerequired");
    if (!formData.units.trim()) newErrors.units = t("Unitsrequired");
    if (!formData.field_type.trim())
      newErrors.field_type = t("FieldTyperequired");

    // Validate Category
    if (formData.category_2 === "add_new") {
      if (!formData.newCategory.trim()) {
        newErrors.newCategory = t("NewCategoryRequired");
        isValid = false;
      } else if (!isValidInput(formData.newCategory)) {
        newErrors.newCategory = t("invalidInput");
        isValid = false;
      }
    } else if (!formData.category_2) {
      newErrors.category_2 = t("Categoryrequired");
      isValid = false;
    }

    // Validate Investigation
    if (formData.test_name === "add_new") {
      if (!formData.newTestName.trim()) {
        newErrors.newTestName = t("NewInvestigationRequired");
        isValid = false;
      } else if (!isValidInput(formData.newTestName)) {
        newErrors.newTestName = t("invalidInput");
        isValid = false;
      }
    } else if (!formData.test_name) {
      newErrors.test_name = t("Investigationrequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading2(true);

    try {
      // 1. Auth Check
      if (!userData || !userData.uid) {
        onShowAlert({
          variant: "danger",
          message:
            "User session not found. Please refresh the page and try again.",
        });
        setLoading2(false);
        return;
      }

      const isNewCategory = formData.category_2 === "add_new";
      const isNewTest = formData.test_name === "add_new";
      const isNewEntry = isNewCategory || isNewTest;

      let finalCategoryId: string | number = "";
      let finalInvestigationId: string | number = "";

      // ---------------------------------------------------------
      // Step 1: Handle New Category / Investigation Creation
      // ---------------------------------------------------------
      if (isNewEntry) {
        let creationCategoryName = "";
        let creationTestName = "";

        // Resolve Category Name
        if (isNewCategory) {
          creationCategoryName = formData.newCategory.trim();
        } else {
          // Careful: formData.category_2 is an ID here
          const selectedCat = categories.find(
            (c) => String(c.id) === String(formData.category_2)
          );
          creationCategoryName = selectedCat ? selectedCat.name : "";
        }

        // Resolve Test Name
        if (isNewTest) {
          creationTestName = formData.newTestName.trim();
        } else {
          // Careful: formData.test_name is an ID here
          const selectedInv = investigations.find(
            (i) => String(i.id) === String(formData.test_name)
          );
          creationTestName = selectedInv ? selectedInv.name : "";
        }

        // --- SAFE DUPLICATE CHECK ---
        if (!isNewCategory) {
          const isDuplicate = investigations.some((inv) => {
            // Ensure fields are strings before lowercasing
            const currentCat = String(inv.category || "").toLowerCase();
            const currentName = String(inv.name || "").toLowerCase();
            const newCat = String(creationCategoryName || "").toLowerCase();
            const newName = String(creationTestName || "").toLowerCase();

            return currentCat === newCat && currentName === newName;
          });

          if (isDuplicate) {
            onShowAlert({
              variant: "danger",
              message: "This investigation already exists for this category.",
            });
            setLoading2(false);
            return;
          }
        }

        // Prepare Payload
        const investigationPayload: any = {
          category: creationCategoryName,
          test_name: creationTestName,
          addedBy: userData.uid,
        };

        if (isNewCategory)
          investigationPayload.category_added_by = userData.uid;
        if (isNewTest || isNewCategory)
          investigationPayload.investigation_added_by = userData.uid;

        // Call API
        const response = await addInvestigationAction(investigationPayload);

        if (response && response.categoryId && response.investigationId) {
          finalCategoryId = response.categoryId;
          finalInvestigationId = response.investigationId;
        } else {
          throw new Error(
            "Failed to create new investigation. IDs were not returned."
          );
        }
      } else {
        // ---------------------------------------------------------
        // Step 2: Handle Existing Selection
        // ---------------------------------------------------------
        finalCategoryId = formData.category_2;
        finalInvestigationId = formData.test_name;
      }

      // ---------------------------------------------------------
      // Step 3: Save Parameters
      // ---------------------------------------------------------
      const paramPayload = new FormData();
      paramPayload.append("title", formData.title);
      paramPayload.append("normal_range", formData.normal_range);
      paramPayload.append("units", formData.units);
      paramPayload.append("field_type", formData.field_type);

      paramPayload.append("category", String(finalCategoryId));
      paramPayload.append("test_name", String(finalInvestigationId));
      paramPayload.append("addedBy", String(userData.uid));

      await saveParamtersAction(paramPayload);

      onShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
      });

      setFormData(initialFormData);
      setInvestigations([]);
      setErrors(initialErrors);
      fetchInitialData();
    } catch (error) {
      console.error("Save failed:", error);
      onShowAlert({
        variant: "danger",
        message: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading2(false);
    }
  };
  const delParameters = async () => {
    if (!paramId) return;
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      const res = await deleteParamsAction(paramId.toString(), data1.id);
      if (res && currentInvestigation) {
        const params = await getInvestigationParamsAction(
          Number(currentInvestigation.id)
        );
        setTestParameters(params);
      }
      setDeleteConfirmationModal(false);
      onShowAlert({
        variant: "success",
        message: "Parameters deleted successfully",
      });
    } catch (error) {
      onShowAlert({
        variant: "danger",
        message: "Error in deleting parameters",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 p-2">
        <div className="w-full">
          <div className="col-span-12 intro-y lg:col-span-8">
            <div className="intro-y">
              {/* Category Select */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="category_2"
                  className="font-bold flex justify-between"
                >
                  {t("Category")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormSelect
                  id="category_2"
                  name="category_2"
                  value={formData.category_2}
                  onChange={handleCategoryChange}
                  className={clsx({ "border-danger": errors.category_2 })}
                >
                  <option value="">{t("select_category")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="add_new">{t("Add New Category...")}</option>
                </FormSelect>
                {errors.category_2 && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.category_2}
                  </p>
                )}

                {formData.category_2 === "add_new" && (
                  <div className="mb-5 mt-2">
                    <FormInput
                      type="text"
                      id="newCategory"
                      name="newCategory"
                      value={formData.newCategory}
                      onChange={handleInputChange}
                      className={clsx({ "border-danger": errors.newCategory })}
                      placeholder={t("Enter new category name")}
                    />
                    {errors.newCategory && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.newCategory}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Investigation Select or Input */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="test_name"
                  className="font-bold flex justify-between"
                >
                  {t("Investigation")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>

                {/* If Category is NEW, we hide the Select and force New Input */}
                {formData.category_2 === "add_new" ? (
                  <div className="mb-5 mt-2">
                    <p className="text-xs text-slate-500 mb-2">
                      {t(
                        "Since you are adding a new category, please enter a new investigation name."
                      )}
                    </p>
                    <FormInput
                      type="text"
                      id="newTestName"
                      name="newTestName"
                      value={formData.newTestName}
                      onChange={handleInputChange}
                      className={clsx({ "border-danger": errors.newTestName })}
                      placeholder={t("Enter new investigation name")}
                    />
                    {errors.newTestName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.newTestName}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <FormSelect
                      id="test_name"
                      name="test_name"
                      value={formData.test_name}
                      onChange={handleInputChange}
                      disabled={!formData.category_2}
                      className={clsx({ "border-danger": errors.test_name })}
                    >
                      <option value="">{t("select_test")}</option>
                      {investigations.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name}
                        </option>
                      ))}
                      <option value="add_new">
                        {t("Add New Investigation...")}
                      </option>
                    </FormSelect>
                    {errors.test_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.test_name}
                      </p>
                    )}

                    {formData.test_name === "add_new" && (
                      <div className="mb-5 mt-2">
                        <FormInput
                          type="text"
                          id="newTestName"
                          name="newTestName"
                          value={formData.newTestName}
                          onChange={handleInputChange}
                          className={clsx({
                            "border-danger": errors.newTestName,
                          })}
                          placeholder={t("Enter new investigation name")}
                        />
                        {errors.newTestName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.newTestName}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Field Type */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="field_type"
                  className="font-bold flex justify-between"
                >
                  {t("FieldType")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormSelect
                  id="field_type"
                  name="field_type"
                  value={formData.field_type}
                  onChange={handleInputChange}
                  className={clsx({ "border-danger": errors.field_type })}
                >
                  <option value="">{t("select_field_type")}</option>
                  <option value="text">{t("Text")}</option>
                  <option value="image">{t("File")}</option>
                  <option value="textarea">{t("textarea")}</option>
                </FormSelect>
                {errors.field_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.field_type}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="title"
                  className="font-bold flex justify-between"
                >
                  {t("Title")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormInput
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={clsx({ "border-danger": errors.title })}
                  placeholder={t("Entertitle")}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Normal Range */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="normal_range"
                  className="font-bold flex justify-between"
                >
                  {t("normal_range")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormInput
                  type="text"
                  id="normal_range"
                  name="normal_range"
                  value={formData.normal_range}
                  onChange={handleInputChange}
                  className={clsx({ "border-danger": errors.normal_range })}
                  placeholder={t("Enternormalrange")}
                />
                {errors.normal_range && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.normal_range}
                  </p>
                )}
              </div>

              {/* Units */}
              <div className="mb-5">
                <FormLabel
                  htmlFor="units"
                  className="font-bold flex justify-between"
                >
                  {t("units")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormInput
                  type="text"
                  id="units"
                  name="units"
                  value={formData.units}
                  onChange={handleInputChange}
                  className={clsx({ "border-danger": errors.units })}
                  placeholder={t("Enterunits")}
                />
                {errors.units && (
                  <p className="text-red-500 text-sm mt-1">{errors.units}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-right mt-6">
                <Button
                  variant="primary"
                  className="w-24"
                  onClick={handleSubmit}
                  disabled={loading2}
                >
                  {loading2 ? (
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
        </div>
      </div>

      {/* Delete Modal */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => setDeleteConfirmationModal(false)}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Trash2"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">{t("ReallyDel")}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => setDeleteConfirmationModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={delParameters}
            >
              {t("delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default Main;
