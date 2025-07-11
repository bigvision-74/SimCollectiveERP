import React from "react";
import { Patient } from "@/types/patient";

interface PatientSummaryProps {
  data?: Patient;
}

const PatientSummary: React.FC<PatientSummaryProps> = ({ data }) => {
  if (!data) return <div>Loading patient summary...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* General Information */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4 underline">General Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {data.name}</p>
          <p><strong>Age:</strong> {calculateAge(data.dateOfBirth)}</p>
          <p><strong>Gender:</strong> {data.gender}</p>
          <p><strong>Phone:</strong> {data.phone}</p>
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Address:</strong> {data.address}</p>
          <p><strong>Category:</strong> {data.category}</p>
          <p><strong>Location:</strong> {data.scenarioLocation || "-"}</p>
          <p><strong>Room Type:</strong> {data.roomType || "-"}</p>
        </div>
      </div>

      {/* Clinical Info */}
      <div className="rounded-md border p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold underline">Clinical Information</h2>
        </div>
        <div className="space-y-2">
          <p><strong>Height:</strong> {data.height ?? "-"} cm</p>
          <p><strong>Weight:</strong> {data.weight ?? "-"} kg</p>
          <p><strong>Ethnicity:</strong> {data.ethnicity}</p>
          <p><strong>Patient Assessment:</strong> {data.patientAssessment || "-"}</p>
          <p><strong>Team Roles:</strong> {data.healthcareTeamRoles || "-"}</p>
          <p><strong>Team Traits:</strong> {data.teamTraits || "-"}</p>
          <p><strong>EDD:</strong> Unknown</p>
        </div>
      </div>

      {/* Social & Medical Background */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Social & Medical Background</h2>
        <div className="space-y-2">
          <p><strong>Social Economic History:</strong> {data.socialEconomicHistory || "-"}</p>
          <p><strong>Family Medical History:</strong> {data.familyMedicalHistory || "-"}</p>
          <p><strong>Lifestyle & Home Situation:</strong> {data.lifestyleAndHomeSituation || "-"}</p>
        </div>
      </div>

      {/* Equipment & Tests */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Equipment & Tests</h2>
        <div className="space-y-2">
          <p><strong>Medical Equipment:</strong> {data.medicalEquipment || "-"}</p>
          <p><strong>Pharmaceuticals:</strong> {data.pharmaceuticals || "-"}</p>
          <p><strong>Diagnostic Equipment:</strong> {data.diagnosticEquipment || "-"}</p>
          <p><strong>Blood Tests:</strong> {data.bloodTests || "-"}</p>
        </div>
      </div>

      {/* Observations */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Observations</h2>
        <div className="space-y-2">
          <p><strong>Initial Admission Observations:</strong> {data.initialAdmissionObservations || "-"}</p>
          <p><strong>Expected Observations (Acute):</strong> {data.expectedObservationsForAcuteCondition || "-"}</p>
          <p><strong>Recommended Observations During Event:</strong> {data.recommendedObservationsDuringEvent || "-"}</p>
          <p><strong>Observation Results (Recovery):</strong> {data.observationResultsRecovery || "-"}</p>
          <p><strong>Observation Results (Deterioration):</strong> {data.observationResultsDeterioration || "-"}</p>
        </div>
      </div>

      {/* Diagnosis & Treatment */}
      <div className="rounded-md border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Diagnosis & Treatment</h2>
        <div className="space-y-2">
          <p><strong>Recommended Diagnostic Tests:</strong> {data.recommendedDiagnosticTests || "-"}</p>
          <p><strong>Treatment Algorithm:</strong> {data.treatmentAlgorithm || "-"}</p>
          <p><strong>Correct Treatment:</strong> {data.correctTreatment || "-"}</p>
          <p><strong>Expected Outcome:</strong> {data.expectedOutcome || "-"}</p>
        </div>
      </div>
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
