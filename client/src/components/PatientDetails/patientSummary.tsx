import React, { useEffect, useState } from "react";
import { Patient } from "@/types/patient";
import { t } from "i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import { useAppContext } from "@/contexts/sessionContext";
import { FormSwitch, FormLabel } from "../Base/Form";

type VisibilitySection =
  | "patientAssessment"
  | "observations"
  | "diagnosisAndTreatment";

interface PatientSummaryProps {
  data?: Patient;
}

const PatientSummary: React.FC<PatientSummaryProps> = ({ data }) => {
  const [userRole, setUserRole] = useState<string | null>(null);

  const { socket, sessionInfo, visibilityState, setVisibilityState } =
    useAppContext();
  const isSessionActive = sessionInfo.isActive && sessionInfo.patientId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const useremail = localStorage.getItem("user");
        if (useremail) {
          const userData = await getAdminOrgAction(String(useremail));
          setUserRole(userData?.role || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUser();
  }, []);

  if (!data) return <div>{t("Loadingpatientsummary")}</div>;

  const canToggleVisibility = userRole === "Faculty" && isSessionActive;

  const handleToggleVisibility = (section: VisibilitySection) => {
    const newState = !visibilityState[section];

    setVisibilityState((prevState) => ({
      ...prevState,
      [section]: newState,
    }));

    if (socket && sessionInfo.sessionId) {
      socket.emit("session:change-visibility", {
        sessionId: sessionInfo.sessionId,
        section: section,
        isVisible: newState,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold text-primary mb-4">
          {t("ClinicalInformation")}
        </h2>

        {/* --- Primary Clinical Data --- */}
        <div className="space-y-2">
          <p>
            <strong>{t("height")}:</strong> {data.height ?? "-"} {t("cm")}
          </p>
          <p>
            <strong>{t("weight")}:</strong> {data.weight ?? "-"} {t("kg")}
          </p>
          <p>
            <strong>{t("dob")}:</strong> {data.date_of_birth ?? "-"}
          </p>
          <p>
            <strong>{t("ethnicity")}:</strong> {data.ethnicity ?? "-"}
          </p>
          <p>
            <strong>{t("team_roles")}:</strong>{" "}
            {data.healthcareTeamRoles ?? "-"}
          </p>
          <p>
            <strong>{t("team_traits")}:</strong> {data.teamTraits ?? "-"}
          </p>
        </div>

        {/* --- Patient Assessment Subsection --- */}
        {/* This entire block is only rendered if the user has permission to see it */}
        {(userRole !== "User" || visibilityState.patientAssessment) && (
          <div className="mt-4 pt-4 border-t">
            {" "}
            {/* Visual separator */}
            <div className="flex justify-between items-center">
              <strong>{t("patient_assessment")}</strong>

              {/* The toggle is only rendered for the Faculty view */}
              {canToggleVisibility && (
                <div className="flex items-center">
                  <FormSwitch.Input
                    id="assessment-visibility"
                    type="checkbox"
                    checked={visibilityState.patientAssessment}
                    onChange={() => handleToggleVisibility("patientAssessment")}
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
              {data.patientAssessment ?? "-"}
            </p>
          </div>
        )}
      </div>

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

      {(userRole !== "User" || visibilityState.observations) && (
        <div className="rounded-md border p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-primary">{t("Observations")}</h2>
            {canToggleVisibility && (
              <div className="flex items-center">
                <FormSwitch.Input
                  id="observations-visibility"
                  type="checkbox"
                  checked={visibilityState.observations}
                  onChange={() => handleToggleVisibility("observations")}
                />
                <FormLabel htmlFor="observations-visibility" className="ml-2">
                  {visibilityState.observations
                    ? t("VisibleToUser")
                    : t("HiddenFromUser")}
                </FormLabel>
              </div>
            )}
          </div>
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

      {(userRole !== "User" || visibilityState.diagnosisAndTreatment) && (
        <div className="rounded-md border p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold mb-4 text-primary">
              {t("DiagnosisTreatment")}
            </h2>
            {canToggleVisibility && (
              <div className="flex items-center">
                <FormSwitch.Input
                  id="diagnosis-visibility"
                  type="checkbox"
                  checked={visibilityState.diagnosisAndTreatment}
                  onChange={() =>
                    handleToggleVisibility("diagnosisAndTreatment")
                  }
                />
                <FormLabel htmlFor="diagnosis-visibility" className="ml-2">
                  {visibilityState.diagnosisAndTreatment
                    ? t("VisibleToUser")
                    : t("HiddenFromUser")}
                </FormLabel>
              </div>
            )}
          </div>
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

export default PatientSummary;
