import React from "react";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import { t } from "i18next";
import { Dialog, Menu } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { isValidInput } from "@/helpers/validation";
import { useUploads } from "@/components/UploadContext";
import { addNewMedicationAction } from "@/actions/patientActions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}
const Main: React.FC<Component> = ({ onShowAlert }) => {
  const { addTask, updateTask } = useUploads();

  const [formData, setFormData] = useState<{
    medication: string;
    doses: string[];
  }>({
    medication: "",
    doses: [""],
  });

  interface FormErrors {
    medication: string;
    doses: string;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({
    medication: "",
    doses: "",
  });
  const [loading1, setLoading1] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const validateOrgName = (medication: string) => {
    if (!medication) return t("MedicationValidation");
    if (medication.length < 4) return t("MedicationValidation2");
    if (medication.length > 150) return t("MedicationValidationMaxLength");
    if (!isValidInput(medication)) return t("invalidInput");
    return "";
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "medication") {
        newErrors.medication = validateOrgName(value);
      }

      return newErrors;
    });
  };

  const removeDose = (index: number) => {
    if (formData.doses.length > 1) {
      const newDoses = [...formData.doses];
      newDoses.splice(index, 1);
      setFormData((prev) => ({ ...prev, doses: newDoses }));
    }
  };

  const validateForm = (): FormErrors => {
    // Validate each dose individually
    const doseErrors = formData.doses
      .map((dose: string) => validateOrgName(dose.trim()))
      .filter((error: any) => error);

    const errors: FormErrors = {
      medication: validateOrgName(formData.medication.trim()),
      doses: doseErrors.length > 0 ? t("DoseValidation") : "",
    };

    return errors;
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;

    try {
      setLoading(true);
      const userEmail = localStorage.getItem("email");
      const formDataObj = new FormData();
      formDataObj.append("medication", formData.medication);
      formDataObj.append("dose", JSON.stringify(formData.doses));
      formDataObj.append("userEmail", String(userEmail));

      const createOrg = await addNewMedicationAction(formDataObj);

      setFormData({
        medication: "",
        doses: [""],
      });
      onShowAlert({
        variant: "success",
        message: t("AddMedicationSuccess"),
      });
    } catch (error: any) {
      onShowAlert({
        variant: "danger",
        message: t("AddMedicationfailed"),
      });

      console.error("Error in adding medication:", error);
      setShowAlert({
        variant: "danger",
        message: error.response.data.message,
      });
      setFormData({
        medication: "",
        doses: [""],
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="intro-y">
        <div className="text-left p-2">
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="org-form-1" className="font-bold">
              {t("medication")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>

          <FormInput
            id="org-form-1"
            type="text"
            className={`w-full mb-2 ${clsx({
              "border-danger": formErrors.medication,
            })}`}
            name="medication"
            placeholder={t("enterMedication")}
            value={formData.medication}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          {formErrors.medication && (
            <p className="text-red-500 text-left text-sm">
              {formErrors.medication}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <FormLabel htmlFor="org-form-1" className="font-bold">
              {t("dose")}
            </FormLabel>
            <span className="text-xs text-gray-500 font-bold ml-2">
              {t("required")}
            </span>
          </div>
          {formData.doses.map((dose: any, index: any) => (
            <div key={index} className="flex items-center">
              <FormInput
                id={`dose-${index}`}
                type="text"
                className={`w-full mb-2 ${clsx({
                  "border-danger": formErrors.doses,
                })}`}
                name={`dose-${index}`}
                placeholder={t("enterDose")}
                value={dose}
                onChange={(e) => {
                  const newDoses = [...formData.doses];
                  newDoses[index] = e.target.value;
                  setFormData((prev) => ({ ...prev, doses: newDoses }));
                }}
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  // if (e.key === " ") e.preventDefault();
                }}
              />

              {/* Remove button for all fields except the last one */}
              {formData.doses.length > 1 && (
                <button
                  type="button"
                  className="ml-2 p-2 rounded bg-gray-100 hover:bg-gray-200 text-red-500"
                  onClick={() => removeDose(index)}
                >
                  <Lucide icon="X"></Lucide>
                </button>
              )}

              {/* Plus icon only on last field */}
              {index === formData.doses.length - 1 && (
                <button
                  type="button"
                  className="ml-2 p-2 rounded bg-gray-100 hover:bg-gray-200"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      doses: [...prev.doses, ""],
                    }))
                  }
                >
                  <Lucide icon="Plus"></Lucide>
                </button>
              )}
            </div>
          ))}

          {/* show error below if any */}
          {formErrors.doses && (
            <p className="text-red-500 text-left text-sm">{formErrors.doses}</p>
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
  );
};

export default Main;
