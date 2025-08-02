// import React, { useState } from "react";
// import Button from "@/components/Base/Button";
// import {
//   FormInput,
//   FormLabel,
//   FormSwitch,
//   FormSelect,
// } from "@/components/Base/Form";
// import clsx from "clsx";
// import Alerts from "@/components/Alert";
// import { t } from "i18next";
// import {
//   getCategoryAction,
//   getInvestigationsAction,
//   saveParamtersAction,
// } from "@/actions/patientActions";
// import { useEffect } from "react";

// type Investigation = {
//   id: number;
//   test_name: string;
//   category: string;
//   // add other properties if needed
// };

// function TestParameters() {
//   const [loading, setLoading] = useState(false);
//   const [categories, setCategories] = useState<{ category: string }[]>([]);
//   const [investigations, setInvestigations] = useState<Investigation[]>([]);
//   const [filteredInvestigations, setFilteredInvestigations] = useState<
//     Investigation[]
//   >([]);

//   const [formData, setFormData] = useState({
//     title: "",
//     normal_range: "",
//     units: "",
//     category: "",
//     test_name: "",
//     field_type: "",
//   });

//   const [errors, setErrors] = useState({
//     title: "",
//     normal_range: "",
//     units: "",
//     category: "",
//     test_name: "",
//     field_type: "",
//   });

//   const [showAlert, setShowAlert] = useState<{
//     variant: "success" | "danger";
//     message: string;
//   } | null>(null);

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//     if (name === "category") {
//       const filtered = investigations.filter((inv) => inv.category === value);
//       setFilteredInvestigations(filtered);

//       // Optionally reset test_name when category changes
//       setFormData((prev) => ({
//         ...prev,
//         test_name: "",
//       }));
//     }
//   };

//   const handleSubmit = async () => {
//     let hasError = false;
//     const newErrors = {
//       title: "",
//       normal_range: "",
//       units: "",
//       category: "",
//       test_name: "",
//       field_type: "",
//     };

//     // Validation checks
//     if (!formData.title.trim()) {
//       newErrors.title = t("Titlerequired");
//       hasError = true;
//     }
//     if (!formData.normal_range.trim()) {
//       newErrors.normal_range = t("NormalRangerequired");
//       hasError = true;
//     }
//     if (!formData.units.trim()) {
//       newErrors.units = t("Unitsrequired");
//       hasError = true;
//     }
//     if (!formData.category.trim()) {
//       newErrors.category = t("Categoryrequired");
//       hasError = true;
//     }
//     if (!formData.test_name.trim()) {
//       newErrors.test_name = t("Investigationrequired");
//       hasError = true;
//     }
//     if (!formData.field_type.trim()) {
//       newErrors.field_type = t("FieldTyperequired");
//       hasError = true;
//     }

//     setErrors(newErrors);
//     if (hasError) return;

//     setLoading(true);
//     const formPayload = new FormData();
//     formPayload.append("title", formData.title);
//     formPayload.append("normal_range", formData.normal_range);
//     formPayload.append("units", formData.units);
//     formPayload.append("field_type", formData.field_type);
//     formPayload.append("category", formData.category);
//     formPayload.append("test_name", formData.test_name);
//     console.log("Submitted Data:", formPayload);
//     try {
//       const result = await saveParamtersAction(formPayload);
//       window.scrollTo({ top: 0, behavior: "smooth" });

//       // Show success alert
//       setShowAlert({
//         variant: "success",
//         message: "Parameter saved successfully!",
//       });

//       // Reset form
//       setFormData({
//         title: "",
//         normal_range: "",
//         units: "",
//         category: "",
//         test_name: "",
//         field_type: "",
//       });
//       setFilteredInvestigations([]);
//       setErrors({
//         title: "",
//         normal_range: "",
//         units: "",
//         category: "",
//         test_name: "",
//         field_type: "",
//       });
//     } catch (error) {
//       setShowAlert({
//         variant: "danger",
//         message: "Failed to save settings. Please try again.",
//       });
//     } finally {
//       setLoading(false);
//       setTimeout(() => setShowAlert(null), 3000);
//     }
//   };

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const categoryData = await getCategoryAction();
//         const investigationData = await getInvestigationsAction();
//         console.log(investigationData, "investigationDatainvestigationData");
//         setInvestigations(investigationData);
//         setCategories(categoryData);
//       } catch (error) {
//         console.error("Failed to fetch settings:", error);
//       }
//     };

//     fetchSettings();
//   }, []);

//   return (
//     <>
//       {showAlert && <Alerts data={showAlert} />}
//       <div className="flex">
//         <div className="w-1/2 p-4"> Edit and delete categories and tests </div>
//         <div className="w-1/2 p-4">
//           <div className="flex items-center mt-8 intro-y">
//             <h2 className="mr-auto text-lg font-medium">
//               {t("add_test_params")}
//             </h2>
//           </div>

//           <div className="grid grid-cols-12 gap-6 mt-5">
//             <div className="col-span-12 intro-y lg:col-span-8">
//               <div className="p-5 intro-y box">
//                 {/* Category dropdown */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel htmlFor="category" className="font-bold">
//                       {t("Category")}
//                     </FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormSelect
//                     id="category"
//                     className={`w-full mb-2 ${clsx({
//                       "border-danger": errors.category,
//                     })}`}
//                     name="category"
//                     value={formData.category || ""}
//                     onChange={handleInputChange}
//                   >
//                     <option value="">{t("select_category")}</option>
//                     {categories.map((org) => (
//                       <option key={org.category} value={org.category}>
//                         {org.category}
//                       </option>
//                     ))}
//                   </FormSelect>
//                   {errors.category && (
//                     <p className="text-red-500 text-sm">{errors.category}</p>
//                   )}
//                 </div>

//                 {/* TestName dropdown */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel htmlFor="TestName" className="font-bold">
//                       {t("Investigation")}
//                     </FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormSelect
//                     id="TestName"
//                     className={`w-full mb-2 ${clsx({
//                       "border-danger": errors.test_name,
//                     })}`}
//                     name="test_name"
//                     value={formData.test_name || ""}
//                     onChange={handleInputChange}
//                   >
//                     <option value="">{t("select_investigation")}</option>
//                     {filteredInvestigations.map((inv) => (
//                       <option key={inv.id} value={inv.test_name}>
//                         {inv.test_name}
//                       </option>
//                     ))}
//                   </FormSelect>
//                   {errors.test_name && (
//                     <p className="text-red-500 text-sm">{errors.test_name}</p>
//                   )}
//                 </div>

//                 {/* field type */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel htmlFor="field_type" className="font-bold">
//                       {t("FieldType")}
//                     </FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormSelect
//                     id="field_type"
//                     name="field_type"
//                     value={formData.field_type || ""}
//                     onChange={handleInputChange}
//                     className={`w-full mb-2 ${clsx({
//                       "border-danger": errors.field_type,
//                     })}`}
//                   >
//                     <option value="">{t("select_field_type")}</option>
//                     <option value="text">{t("Text")}</option>
//                     <option value="image">{t("File")}</option>
//                   </FormSelect>
//                   {errors.field_type && (
//                     <p className="text-red-500 text-sm">{errors.field_type}</p>
//                   )}
//                 </div>

//                 {/* Title */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel className="font-bold">{t("Title")}</FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormInput
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleInputChange}
//                     className={clsx("w-full", {
//                       "border-danger": errors.title,
//                     })}
//                     placeholder={t("Entertitle")}
//                   />
//                   {errors.title && (
//                     <p className="text-red-500 text-sm">{errors.title}</p>
//                   )}
//                 </div>

//                 {/* normal_range */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel className="font-bold">
//                       {t("normal_range")}
//                     </FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormInput
//                     type="text"
//                     name="normal_range"
//                     value={formData.normal_range}
//                     onChange={handleInputChange}
//                     className={clsx("w-full", {
//                       "border-danger": errors.normal_range,
//                     })}
//                     placeholder={t("Enternormalrange")}
//                   />
//                   {errors.normal_range && (
//                     <p className="text-red-500 text-sm">
//                       {errors.normal_range}
//                     </p>
//                   )}
//                 </div>

//                 {/* units */}
//                 <div className="mb-5">
//                   <div className="flex items-center justify-between">
//                     <FormLabel className="font-bold">{t("units")}</FormLabel>
//                     <span className="text-xs text-gray-500 font-bold ml-2">
//                       {t("required")}
//                     </span>
//                   </div>
//                   <FormInput
//                     type="text"
//                     name="units"
//                     value={formData.units}
//                     onChange={handleInputChange}
//                     className={clsx("w-full", {
//                       "border-danger": errors.units,
//                     })}
//                     placeholder={t("Enterunits")}
//                   />
//                   {errors.units && (
//                     <p className="text-red-500 text-sm">{errors.units}</p>
//                   )}
//                 </div>

//                 <div className="text-right mt-6">
//                   <Button
//                     variant="primary"
//                     className="w-32"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <div className="loader">
//                         <div className="dot"></div>
//                         <div className="dot"></div>
//                         <div className="dot"></div>
//                       </div>
//                     ) : (
//                       `${t("save")}`
//                     )}{" "}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default TestParameters;

//////////////////////          first method               /////////////////  //

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
} from "@/actions/patientActions";
import Table from "@/components/Base/Table";

import { getAdminOrgAction } from "@/actions/adminActions";
import Lucide from "@/components/Base/Lucide";

interface Investigation {
  id: number;
  test_name: string;
  category: string;
  status?: string;
}

interface TestParameter {
  id: number;
  investigation_id: number;
  name: string;
  normal_range: string;
  units: string;
}
function RequestInvestigations({ data }: { data: { id: number } }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);
  const [testParameters, setTestParameters] = useState<TestParameter[]>([]);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
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
  const [selection, setSelection] = useState({
    category: "",
    test_name: "",
    investigation_id: 0,
  });
  const [errors, setErrors] = useState({
    title: "",
    normal_range: "",
    units: "",
    category: "",
    test_name: "",
    field_type: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "category") {
      const filtered = investigations.filter((inv) => inv.category === value);
      setFilteredInvestigations(filtered);

      // Optionally reset test_name when category changes
      setFormData((prev) => ({
        ...prev,
        test_name: "",
      }));
    }
  };
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const userEmail = localStorage.getItem("user");
  //       if (userEmail) {
  //         const userData = await getAdminOrgAction(userEmail);
  //         setUserId(userData.uid);
  //         setUserRole(userData.role);
  //       }

  //       const [categoryData, investigationData] = await Promise.all([
  //         getCategoryAction(),
  //         getInvestigationsAction(),
  //       ]);

  //       setCategories(categoryData);
  //       setInvestigations(investigationData);
  //     } catch (error) {
  //       console.error("Failed to fetch data:", error);
  //       setShowAlert({
  //         variant: "danger",
  //         message: "Failed to load data. Please try again.",
  //       });
  //     }
  //   };

  //   fetchData();
  // }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        if (userEmail) {
          const userData = await getAdminOrgAction(userEmail);
          setUserId(userData.uid);
          setUserRole(userData.role);
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
    setFormData({ ...formData, category, test_name: "" });
    setErrors({ ...errors, category: "" });

    if (category) {
      const filtered = investigations.filter(
        (inv) => inv.category === category
      );
      setFilteredInvestigations(filtered);
    } else {
      setFilteredInvestigations([]);
    }
  };

  // const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const test_name = e.target.value;
  //   setFormData({ ...formData, test_name });
  //   setErrors({ ...errors, test_name: "" });
  // };

  const handleTestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const test_name = e.target.value;
    const investigation = filteredInvestigations.find(
      (inv) => inv.test_name === test_name
    );

    if (investigation) {
      setSelection({
        ...selection,
        test_name,
        investigation_id: investigation.id,
      });
      setErrors({ ...errors, test_name: "" });

      // Fetch test parameters for selected investigation
      try {
        // const params = await getTestParametersAction(investigation.id);
        // setTestParameters(params);
      } catch (error) {
        console.error("Failed to fetch test parameters:", error);
        setTestParameters([]);
      }
    }
  };

  const handleSubmit = async () => {
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
    console.log("Submitted Data:", formPayload);
    try {
      const result = await saveParamtersAction(formPayload);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Show success alert
      setShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
      });

      // Reset form
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

  // Handle category selection

  // Handle test selection

  // Update parameter in the list
  const updateParameter = (id: number, field: string, value: string) => {
    setTestParameters(
      testParameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  // Add new parameter
  const addNewParameter = () => {
    setTestParameters([
      ...testParameters,
      {
        id: Date.now(), // Temporary ID for new items
        investigation_id: selection.investigation_id,
        name: "",
        normal_range: "",
        units: "",
      },
    ]);
  };

  // Remove parameter
  const removeParameter = (id: number) => {
    setTestParameters(testParameters.filter((param) => param.id !== id));
  };

  // Save all parameters
  const saveParameters = async () => {
    if (!selection.investigation_id) return;

    setLoading(true);
    try {
      // await saveTestParametersAction(
      //   selection.investigation_id,
      //   testParameters
      // );
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

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex flex-col md:flex-row gap-6 p-4">
        {/* Left Panel - Category and Test Selection */}
        <div className="w-full md:w-1/2 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Select Investigations</h2>

          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Category Dropdown */}
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

            {/* Test Dropdown */}
            <div>
              <FormLabel htmlFor="test_name" className="font-bold">
                {t("Test")}
              </FormLabel>
              <FormSelect
                id="test_name"
                className={`w-full ${clsx({
                  "border-danger": errors.test_name,
                })}`}
                name="test_name"
                value={selection.test_name}
                onChange={handleTestChange}
                disabled={!selection.category}
              >
                <option value="">{t("select_test")}</option>
                {filteredInvestigations.map((inv) => (
                  <option key={inv.id} value={inv.test_name}>
                    {inv.test_name}
                  </option>
                ))}
              </FormSelect>
              {errors.test_name && (
                <p className="text-red-500 text-sm mt-1">{errors.test_name}</p>
              )}
            </div>
          </div>

          {/* Parameters Table */}
          {selection.test_name && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                  Parameters for: {selection.test_name}
                </h3>
                <Button
                  variant="primary"
                  onClick={addNewParameter}
                  className="text-sm"
                >
                  Add Parameter
                </Button>
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                        Actions
                      </th>
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
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <Button
                              variant="outline-danger"
                              onClick={() => removeParameter(param.id)}
                              className="p-1"
                            >
                              <Lucide icon="Trash2" className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={saveParameters}
                  disabled={loading}
                  className="w-32"
                >
                  {loading ? "Saving..." : "Save Parameters"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Selected Tests */}
        <div className="w-full md:w-1/2 bg-white p-6 rounded shadow">
          <div className="flex items-center mb-2  intro-y">
            {" "}
            <h2 className="mr-auto text-lg font-medium">
              {" "}
              {t("add_test_params")}
            </h2>
          </div>
          <div className="col-span-12 intro-y lg:col-span-8">
            <div className="p-5 intro-y box">
              {/* Category dropdown */}
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

              {/* TestName dropdown */}
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="TestName" className="font-bold">
                    {t("Investigation")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>
                <FormSelect
                  id="TestName"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": errors.test_name,
                  })}`}
                  name="test_name"
                  value={formData.test_name || ""}
                  onChange={handleInputChange}
                >
                  <option value="">{t("select_investigation")}</option>
                  {filteredInvestigations.map((inv) => (
                    <option key={inv.id} value={inv.test_name}>
                      {inv.test_name}
                    </option>
                  ))}
                </FormSelect>
                {errors.test_name && (
                  <p className="text-red-500 text-sm">{errors.test_name}</p>
                )}
              </div>

              {/* field type */}
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

              {/* normal_range */}
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

              {/* units */}
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
        </div>
      </div>
    </>
  );
}

export default RequestInvestigations;
