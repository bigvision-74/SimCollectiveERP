import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import { getPatientByIdAction } from "@/actions/patientActions";

import PatientSummary from "@/components/PatientDetails/patientSummary";
import PatientNote from "@/components/PatientDetails/patientNote";
import ObservationsCharts from "@/components/PatientDetails/ObservationsCharts";

function ViewPatientDetails() {
  const { id } = useParams();
  const [selectedPick, setSelectedPick] = useState("PatientSummary");
  const [patientData, setPatientData] = useState<any>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleClick = (option: string) => {
    setSelectedPick(option);
    localStorage.setItem("selectedPick", option);
  };

  const fetchPatient = async () => {
    try {
      const response = await getPatientByIdAction(Number(id));
      setPatientData(response.data);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  useEffect(() => {
    fetchPatient();

    // restore selected tab from localStorage
    const savedTab = localStorage.getItem("selectedPick");
    if (savedTab) {
      setSelectedPick(savedTab);
    }
  }, []);

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patient_details")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5 space-y-2">
              {/* Patient Summary Tab */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "PatientSummary"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("PatientSummary")}
              >
                <Lucide icon="User" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("patient_summary")}</div>
              </div>

              {/* Patient Note Tab */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "PatientNote"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("PatientNote")}
              >
                <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("patient_note")}</div>
              </div>

              {/* Observations & Charts Tab */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  selectedPick === "ObservationsCharts"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("ObservationsCharts")}
              >
                <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">
                  {t("observations_charts")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            {selectedPick === "PatientSummary" && patientData && (
              <PatientSummary data={patientData} />
            )}
            {selectedPick === "PatientNote" && patientData && (
              <PatientNote data={patientData} />
            )}
            {selectedPick === "ObservationsCharts" && patientData && (
              <ObservationsCharts data={patientData} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewPatientDetails;
