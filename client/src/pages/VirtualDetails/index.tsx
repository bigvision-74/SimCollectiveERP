import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { getAllPatientsAction } from "@/actions/patientActions";
import { FormSwitch, FormLabel } from "@/components/Base/Form";

type VisibilitySection =
  | "patientAssessment"
  | "observations"
  | "diagnosisAndTreatment";

const VirtualDetails: React.FC = () => {
  const location = useLocation();
  const sessionData = location.state || {}; // sessionData passed from SessionTable
  const [patientData, setPatientData] = useState<any>({});

  // Temp static role & visibility (can extend to real roles later)
  const userRole = "Superadmin";
  const [visibilityState, setVisibilityState] = useState({
    patientAssessment: true,
    observations: true,
    diagnosisAndTreatment: true,
  });
  const canToggleVisibility = false; // Only for example
  const handleToggleVisibility = (section: VisibilitySection) => {};

  useEffect(() => {
    // Fetch patient info from ID if available
    const fetchPatient = async () => {
      if (!sessionData.patient) return;
      try {
        const patients = await getAllPatientsAction();
        const patient = patients.find((p: any) => p.id === sessionData.patient);
        setPatientData(patient || {});
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatient();
  }, [sessionData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode-800 p-5">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* General Information */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-4">
            {t("GeneralInformation")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Session Name")}:</strong>{" "}
              {sessionData.sessionName || "-"}
            </p>
            <p>
              <strong>{t("Patient Type")}:</strong>{" "}
              {sessionData.patientType || "-"}
            </p>
            <p>
              <strong>{t("Room Type")}:</strong> {sessionData.roomType || "-"}
            </p>
            <p>
              <strong>{t("Patient Name")}:</strong>{" "}
              {patientData?.name ||
                `${patientData?.first_name || ""} ${
                  patientData?.last_name || ""
                }` ||
                "-"}
            </p>
            <p>
              <strong>{t("Gender")}:</strong> {patientData?.gender || "-"}
            </p>
            <p>
              <strong>{t("Phone")}:</strong> {patientData?.phone || "-"}
            </p>
            <p>
              <strong>{t("Email")}:</strong> {patientData?.email || "-"}
            </p>
            <p>
              <strong>{t("Address")}:</strong> {patientData?.address || "-"}
            </p>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-4">
            {t("ClinicalInformation")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Height")}:</strong> {patientData?.height ?? "-"}{" "}
              {t("cm")}
            </p>
            <p>
              <strong>{t("Weight")}:</strong> {patientData?.weight ?? "-"}{" "}
              {t("kg")}
            </p>
            <p>
              <strong>{t("DOB")}:</strong> {patientData?.date_of_birth ?? "-"}
            </p>
            <p>
              <strong>{t("Ethnicity")}:</strong> {patientData?.ethnicity ?? "-"}
            </p>
            <p>
              <strong>{t("Nationality")}:</strong>{" "}
              {patientData?.nationality ?? "-"}
            </p>
            <p>
              <strong>{t("Team Roles")}:</strong>{" "}
              {patientData?.healthcareTeamRoles ?? "-"}
            </p>
            <p>
              <strong>{t("Team Traits")}:</strong>{" "}
              {patientData?.teamTraits ?? "-"}
            </p>

            <div className="mt-2">
              <div className="flex justify-between items-center">
                <strong>{t("Patient Assessment")}</strong>
                {canToggleVisibility && (
                  <div className="flex items-center">
                    <FormSwitch.Input
                      id="assessment-visibility"
                      type="checkbox"
                      checked={visibilityState.patientAssessment}
                      onChange={() =>
                        handleToggleVisibility("patientAssessment")
                      }
                    />
                    <FormLabel
                      htmlFor="assessment-visibility"
                      className="ml-2 text-sm"
                    >
                      {visibilityState.patientAssessment
                        ? t("VisibleToUser")
                        : t("HiddenFromUser")}
                    </FormLabel>
                  </div>
                )}
              </div>
              <p className="mt-2 text-slate-600">
                {patientData.patientAssessment || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Social / Medical Background */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-primary">
            {t("SocialMedicalBackground")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Social / Economic History")}:</strong>{" "}
              {patientData.socialEconomicHistory || "-"}
            </p>
            <p>
              <strong>{t("Family Medical History")}:</strong>{" "}
              {patientData.familyMedicalHistory || "-"}
            </p>
            <p>
              <strong>{t("Lifestyle / Home Situation")}:</strong>{" "}
              {patientData.lifestyleAndHomeSituation || "-"}
            </p>
          </div>
        </div>

        {/* Equipment / Tests */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-primary">
            {t("EquipmentTests")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Medical Equipment")}:</strong>{" "}
              {patientData.medicalEquipment || "-"}
            </p>
            <p>
              <strong>{t("Pharmaceuticals")}:</strong>{" "}
              {patientData.pharmaceuticals || "-"}
            </p>
            <p>
              <strong>{t("Diagnostic Equipment")}:</strong>{" "}
              {patientData.diagnosticEquipment || "-"}
            </p>
            <p>
              <strong>{t("Blood Tests")}:</strong>{" "}
              {patientData.bloodTests || "-"}
            </p>
          </div>
        </div>

        {/* Observations */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold text-primary mb-4">
            {t("Observations")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Initial Admission")}:</strong>{" "}
              {patientData.initialAdmissionObservations || "-"}
            </p>
            <p>
              <strong>{t("Expected Acute")}:</strong>{" "}
              {patientData.expectedObservationsForAcuteCondition || "-"}
            </p>
            <p>
              <strong>{t("Recommended During Event")}:</strong>{" "}
              {patientData.recommendedObservationsDuringEvent || "-"}
            </p>
            <p>
              <strong>{t("Results Recovery")}:</strong>{" "}
              {patientData.observationResultsRecovery || "-"}
            </p>
            <p>
              <strong>{t("Results Deterioration")}:</strong>{" "}
              {patientData.observationResultsDeterioration || "-"}
            </p>
          </div>
        </div>

        {/* Diagnosis / Treatment */}
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-primary">
            {t("DiagnosisTreatment")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("Recommended Diagnostics")}:</strong>{" "}
              {patientData.recommendedDiagnosticTests || "-"}
            </p>
            <p>
              <strong>{t("Algorithm")}:</strong>{" "}
              {patientData.treatmentAlgorithm || "-"}
            </p>
            <p>
              <strong>{t("Correct Treatment")}:</strong>{" "}
              {patientData.correctTreatment || "-"}
            </p>
            <p>
              <strong>{t("Expected Outcome")}:</strong>{" "}
              {patientData.expectedOutcome || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/">
          <Button variant="primary" className="w-32">
            Back
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default VirtualDetails;
