export interface Patient {
    date_of_birth: string;
    id: number;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    category: string;
    ethnicity: string;
    height?: number;
    weight?: number;
    scenarioLocation?: string;
    roomType?: string;

    socialEconomicHistory?: string;
    familyMedicalHistory?: string;
    lifestyleAndHomeSituation?: string;

    medicalEquipment?: string;
    pharmaceuticals?: string;
    diagnosticEquipment?: string;

    bloodTests?: string;
    initialAdmissionObservations?: string;
    expectedObservationsForAcuteCondition?: string;

    patientAssessment?: string;
    recommendedObservationsDuringEvent?: string;
    observationResultsRecovery?: string;
    observationResultsDeterioration?: string;

    recommendedDiagnosticTests?: string;
    treatmentAlgorithm?: string;
    correctTreatment?: string;
    expectedOutcome?: string;

    healthcareTeamRoles?: string;
    teamTraits?: string;
}
