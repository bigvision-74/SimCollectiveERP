import React, { useEffect, useState } from "react";
import { FormInput, FormTextarea } from "@/components/Base/Form";
import Button from "../Base/Button";
import {
  addPrescriptionAction,
  getPrescriptionsAction,
  updatePrescriptionAction,
} from "@/actions/patientActions";
import { t } from "i18next";
import Lucide from "../Base/Lucide";
import { getAdminOrgAction } from "@/actions/adminActions";

interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Props {
  patientId: number;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

const Prescriptions: React.FC<Props> = ({ patientId, onShowAlert }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const userrole = localStorage.getItem("role");
  const [searchTerm, setSearchTerm] = useState("");
  //   const [userRole, setUserRole] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState({ title: "", description: "" });
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);

  // form validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: "",
      description: "",
    };

    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // save and update patient presciption function
  const handleAddPrescription = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      const doctorID = userData.uid;

      if (selectedPrescription) {
        await updatePrescriptionAction({
          id: selectedPrescription.id,
          patient_id: patientId,
          doctor_id: doctorID,
          title,
          description,
        });

        onShowAlert({
          variant: "success",
          message: t("Prescription updated successfully"),
        });
      } else {
        // Add logic
        await addPrescriptionAction({
          patient_id: patientId,
          doctor_id: doctorID,
          title,
          description,
        });

        onShowAlert({
          variant: "success",
          message: t("Prescription added successfully"),
        });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedPrescription(null);

      // Reload prescriptions
      const updatedData = await getPrescriptionsAction(patientId);
      setPrescriptions(updatedData);
    } catch (error) {
      console.error("Failed to add/update prescription:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failed to save prescription"),
      });
    } finally {
      setLoading(false);
    }
  };

  //   fecth save pres  display on list
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await getPrescriptionsAction(patientId);
        setPrescriptions(data);
      } catch (error) {
        console.error("Error loading prescriptions:", error);
      }
    };

    if (patientId) fetchPrescriptions();
  }, [patientId]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-r border-gray-200">
        <div className="p-3 sm:p-4 space-y-3">
          <button
            onClick={() => {
              setTitle("");
              setDescription("");
              setSelectedPrescription(null);
              setErrors({ title: "", description: "" });
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm shadow-sm"
          >
            <Lucide icon="Plus" className="w-4 h-4 sm:w-5 sm:h-5" />
            {t("add_prescription")}
          </button>

          {/* Search - responsive */}
          <div className="relative">
            <FormInput
              type="text"
              className="w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Search Prescription..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Lucide
              icon="Search"
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400"
            />
          </div>
        </div>

        {/* Prescription list (filtered by search) */}
        <div className="p-4 space-y-3 border-t border-gray-200">
          {prescriptions
            .filter((p) =>
              `${p.title} ${p.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((prescription) => (
              <div
                key={prescription.id}
                className={`p-3 rounded-lg shadow border ${
                  selectedPrescription?.id === prescription.id
                    ? "border-primary bg-blue-50"
                    : "border-gray-100 bg-white"
                } cursor-pointer`}
                onClick={() => {
                  setSelectedPrescription(prescription);
                  setTitle(prescription.title);
                  setDescription(prescription.description);
                  setErrors({ title: "", description: "" });
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {prescription.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                      {prescription.description}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(prescription.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/*Right side  Add new prec Form Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {selectedPrescription
              ? t("edit_prescription")
              : t("new_prescription")}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("content_title")}
              </label>

              <FormInput
                type="text"
                placeholder="e.g. Antibiotic Course"
                className={`w-full rounded-lg text-xs sm:text-sm ${
                  errors.title ? "border-red-300" : "border-gray-200"
                } focus:ring-1 focus:ring-primary`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("description")}
              </label>
              <FormTextarea
                rows={6}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Write prescription details here..."
                className={`w-full rounded-lg text-xs sm:text-sm ${
                  errors.description ? "border-red-300" : "border-gray-200"
                } focus:ring-1 focus:ring-primary`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleAddPrescription}
                disabled={loading}
                className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
              >
                {loading ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : selectedPrescription ? (
                  t("update_prescription")
                ) : (
                  t("add_prescription")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
