import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormCheck,
} from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import {
  getCategoryAction,
  getInvestigationsAction,
  saveParamtersAction,
  getInvestigationParamsAction,
  updateInvestigationAction,
  deleteParamsAction,
  addInvestigationAction, // Add this import
} from "@/actions/patientActions";
import { Dialog } from "@/components/Base/Headless";
import { getAdminOrgAction } from "@/actions/adminActions";
import Lucide from "@/components/Base/Lucide";
import { isValidInput } from "@/helpers/validation"; // Add this import

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

interface Selection {
  category_1: string;
  test_name: string;
  investigation_id: number | null;
}

interface UserData {
  uid: number;
  role: string;
  org_id: number;
}

function RequestInvestigations({ data }: { data: { id: number } }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations1, setFilteredInvestigations1] = useState<
    Investigation[]
  >([]);
  const [filteredInvestigations2, setFilteredInvestigations2] = useState<
    Investigation[]
  >([]);
  const [testParameters, setTestParameters] = useState<TestParameter[]>([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [paramId, setParamId] = useState<number | null>(null);
  const [currentInvestigation, setCurrentInvestigation] =
    useState<Investigation | null>(null);
  const [canEditParam, setCanEditParam] = useState(false);

  // Add these states for the new investigation modal
  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [investigationFormData, setInvestigationFormData] = useState({
    category: "",
    test_name: "",
  });
  const [investigationFormErrors, setInvestigationFormErrors] = useState({
    category: "",
    test_name: "",
  });
  const [investigationLoading, setInvestigationLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    normal_range: "",
    units: "",
    category_2: "",
    test_name: "",
    field_type: "",
  });

  const [selection, setSelection] = useState<Selection>({
    category_1: "",
    test_name: "",
    investigation_id: null,
  });

  const [errors, setErrors] = useState({
    title: "",
    normal_range: "",
    units: "",
    category_1: "",
    category_2: "",
    test_name: "",
    field_type: "",
  });

  const canEditInvestigation = (
    investigation: Investigation | null
  ): boolean => {
    if (!investigation || !userData) return false;

    // If investigation was added by system (null added_by), only superadmin can edit
    if (investigation.added_by === null) {
      return userData.role === "Superadmin";
    }

    switch (userData.role) {
      case "Superadmin":
        return true;
      case "Admin":
        return investigation.organisation_id === userData.org_id;
      case "Faculty":
        return (
          investigation.organisation_id === userData.org_id &&
          investigation.role !== "Admin"
        );
      default:
        return false;
    }
  };

  const canEditParameter = (parameter: TestParameter | null): boolean => {
    if (!parameter || !userData) return false;

    if (parameter.added_by === null) {
      return userData.role === "Superadmin";
    }

    switch (userData.role) {
      case "Superadmin":
        return true;
      case "Admin":
        return parameter.organisation_id === userData.org_id;
      case "Faculty":
        return (
          parameter.organisation_id === userData.org_id &&
          parameter.role !== "Admin"
        );
      default:
        return false;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("category_")) {
      // Handle category fields separately
      if (name === "category_1") {
        setSelection((prev) => ({ ...prev, [name]: value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Add this function for investigation form input change
  const handleInvestigationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInvestigationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setInvestigationFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
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
        setShowAlert({
          variant: "danger",
          message: "Failed to load data. Please try again.",
        });
      }
    };

    fetchData();
  }, []);

  const handleCategoryChange1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category_1 = e.target.value;
    setSelection({
      category_1,
      test_name: "",
      investigation_id: null,
    });
    setTestParameters([]);
    setEditMode(false);
    setCurrentInvestigation(null);

    if (category_1) {
      const filtered = investigations.filter(
        (inv) => inv.category === category_1
      );
      setFilteredInvestigations1(filtered);
    } else {
      setFilteredInvestigations1([]);
    }
  };

  const handleCategoryChange2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category_2 = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category_2,
      test_name: "",
    }));
    setErrors((prev) => ({ ...prev, category_2: "" }));

    const filtered = investigations.filter(
      (inv) => inv.category === category_2
    );
    setFilteredInvestigations2(filtered);
  };

  // Add this function to validate investigation form
  const validateInvestigationForm = (): boolean => {
    const errors: { category: string; test_name: string } = {
      category: "",
      test_name: "",
    };

    if (
      !investigationFormData.category ||
      investigationFormData.category === ""
    ) {
      errors.category = t("SelectOneCategory");
    }

    if (!investigationFormData.test_name) {
      errors.test_name = t("InvestigationTitle");
    } else if (!isValidInput(investigationFormData.test_name)) {
      errors.test_name = t("invalidInput");
    }

    setInvestigationFormErrors(errors);
    return !errors.category && !errors.test_name;
  };

  // Add this function to handle investigation form submission
  const handleInvestigationSubmit = async () => {
    setInvestigationLoading(false);
    const isValid = validateInvestigationForm();

    if (!isValid) return;

    setInvestigationLoading(true);
    try {
      const result = await addInvestigationAction({
        category: investigationFormData.category,
        test_name: investigationFormData.test_name,
      });

      if (result) {
        // Refresh the investigations list
        const investigationData = await getInvestigationsAction();
        setInvestigations(investigationData);

        // Reset form and close modal
        setInvestigationFormData({
          category: "",
          test_name: "",
        });
        setShowCustomCategoryInput(false);
        setSuperlargeModalSizePreview(false);

        setShowAlert({
          variant: "success",
          message: t("investicationsuccess"),
        });
      }
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: t("investicationfailed"),
      });
      console.error("Error:", error);
    } finally {
      setInvestigationLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  // Update the validateForm function
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

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
    if (!formData.category_2.trim()) {
      newErrors.category_2 = t("Categoryrequired");
      isValid = false;
    }
    if (!formData.test_name.trim()) {
      newErrors.test_name = t("Investigationrequired");
      isValid = false;
    }
    if (!formData.field_type.trim()) {
      newErrors.field_type = t("FieldTyperequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleTestChange1 = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const test_name = e.target.value;
    const investigation = filteredInvestigations1.find(
      (inv) => inv.test_name === test_name
    );

    if (investigation) {
      setSelection((prev) => ({
        ...prev,
        test_name,
        investigation_id: investigation.id,
      }));
      setCurrentInvestigation(investigation);
      setEditMode(canEditInvestigation(investigation));

      try {
        setLoading(true);
        const params = await getInvestigationParamsAction(investigation.id);
        setTestParameters(params);
      } catch (error) {
        console.error("Failed to fetch test parameters:", error);
        setShowAlert({
          variant: "danger",
          message: "Failed to load test parameters.",
        });
        setTestParameters([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSelection((prev) => ({
        ...prev,
        test_name: "",
        investigation_id: null,
      }));
      setTestParameters([]);
      setEditMode(false);
      setCurrentInvestigation(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("normal_range", formData.normal_range);
      formPayload.append("units", formData.units);
      formPayload.append("field_type", formData.field_type);
      formPayload.append("category", formData.category_2);
      formPayload.append("test_name", formData.test_name);

      if (userData && userData.role !== "Superadmin") {
        formPayload.append("addedBy", String(userData.uid));
      } else {
        formPayload.append("addedBy", "null");
      }

      await saveParamtersAction(formPayload);

      setShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
      });

      // Reset form
      setFormData({
        title: "",
        normal_range: "",
        units: "",
        category_2: "",
        test_name: "",
        field_type: "",
      });
      setFilteredInvestigations2([]);
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

  const updateParameter = (id: number, field: string, value: string) => {
    setTestParameters(
      testParameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const saveParameters = async () => {
    if (!selection.investigation_id || !userData) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "investigation_id",
        selection.investigation_id.toString()
      );
      formData.append("test_name", selection.test_name);
      formData.append("category", selection.category_1);
      formData.append(
        "parameters",
        JSON.stringify(
          testParameters.map((param) => ({
            id: param.id,
            name: param.name,
            normal_range: param.normal_range,
            units: param.units,
          }))
        )
      );

      await updateInvestigationAction(formData);

      // Update local state
      setInvestigations(
        investigations.map((inv) =>
          inv.id === selection.investigation_id
            ? {
                ...inv,
                test_name: selection.test_name,
                category: selection.category_1,
              }
            : inv
        )
      );

      setShowAlert({
        variant: "success",
        message: "Parameters saved successfully!",
      });
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: "Failed to save parameters. Please try again.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
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
      setShowAlert({
        variant: "success",
        message: "Parameters deleted successfully",
      });
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: "Error in deleting parameters",
      });
    } finally {
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      {/* Add Investigation Button */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-lg font-semibold text-gray-800">
          {t("request_investigations")}
        </h2>

        <Button
          className="bg-primary text-white"
          onClick={() => {
            setSuperlargeModalSizePreview(true);
          }}
        >
          {t("add_Investigation")}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-4">
        {/* Left Panel - Existing Tests */}
        <div className="w-full md:w-1/2 box p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("SelectInvestigations")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FormLabel htmlFor="category_1" className="font-bold">
                {t("Category")}
              </FormLabel>
              <FormSelect
                id="category_1"
                name="category_1"
                value={selection.category_1}
                onChange={handleCategoryChange1}
                className={`w-full ${clsx({
                  "border-danger": errors.category_1,
                })}`}
              >
                <option value="">{t("select_category")}</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </FormSelect>
              {errors.category_1 && (
                <p className="text-red-500 text-sm mt-1">{errors.category_1}</p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="test_name_1" className="font-bold">
                {t("Test")}
              </FormLabel>
              <FormSelect
                id="test_name_1"
                value={selection.test_name}
                onChange={handleTestChange1}
                disabled={!selection.category_1}
              >
                <option value="">{t("select_test")}</option>
                {filteredInvestigations1.map((inv) => (
                  <option key={inv.id} value={inv.test_name}>
                    {inv.test_name}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          {/* Parameters Table */}
          {selection.test_name && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold">Parameters for:</span>
                {canEditInvestigation(currentInvestigation) ? (
                  <FormInput
                    type="text"
                    value={selection.test_name}
                    onChange={(e) =>
                      setSelection((prev) => ({
                        ...prev,
                        test_name: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                ) : (
                  <span className="font-semibold">{selection.test_name}</span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        {t("Name")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        {t("NormalRange")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        {t("Units")}
                      </th>
                      {canEditInvestigation(currentInvestigation) && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          {t("Actions")}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {testParameters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-2 text-center text-gray-500 border"
                        >
                          No parameters found for this test
                        </td>
                      </tr>
                    ) : (
                      testParameters.map((param) => (
                        <tr key={param.id} className="border-b">
                          <td className="px-4 py-2 border">
                            <FormInput
                              type="text"
                              value={param.name}
                              onChange={(e) =>
                                updateParameter(
                                  param.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full"
                              disabled={!canEditParameter(param)}
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <FormInput
                              type="text"
                              value={param.normal_range}
                              onChange={(e) =>
                                updateParameter(
                                  param.id,
                                  "normal_range",
                                  e.target.value
                                )
                              }
                              className="w-full"
                              disabled={!canEditParameter(param)}
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <FormInput
                              type="text"
                              value={param.units}
                              onChange={(e) =>
                                updateParameter(
                                  param.id,
                                  "units",
                                  e.target.value
                                )
                              }
                              className="w-full"
                              disabled={!canEditParameter(param)}
                            />
                          </td>
                          {(canEditInvestigation(currentInvestigation) ||
                            testParameters.some(canEditParameter)) && (
                            <td className="px-4 py-2 border text-center">
                              {canEditParameter(param) && (
                                <Button
                                  variant="outline-danger"
                                  onClick={() => {
                                    setParamId(param.id);
                                    setDeleteConfirmationModal(true);
                                  }}
                                  className="p-1"
                                >
                                  <Lucide icon="Trash2" className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {(canEditInvestigation(currentInvestigation) ||
                testParameters.some(canEditParameter)) && (
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={saveParameters}
                    disabled={loading}
                    className="w-32"
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
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Add New Test */}
        <div className="w-full md:w-1/2 box p-6">
          <div className="flex items-center mb-8 intro-y">
            <h2 className="mr-auto text-lg font-medium">
              {t("add_test_params")}
            </h2>
          </div>
          <div className="col-span-12 intro-y lg:col-span-8">
            <div className="intro-y">
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="category_2" className="font-bold">
                    {t("Category")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="category_2"
                  name="category_2"
                  value={formData.category_2}
                  onChange={handleCategoryChange2}
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.category_2,
                  })}`}
                >
                  <option value="">{t("select_category")}</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </FormSelect>
                {errors.category_2 && (
                  <p className="text-red-500 text-sm">{errors.category_2}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="test_name_form" className="font-bold">
                    {t("Investigation")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="test_name_form"
                  name="test_name"
                  value={formData.test_name}
                  onChange={handleInputChange}
                  disabled={!formData.category_2}
                  className={clsx({
                    "border-danger": errors.test_name,
                  })}
                >
                  <option value="">{t("select_test")}</option>
                  {filteredInvestigations2.map((inv) => (
                    <option key={inv.id} value={inv.test_name}>
                      {inv.test_name}
                    </option>
                  ))}
                </FormSelect>
                {errors.test_name && (
                  <p className="text-red-500 text-sm">{errors.test_name}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="field_type" className="font-bold">
                    {t("FieldType")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="field_type"
                  name="field_type"
                  value={formData.field_type}
                  onChange={handleInputChange}
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.field_type,
                  })}`}
                >
                  <option value="">{t("select_field_type")}</option>
                  <option value="text">{t("Text")}</option>
                  <option value="image">{t("File")}</option>
                  <option value="textarea">{t("textarea")}</option>
                </FormSelect>
                {errors.field_type && (
                  <p className="text-red-500 text-sm">{errors.field_type}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold">{t("Title")}</FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={clsx("w-full", {
                    "border-danger": errors.title,
                  })}
                  placeholder={t("Entertitle")}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold">
                    {t("normal_range")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  type="text"
                  name="normal_range"
                  value={formData.normal_range}
                  onChange={handleInputChange}
                  className={clsx("w-full", {
                    "border-danger": errors.normal_range,
                  })}
                  placeholder={t("Enternormalrange")}
                />
                {errors.normal_range && (
                  <p className="text-red-500 text-sm">{errors.normal_range}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold">{t("units")}</FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  type="text"
                  name="units"
                  value={formData.units}
                  onChange={handleInputChange}
                  className={clsx("w-full", {
                    "border-danger": errors.units,
                  })}
                  placeholder={t("Enterunits")}
                />
                {errors.units && (
                  <p className="text-red-500 text-sm">{errors.units}</p>
                )}
              </div>

              <div className="text-right mt-6">
                <Button
                  variant="primary"
                  className="w-24"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      {/* Add Investigation Modal */}
      <Dialog
        size="xl"
        open={superlargeModalSizePreview}
        onClose={() => {
          setInvestigationFormData({
            category: "",
            test_name: "",
          });
          setInvestigationFormErrors({
            category: "",
            test_name: "",
          });
          setShowCustomCategoryInput(false);
          setSuperlargeModalSizePreview(false);
        }}
      >
        <Dialog.Panel className="p-10">
          <>
            <a
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setInvestigationFormData({
                  category: "",
                  test_name: "",
                });
                setInvestigationFormErrors({
                  category: "",
                  test_name: "",
                });
                setShowCustomCategoryInput(false);
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
                    "border-danger": investigationFormErrors.category,
                  })}`}
                  value={
                    showCustomCategoryInput
                      ? "other"
                      : investigationFormData.category
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "other") {
                      setShowCustomCategoryInput(true);
                      setInvestigationFormData({
                        ...investigationFormData,
                        category: "",
                      });
                    } else {
                      setShowCustomCategoryInput(false);
                      setInvestigationFormData({
                        ...investigationFormData,
                        category: value,
                      });
                    }
                    setInvestigationFormErrors((prev) => ({
                      ...prev,
                      category: "",
                    }));
                  }}
                >
                  <option value="">{t("SelectCategory")}</option>
                  {categories.map((item, index) => (
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
                      "border-danger": investigationFormErrors.category,
                    })}`}
                    value={investigationFormData.category}
                    onChange={handleInvestigationInputChange}
                  />
                )}

                {investigationFormErrors.category && (
                  <p className="text-red-500 text-sm">
                    {investigationFormErrors.category}
                  </p>
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
                    "border-danger": investigationFormErrors.test_name,
                  })}`}
                  name="test_name"
                  placeholder={t("Entertitle")}
                  value={investigationFormData.test_name}
                  onChange={handleInvestigationInputChange}
                />
                {investigationFormErrors.test_name && (
                  <p className="text-red-500 text-sm">
                    {investigationFormErrors.test_name}
                  </p>
                )}

                <div className="mt-5 text-right">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-24"
                    onClick={handleInvestigationSubmit}
                    disabled={investigationLoading}
                  >
                    {investigationLoading ? (
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
          setParamId(null);
        }}
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
              onClick={() => {
                setDeleteConfirmationModal(false);
                setParamId(null);
              }}
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
}

export default RequestInvestigations;
