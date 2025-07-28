import React, { useState } from "react";
import Button from "@/components/Base/Button";
import {
  FormInput,
  FormLabel,
  FormSwitch,
  FormSelect,
} from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import {
  getCategoryAction,
  getInvestigationsAction,
  saveParamtersAction,
} from "@/actions/patientActions";
import { useEffect } from "react";

type Investigation = {
  id: number;
  test_name: string;
  category: string;
  // add other properties if needed
};

function Settings() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);

  const [formData, setFormData] = useState({
    title: "",
    normal_range: "",
    units: "",
    category: "",
    test_name: "",
    field_type: "",
  });

  const [errors, setErrors] = useState({
    title: "",
    normal_range: "",
    units: "",
    category: "",
    test_name: "",
    field_type: "",
  });

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

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

    // Validation checks
    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
      hasError = true;
    }
    if (!formData.normal_range.trim()) {
      newErrors.normal_range = "Normal Range is required.";
      hasError = true;
    }
    if (!formData.units.trim()) {
      newErrors.units = "Units are required.";
      hasError = true;
    }
    if (!formData.category.trim()) {
      newErrors.category = "Category is required.";
      hasError = true;
    }
    if (!formData.test_name.trim()) {
      newErrors.test_name = "Investigation is required.";
      hasError = true;
    }
    if (!formData.field_type.trim()) {
      newErrors.field_type = "Field Type is required.";
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
      setShowAlert({
        variant: "success",
        message: "Parameter saved successfully!",
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const categoryData = await getCategoryAction();
        const investigationData = await getInvestigationsAction();
        console.log(investigationData, "investigationDatainvestigationData");
        setInvestigations(investigationData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("test_params")}</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
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
                  {t("Field Type")}
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
                <option value="text">Text</option>
                <option value="image">File</option>
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
                className={clsx("w-full", { "border-danger": errors.title })}
                placeholder="Enter title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* normal_range */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <FormLabel className="font-bold">{t("normal_range")}</FormLabel>
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
                placeholder="Enter normal range"
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
                className={clsx("w-full", { "border-danger": errors.units })}
                placeholder="Enter units"
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
    </>
  );
}

export default Settings;
