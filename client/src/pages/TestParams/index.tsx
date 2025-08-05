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
  getInvestigationParamsAction,
  updateInvestigationAction,
  deleteParamsAction,
} from "@/actions/patientActions";
import { Dialog } from "@/components/Base/Headless";

import { getAdminOrgAction } from "@/actions/adminActions";
import Lucide from "@/components/Base/Lucide";

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
  category: string;
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
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);
  const [testParameters, setTestParameters] = useState<TestParameter[]>([]);
  const [originalTestName, setOriginalTestName] = useState("");
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [paramId, setParamId] = useState("");
  const [currentInvestigation, setCurrentInvestigation] =
    useState<Investigation | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    normal_range: "",
    units: "",
    category: "",
    test_name: "",
    field_type: "",
  });
  const [selection, setSelection] = useState<Selection>({
    category: "",
    test_name: "",
    investigation_id: null,
  });
  const [errors, setErrors] = useState({
    title: "",
    normal_range: "",
    units: "",
    category: "",
    test_name: "",
    field_type: "",
  });

  const canEditInvestigation = (
    investigation: Investigation | null
  ): boolean => {
    if (!investigation || !userData) return false;

    if (investigation.added_by === null) return false;

    if (userData.role == "Superadmin") {
      return true;
    }

    if (userData.role === "Admin") {
      console.log(investigation,"investigationinvestigationinvestigation")
      console.log(userData,"userDatauserDatauserDatauserData")
      return investigation.organisation_id == userData.org_id;
    }

    if (userData.role === "Faculty") {
      if (investigation.role === "Admin") return false;
      return investigation.organisation_id == userData.org_id;
    }

    return false;
  };

  const canEditParameter = (parameter: TestParameter): boolean => {
    if (!userData) return false;

    if (userData.role === "Superadmin") {
      return true;
    }

    if (parameter.added_by === null) return false;

    if (userData.role === "Admin") {
      return parameter.organisation_id == userData.org_id;
    }

    if (userData.role === "Faculty") {
      if (parameter.role === "Admin") return false;
      return parameter.organisation_id == userData.org_id;
    }

    return false;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "category") {
      const filtered = investigations.filter((inv) => inv.category === value);
      setFilteredInvestigations(filtered);
      setFormData((prev) => ({
        ...prev,
        test_name: "",
      }));
    }
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelection({
      category,
      test_name: "",
      investigation_id: null,
    });
    setTestParameters([]);
    setEditMode(false);
    setCurrentInvestigation(null);
    if (category) {
      const filtered = investigations.filter(
        (inv) => inv.category === category
      );
      setFilteredInvestigations(filtered);
    } else {
      setFilteredInvestigations([]);
    }
  };

  const handleTestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const test_name = e.target.value;
    const investigation = filteredInvestigations.find(
      (inv) => inv.test_name === test_name
    );

    if (investigation) {
      setSelection((prev) => ({
        ...prev,
        test_name,
        investigation_id: investigation.id,
      }));
      setOriginalTestName(investigation.test_name);
      setCurrentInvestigation(investigation);
      setEditMode(canEditInvestigation(investigation));

      const params = await getInvestigationParamsAction(investigation.id);
      setTestParameters(params);

      try {
        setLoading(true);
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
    debugger
    let hasError = false;
    const newErrors = {
      title: "",
      normal_range: "",
      units: "",
      category: "",
      test_name: "",
      field_type: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = t("Titlerequired");
      hasError = true;
    }
    if (!formData.normal_range.trim()) {
      newErrors.normal_range = t("NormalRangerequired");
      hasError = true;
    }
    if (!formData.units.trim()) {
      newErrors.units = t("Unitsrequired");
      hasError = true;
    }
    if (!formData.category.trim()) {
      newErrors.category = t("Categoryrequired");
      hasError = true;
    }
    if (!formData.test_name.trim()) {
      newErrors.test_name = t("Investigationrequired");
      hasError = true;
    }
    if (!formData.field_type.trim()) {
      newErrors.field_type = t("FieldTyperequired");
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    const formPayload = new FormData();
    formPayload.append("title", formData.title);
    formPayload.append("normal_range", formData.normal_range);
    formPayload.append("units", formData.units);
    formPayload.append("field_type", formData.field_type);
    formPayload.append("category", formData.category);
    formPayload.append("test_name", formData.test_name);

    if (userData && userData.role != 'Superadmin') {
      formPayload.append("addedBy", String(userData.uid));
    } else {
      formPayload.append("addedBy", 'null');
    }

    try {
      const result = await saveParamtersAction(formPayload);
      window.scrollTo({ top: 0, behavior: "smooth" });

      setShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
      });

      setFormData({
        title: "",
        normal_range: "",
        units: "",
        category: "",
        test_name: "",
        field_type: "",
      });
      setFilteredInvestigations([]);
      setErrors({
        title: "",
        normal_range: "",
        units: "",
        category: "",
        test_name: "",
        field_type: "",
      });

      // // Refresh investigations list
      // const investigationData = await getInvestigationsAction();
      // setInvestigations(investigationData);
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

  // Replace the saveParameters function in your React component with this:

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
      formData.append("category", selection.category);
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

      const result = await updateInvestigationAction(formData);

      // Update local state
      setInvestigations(
        investigations.map((inv) =>
          inv.id === selection.investigation_id
            ? {
                ...inv,
                test_name: selection.test_name,
                category: selection.category,
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
    try {
      const res = await deleteParamsAction(paramId);
      if (res) {
        if (currentInvestigation) {
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
        setTimeout(() => setShowAlert(null), 3000);
      }
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: "Error in deleting parameters",
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex flex-col md:flex-row gap-6 p-4">
        <div className="w-full md:w-1/2 box p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("SelectInvestigations")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FormLabel htmlFor="category" className="font-bold">
                {t("Category")}
              </FormLabel>
              <FormSelect
                id="category"
                className={`w-full ${clsx({
                  "border-danger": errors.category,
                })}`}
                name="category"
                value={selection.category}
                onChange={handleCategoryChange}
              >
                <option value="">{t("select_category")}</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </FormSelect>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="test_name" className="font-bold">
                {t("Test")}
              </FormLabel>
              <div className="flex gap-2">
                <FormSelect
                  id="test_name"
                  className={`w-full ${clsx({
                    "border-danger": errors.test_name,
                  })}`}
                  name="test_name"
                  value={selection.test_name}
                  onChange={handleTestChange}
                  disabled={
                    !selection.category ||
                    (editMode && !canEditInvestigation(currentInvestigation))
                  }
                >
                  <option value="">{t("select_test")}</option>
                  {filteredInvestigations.map((inv) => (
                    <option key={inv.id} value={inv.test_name}>
                      {inv.test_name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              {errors.test_name && (
                <p className="text-red-500 text-sm mt-1">{errors.test_name}</p>
              )}
            </div>
          </div>

          {/* Parameters Table */}
          {selection.test_name && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold">Parameters for:</span>
                {canEditInvestigation(currentInvestigation) ? (
                  <div className="flex items-center gap-2">
                    <FormInput
                      type="text"
                      value={selection.test_name}
                      onChange={(e) =>
                        setSelection((prev) => ({
                          ...prev,
                          test_name: e.target.value,
                        }))
                      }
                      className="w-64"
                    />
                  </div>
                ) : (
                  <span className="font-semibold">{selection.test_name}</span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        Normal Range
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        Units
                      </th>
                      {canEditInvestigation(currentInvestigation) && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Actions
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
                          {canEditInvestigation(currentInvestigation) && (
                            <td className="px-4 py-2 border text-center">
                              {canEditParameter(param) && (
                                <Button
                                  variant="outline-danger"
                                  onClick={() => {
                                    setParamId(String(param.id));
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

              {/* Save Button */}
              {canEditInvestigation(currentInvestigation) && (
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
                  <FormLabel htmlFor="category" className="font-bold">
                    {t("Category")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="category"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.category,
                  })}`}
                  name="category"
                  value={formData.category || ""}
                  onChange={handleInputChange}
                >
                  <option value="">{t("select_category")}</option>
                  {categories.map((org) => (
                    <option key={org.category} value={org.category}>
                      {org.category}
                    </option>
                  ))}
                </FormSelect>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="TestName" className="font-bold">
                    {t("Investigation")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  type="text"
                  id="TestName"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.test_name,
                  })}`}
                  name="test_name"
                  value={formData.test_name || ""}
                  onChange={handleInputChange}
                  placeholder={t("Enter investigation name")}
                />
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
                  value={formData.field_type || ""}
                  onChange={handleInputChange}
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.field_type,
                  })}`}
                >
                  <option value="">{t("select_field_type")}</option>
                  <option value="text">{t("Text")}</option>
                  <option value="image">{t("File")}</option>
                </FormSelect>
                {errors.field_type && (
                  <p className="text-red-500 text-sm">{errors.field_type}</p>
                )}
              </div>

              {/* Title */}
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
        </div>
      </div>

      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
        }}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Archive"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">
              {paramId ? `${t("ReallyArch")}` : `${t("ReallyArch")} `}
              <br />
              {/* {t("undone")} */}
            </div>
          </div>
          <div className="px-5 pb-8  text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setParamId("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={() => {
                delParameters();
              }}
            >
              {t("Archive")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default RequestInvestigations;
