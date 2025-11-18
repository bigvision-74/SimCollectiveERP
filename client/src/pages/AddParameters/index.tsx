import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
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

interface Investigation {
  id: number;
  test_name: string;
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
interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

const Main: React.FC<Component> = ({ onShowAlert }) => {
  const [loading2, setLoading2] = useState(false);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations2, setFilteredInvestigations2] = useState<
    Investigation[]
  >([]);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const fetchInitialData = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      if (userEmail) {
        const userData = await getAdminOrgAction(userEmail);
        setUserData({
          uid: userData.uid,
          role: userData.role,
          org_id: userData.organisation_id,
        });
      }

      const [categoryData, investigationData] = await Promise.all([
        getCategoryAction(),
        getInvestigationsAction(),
      ]);

      setCategories(categoryData);
      setInvestigations(investigationData);
    } catch (error) {
      console.error("Failed to fetch data:", error);

      onShowAlert({
        variant: "danger",
        message: "Failed to load initial data. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    const newFormData = {
      ...formData,
      category_2: selectedCategory,
      test_name: "",
      newTestName: "",
    };

    if (selectedCategory === "add_new") {
      newFormData.test_name = "add_new";
      setFilteredInvestigations2([]);
    } else {
      const filtered = investigations.filter(
        (inv) => inv.category === selectedCategory
      );
      setFilteredInvestigations2(filtered);
    }

    setFormData(newFormData);
    setErrors((prev) => ({ ...prev, category_2: "", test_name: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...initialErrors };

    if (!formData.title.trim()) {
      newErrors.title = t("Titlerequired");
      isValid = false;
    }
    if (!formData.normal_range.trim()) {
      newErrors.normal_range = t("NormalRangerequired");
      isValid = false;
    }
    if (!formData.units.trim()) {
      newErrors.units = t("Unitsrequired");
      isValid = false;
    }
    if (!formData.field_type.trim()) {
      newErrors.field_type = t("FieldTyperequired");
      isValid = false;
    }

    if (formData.category_2 === "add_new") {
      if (!formData.newCategory.trim()) {
        newErrors.newCategory = t("NewCategoryRequired");
        isValid = false;
      } else if (!isValidInput(formData.newCategory)) {
        newErrors.newCategory = t("invalidInput");
      }
    } else if (!formData.category_2.trim()) {
      newErrors.category_2 = t("Categoryrequired");
      isValid = false;
    }

    if (formData.test_name === "add_new") {
      if (!formData.newTestName.trim()) {
        newErrors.newTestName = t("NewInvestigationRequired");
        isValid = false;
      } else if (!isValidInput(formData.newTestName)) {
        newErrors.newTestName = t("invalidInput");
      }
    } else if (!formData.test_name.trim()) {
      newErrors.test_name = t("Investigationrequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading2(true);

    let finalCategory = formData.category_2;
    let finalTestName = formData.test_name;
    const isNewInvestigation =
      formData.category_2 === "add_new" || formData.test_name === "add_new";

    try {
      if (isNewInvestigation) {
        finalCategory =
          formData.category_2 === "add_new"
            ? formData.newCategory.trim()
            : formData.category_2;
        finalTestName =
          formData.test_name === "add_new"
            ? formData.newTestName.trim()
            : formData.test_name;

        const isDuplicate = investigations.some(
          (inv) =>
            inv.category.toLowerCase() === finalCategory.toLowerCase() &&
            inv.test_name.toLowerCase() === finalTestName.toLowerCase()
        );

        if (isDuplicate) {
          onShowAlert({
            variant: "danger",
            message: "This investigation already exists for this category.",
          });
          setLoading2(false);
          return;
        }

        await addInvestigationAction({
          category: finalCategory,
          test_name: finalTestName,
        });

        await fetchInitialData();
      }

      const paramPayload = new FormData();
      paramPayload.append("title", formData.title);
      paramPayload.append("normal_range", formData.normal_range);
      paramPayload.append("units", formData.units);
      paramPayload.append("field_type", formData.field_type);
      paramPayload.append("category", finalCategory);
      paramPayload.append("test_name", finalTestName);
      paramPayload.append("addedBy", userData ? String(userData.uid) : "null");

      await saveParamtersAction(paramPayload);

      onShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
      });

      setFormData(initialFormData);
      setFilteredInvestigations2([]);
      setErrors(initialErrors);
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

    try {
      const res = await deleteParamsAction(paramId.toString());
      if (res && currentInvestigation) {
        const params = await getInvestigationParamsAction(
          currentInvestigation.id
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
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
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

              <div className="mb-5">
                <FormLabel
                  htmlFor="test_name"
                  className="font-bold flex justify-between"
                >
                  {t("Investigation")}{" "}
                  <span className="text-xs text-gray-500">{t("required")}</span>
                </FormLabel>
                <FormSelect
                  id="test_name"
                  name="test_name"
                  value={formData.test_name}
                  onChange={handleInputChange}
                  disabled={
                    !formData.category_2 || formData.category_2 === "add_new"
                  }
                  className={clsx({ "border-danger": errors.test_name })}
                >
                  <option value="">{t("select_test")}</option>
                  {filteredInvestigations2.map((inv) => (
                    <option key={inv.id} value={inv.test_name}>
                      {inv.test_name}
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
                      className={clsx({ "border-danger": errors.newTestName })}
                      placeholder={t("Enter new investigation name")}
                    />
                    {errors.newTestName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.newTestName}
                      </p>
                    )}
                  </div>
                )}
              </div>

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
