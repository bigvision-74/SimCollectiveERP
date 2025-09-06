import React, { useEffect, useState } from "react";
import { Patient } from "@/types/patient";
import { t } from "i18next";
import { getAdminOrgAction } from "@/actions/adminActions";

interface PatientSummaryProps {
  data?: Patient;
}

const PatientSummary: React.FC<PatientSummaryProps> = ({ data }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const useremail = localStorage.getItem("user");
        if (useremail) {
          const userData = await getAdminOrgAction(String(useremail));
          setCurrentUserId(userData?.uid || null);
          setUserRole(userData?.role || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  if (!data) return <div>{t("Loadingpatientsummary")}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* General Information */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold text-primary mb-4">
          {t("GeneralInformation")}
        </h2>
        <div className="space-y-2">
          <p>
            <strong>{t("name")}:</strong> {data.name}
          </p>
          <p>
            <strong>{t("gender")}:</strong> {data.gender}
          </p>
          <p>
            <strong>{t("phone")}:</strong> {data.phone}
          </p>
          <p>
            <strong>{t("email")}:</strong> {data.email}
          </p>
          <p>
            <strong>{t("address")}:</strong> {data.address}
          </p>
          <p>
            <strong>{t("category")}:</strong> {data.category}
          </p>
          <p>
            <strong>{t("location")}:</strong> {data.scenarioLocation || "-"}
          </p>
          <p>
            <strong>{t("room_type")}:</strong> {data.roomType || "-"}
          </p>
        </div>
      </div>

      {/* Clinical Info */}
      <div className="rounded-md border p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary">
            {t("ClinicalInformation")}
          </h2>
        </div>
        <div className="space-y-2">
          <p>
            <strong>{t("height")}:</strong> {data.height ?? "-"} {t("cm")}
          </p>
          <p>
            <strong>{t("weight")}:</strong> {data.weight ?? "-"} {t("kg")}
          </p>
          <p>
            <strong>{t("dob")}:</strong> {data.date_of_birth ?? "-"}{" "}
          </p>
          <p>
            <strong>{t("ethnicity")}:</strong> {data.ethnicity ?? "-"}
          </p>
          {userRole !== "User" && (
            <p>
              <strong>{t("patient_assessment")}:</strong>{" "}
              {data.patientAssessment ?? "-"}
            </p>
          )}
          <p>
            <strong>{t("team_roles")}:</strong>{" "}
            {data.healthcareTeamRoles ?? "-"}
          </p>
          <p>
            <strong>{t("team_traits")}:</strong> {data.teamTraits ?? "-"}
          </p>
        </div>
      </div>

      {/* Social & Medical Background */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4 text-primary">
          {t("SocialMedicalBackground")}
        </h2>
        <div className="space-y-2">
          <p>
            <strong>{t("social_economic_history")}:</strong>{" "}
            {data.socialEconomicHistory || "-"}
          </p>
          <p>
            <strong>{t("family_medical_history")}:</strong>{" "}
            {data.familyMedicalHistory || "-"}
          </p>
          <p>
            <strong>{t("lifestyle_home_situation")}:</strong>{" "}
            {data.lifestyleAndHomeSituation || "-"}
          </p>
        </div>
      </div>

      {/* Equipment & Tests */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4 text-primary">
          {t("EquipmentTests")}
        </h2>
        <div className="space-y-2">
          <p>
            <strong>{t("medical_equipment")}:</strong>{" "}
            {data.medicalEquipment || "-"}
          </p>
          <p>
            <strong>{t("pharmaceuticals")}:</strong>{" "}
            {data.pharmaceuticals || "-"}
          </p>
          <p>
            <strong>{t("diagnostic_equipment")}:</strong>{" "}
            {data.diagnosticEquipment || "-"}
          </p>
          <p>
            <strong>{t("blood_tests")}:</strong> {data.bloodTests || "-"}
          </p>
        </div>
      </div>

      {/* Observations - only for non-user roles */}
      {userRole !== "User" && (
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-primary">
            {t("Observations")}
          </h2>
          <div className="space-y-2">
            <p className="break-words">
              <strong>{t("observations.initial_admission")}:</strong>{" "}
              {data.initialAdmissionObservations || "-"}
            </p>
            <p className="break-words">
              <strong>{t("observations.expected_acute")}:</strong>{" "}
              {data.expectedObservationsForAcuteCondition || "-"}
            </p>
            <p className="break-words">
              <strong>{t("observations.recommended_during_event")}:</strong>{" "}
              {data.recommendedObservationsDuringEvent || "-"}
            </p>
            <p className="break-words">
              <strong>{t("observations.results_recovery")}:</strong>{" "}
              {data.observationResultsRecovery || "-"}
            </p>
            <p className="break-words">
              <strong>{t("observations.results_deterioration")}:</strong>{" "}
              {data.observationResultsDeterioration || "-"}
            </p>
          </div>
        </div>
      )}

      {/* Diagnosis & Treatment - only for non-user roles */}
      {userRole !== "User" && (
        <div className="rounded-md border p-5 shadow-sm">
          <h2 className="font-semibold mb-4 text-primary">
            {t("DiagnosisTreatment")}
          </h2>
          <div className="space-y-2">
            <p>
              <strong>{t("treatment.recommended_diagnostics")}:</strong>{" "}
              {data.recommendedDiagnosticTests || "-"}
            </p>
            <p>
              <strong>{t("treatment.algorithm")}:</strong>{" "}
              {data.treatmentAlgorithm || "-"}
            </p>
            <p>
              <strong>{t("treatment.correct")}:</strong>{" "}
              {data.correctTreatment || "-"}
            </p>
            <p>
              <strong>{t("treatment.expected_outcome")}:</strong>{" "}
              {data.expectedOutcome || "-"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility: Calculate age
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default PatientSummary;
