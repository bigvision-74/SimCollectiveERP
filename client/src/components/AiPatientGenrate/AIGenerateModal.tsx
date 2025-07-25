import { useState, useEffect } from "react";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";
import { FormCheck } from "@/components/Base/Form";
import {
  generateAIPatientAction,
  saveGeneratedPatientsAction,
} from "@/actions/patientActions";
import { getAllOrgAction } from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
import { getAdminOrgAction } from "@/actions/adminActions";

// Conditions mapped by Speciality
const specialityToConditions: Record<string, string[]> = {
  "Cardiovascular Conditions": [
    "Acute Myocardial Infarction (Heart Attack)",
    "Cardiac Arrest",
    "Acute Heart Failure",
    "Hypertensive Crisis",
    "Acute Pericarditis",
    "Atrial Fibrillation (New-Onset or Rapid Ventricular Response)",
    "Deep Vein Thrombosis (DVT)",
    "Pulmonary Embolism",
    "Aortic Dissection",
    "Acute Limb Ischaemia",
  ],
  "Respiratory Conditions": [
    "Acute Respiratory Distress Syndrome (ARDS)",
    "Severe Asthma Exacerbation",
    "Chronic Obstructive Pulmonary Disease (COPD) Exacerbation",
    "Pneumonia (Community-Acquired or Hospital-Acquired)",
    "Pneumothorax",
    "Pleural Effusion",
    "Pulmonary Oedema",
    "Foreign Body Airway Obstruction",
    "Respiratory Failure (Hypoxic or Hypercapnic)",
    "Bronchiolitis (in children)",
  ],
  "Neurological Conditions": [
    "Stroke (Ischaemic or Haemorrhagic)",
    "Transient Ischaemic Attack (TIA)",
    "Seizures (New-Onset or Status Epilepticus)",
    "Meningitis",
    "Encephalitis",
    "Guillain-Barré Syndrome",
    "Subarachnoid Haemorrhage",
    "Traumatic Brain Injury (TBI)",
    "Acute Confusional State (Delirium)",
    "Acute Spinal Cord Compression",
  ],
  "Gastrointestinal Conditions": [
    "Acute Appendicitis",
    "Acute Pancreatitis",
    "Acute Cholecystitis",
    "Gastrointestinal Bleeding (Upper or Lower)",
    "Bowel Obstruction",
    "Diverticulitis",
    "Mesenteric Ischaemia",
    "Hepatic Encephalopathy",
    "Perforated Viscus",
    "Acute Hepatitis",
  ],
  "Renal and Genitourinary Conditions": [
    "Acute Kidney Injury (AKI)",
    "Urinary Retention",
    "Urosepsis",
    "Acute Pyelonephritis",
    "Renal Colic (Kidney Stones)",
    "Rhabdomyolysis",
    "Acute Prostatitis",
    "Testicular Torsion",
  ],
  "Infectious Diseases": [
    "Sepsis",
    "Septic Shock",
    "Cellulitis",
    "Necrotizing Fasciitis",
    "Endocarditis",
    "Osteomyelitis",
    "Tuberculosis (TB)",
    "Covid-19 (Severe Presentation)",
    "Dengue Fever",
    "Malaria",
  ],
  "Endocrine and Metabolic Conditions": [
    "Diabetic Ketoacidosis (DKA)",
    "Hyperosmolar Hyperglycaemic State (HHS)",
    "Addisonian Crisis",
    "Thyroid Storm",
    "Hypoglycaemia",
    "Electrolyte Imbalance (e.g., Hyperkalemia, Hyponatremia)",
  ],
  "Hematological Conditions": [
    "Sickle Cell Crisis",
    "Acute Anemia (Severe Blood Loss or Haemolysis)",
    "Thrombocytopenia",
    "Acute Leukaemia Presentation",
    "Disseminated Intravascular Coagulation (DIC)",
  ],
  "Obstetric and Gynaecological Conditions": [
    "Eclampsia",
    "Pre-eclampsia",
    "Postpartum Hemorrhage",
    "Placental Abruption",
    "Miscarriage",
    "Ectopic Pregnancy",
    "Bronchiolitis",
  ],
  "Paediatric Conditions": [
    "Croup",
    "Sepsis (Neonatal and Paediatric)",
    "Febrile Seizures",
    "Intussusception",
    "Neonatal Jaundice",
    "Respiratory Syncytial Virus (RSV) Infection",
    "Meningitis (Bacterial or Viral)",
    "Kawasaki Disease",
  ],
  "Trauma and Surgical Emergencies": [
    "Major Trauma (Polytrauma)",
    "Burns (Chemical, Electrical, or Thermal)",
    "Fractures (Open or Closed)",
    "Acute Compartment Syndrome",
    "Abdominal Trauma",
    "Penetrating Chest Trauma",
    "Facial Trauma",
    "Spinal Trauma",
  ],
  "Toxicological and Overdose Conditions": [
    "Drug Overdose (Opioids, Benzodiazepines, etc.)",
    "Poisoning (Carbon Monoxide, Organophosphates, etc.)",
    "Alcohol Withdrawal Delirium (Delirium Tremens)",
    "Acute Lithium Toxicity",
    "Paracetamol Overdose",
  ],
  "Allergic and Immune Conditions": [
    "Anaphylaxis",
    "Angioedema",
    "Acute Exacerbation of Autoimmune Disease (e.g., Lupus Flare)",
  ],
};

const AIGenerateModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [gender, setGender] = useState("");
  const [department, setDepartment] = useState("");
  const [room, setRoom] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [condition, setCondition] = useState("");
  const [numberOfRecords, setNumberOfRecords] = useState(1);
  const conditionOptions = specialityToConditions[speciality] || [];
  const [generatedPatients, setGeneratedPatients] = useState<any[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [orgId, setOrgId] = useState("");
  const user = localStorage.getItem("role");

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const fetchOrg = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setOrgId(userData.orgid);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (user != "Superadmin") {
      fetchOrg();
    }
  }, []);

  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = {
        gender,
        room,
        speciality,
        condition,
        department,
        count: numberOfRecords,
      };

      const response = await generateAIPatientAction(data);

      setGeneratedPatients(response.data);
    } catch (err) {
      console.error("Error generating patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setGeneratedPatients([]);
    }
  }, [open]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await getAllOrgAction();

        setOrganizations(response || []);
      } catch (error) {
        console.error(" Failed to fetch organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  const [formErrors, setFormErrors] = useState({
    organizationId: false,
    gender: false,
    department: false,
    room: false,
    speciality: false,
    condition: false,
  });

  const validateForm = () => {
    const errors = {
      organizationId: user === "Superadmin" && organizationId === "",
      gender: gender === "",
      department: department === "",
      room: room === "",
      speciality: speciality === "",
      condition: condition === "",
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSave = async () => {
    let selectedPatients = selectedIndexes.map((i) => generatedPatients[i]);

    selectedPatients = selectedPatients.map((p) => ({
      ...p,
      organisationId: organizationId ? organizationId : orgId,
    }));

    try {
      const response = await saveGeneratedPatientsAction(selectedPatients);

      setSelectedIndexes([]);
      onClose();

      setShowAlert({
        variant: "success",
        message: response.message || "Patients saved successfully!",
      });

      setTimeout(() => {
        setShowAlert(null);
        onClose();
        setTimeout(() => window.location.reload(), 300);
      }, 3000);
    } catch (err) {
      console.error("Error saving patients:", err);
      setShowAlert({
        variant: "danger",
        message: "Failed to save Patients",
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <Dialog size="xl" open={open} onClose={() => {}} static>
        <Dialog.Panel className="p-10 relative">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="absolute top-0 right-0 mt-3 mr-3"
          >
            <Lucide icon="X" className="w-6 h-6 text-slate-400" />
          </a>

          <div className="intro-y box mt-3">
            <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
              <h2 className="mr-auto text-base font-medium">
                {t("generate_case_scenario")}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Organization Dropdown (replacing gender) */}
              {user === "Superadmin" && (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <FormLabel
                        htmlFor="organization_id"
                        className="font-bold"
                      >
                        {t("organization")}
                      </FormLabel>
                    </div>
                    <FormSelect
                      id="organization_id"
                      name="organization_id"
                      value={organizationId}
                      onChange={(e) => {
                        setOrganizationId(e.target.value);
                        setFormErrors((prev) => ({
                          ...prev,
                          organizationId: false,
                        })); // clear error
                      }}
                      className={
                        formErrors.organizationId ? "border-red-500" : ""
                      }
                    >
                      <option value="">{t("_select_organisation_")}</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                </>
              )}
              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("gender")}
                </FormLabel>
                <FormSelect
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    setFormErrors((prev) => ({ ...prev, gender: false })); // clear error on change
                  }}
                  className={formErrors.gender ? "border-red-500" : ""}
                >
                  <option value="">{t("select_gender")}</option>
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                  <option value="Transgender Male">{t("trans_male")}</option>
                  <option value="Transgender Female">
                    {t("trans_female")}
                  </option>
                  <option value="Non-Binary">{t("non_binary")}</option>
                  <option value="Genderqueer">{t("genderqueer")}</option>
                  <option value="Genderfluid">{t("genderfluid")}</option>
                  <option value="Agender">{t("agender")}</option>
                  <option value="Bigender">{t("bigender")}</option>
                  <option value="Two-Spirit">{t("two_spirit")}</option>
                  <option value="Demiboy">{t("demiboy")}</option>
                  <option value="Demigirl">{t("demigirl")}</option>
                  <option value="Androgynous">{t("androgynous")}</option>
                  <option value="Intersex">{t("intersex")}</option>
                  <option value="Neutrois">{t("neutrois")}</option>
                  <option value="Pangender">{t("pangender")}</option>
                  <option value="Gender Nonconforming">
                    {t("nonconforming")}
                  </option>
                  <option value="Questioning">{t("questioning")}</option>
                </FormSelect>
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("department")}
                </FormLabel>
                <FormSelect
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setFormErrors((prev) => ({ ...prev, department: false })); // clear error
                  }}
                  className={formErrors.department ? "border-red-500" : ""}
                >
                  <option value="">{t("_select_department_")}</option>
                  <option value="Emergency & Acute Care">
                    {t("emergency_acute_care")}
                  </option>
                  <option value="Critical Care">{t("critical_care")}</option>
                  <option value="Operating & Surgical Areas">
                    {t("operating_surgical_areas")}
                  </option>
                  <option value="Maternity & Obstetrics">
                    {t("maternity_obstetrics")}
                  </option>
                  <option value="Paediatrics">{t("paediatrics")}</option>
                  <option value="Outpatient & Clinics">
                    {t("outpatient_clinics")}
                  </option>
                  <option value="Diagnostic Imaging">
                    {t("diagnostic_imaging")}
                  </option>
                  <option value="Inpatient Wards">
                    {t("inpatient_wards")}
                  </option>
                  <option value="Mental Health & Psychiatry">
                    {t("mental_health_psychiatry")}
                  </option>
                  <option value="Oncology & Haematology">
                    {t("oncology_haematology")}
                  </option>
                  <option value="Dialysis & Renal">
                    {t("dialysis_renal")}
                  </option>
                  <option value="Pharmacy & Laboratory">
                    {t("pharmacy_laboratory")}
                  </option>
                  <option value="Other Clinical Rooms">
                    {t("other_clinical_rooms")}
                  </option>
                  <option value="Infection Control">
                    {t("infection_control")}
                  </option>
                  <option value="Support & Recovery Areas">
                    {t("support_recovery_areas")}
                  </option>
                </FormSelect>
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("room")}
                </FormLabel>
                <FormInput
                  type="text"
                  value={room}
                  onChange={(e) => {
                    setRoom(e.target.value);
                    setFormErrors((prev) => ({ ...prev, room: false })); // clear error on change
                  }}
                  placeholder="Enter room number"
                  className={formErrors.room ? "border-red-500" : ""}
                />
                {formErrors.room && (
                  <p className="text-red-500 text-sm mt-1">Room is required.</p>
                )}
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("speciality")}
                </FormLabel>
                <FormSelect
                  value={speciality}
                  onChange={(e) => {
                    setSpeciality(e.target.value);
                    setCondition(""); // Reset condition when speciality changes
                    setFormErrors((prev) => ({ ...prev, speciality: false })); // clear error
                  }}
                  className={formErrors.speciality ? "border-red-500" : ""}
                >
                  <option value="">{t("_Select_Speciality_")}</option>
                  {Object.keys(specialityToConditions).map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("condition")}
                </FormLabel>
                <FormSelect
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={!speciality}
                >
                  <option value="">{t("_Select_Condition_")}</option>
                  {conditionOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FormLabel className="block font-medium mb-1">
                  {t("number_of_records")}
                </FormLabel>
                <FormInput
                  type="number"
                  value={numberOfRecords}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 5) val = 5;
                    setNumberOfRecords(val);
                  }}
                  min={1}
                  max={5}
                />
              </div>

              <div className="text-right pt-4">
                <Button
                  variant="primary"
                  className="w-32"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? t("generating...") : t("generate")}
                </Button>
              </div>
            </div>

            {/* Generated patient display */}
            {generatedPatients.length > 0 && (
              <div className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("generated_patients")}
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedPatients.map((patient, index) => (
                    <div
                      key={index}
                      className="p-4 rounded border border-slate-300 bg-slate-100 dark:bg-darkmode-600 space-y-1"
                    >
                      <div className="flex items-center mb-2">
                        <FormCheck.Input
                          type="checkbox"
                          checked={selectedIndexes.includes(index)}
                          onChange={() => handleCheckboxChange(index)}
                          className="mr-2"
                        />
                        <strong>Patient #{index + 1}</strong>
                      </div>
                      {[
                        ["Name", patient.name],
                        ["Email", patient.email],
                        ["Phone", patient.phone],
                        ["DOB", patient.dateOfBirth],
                        ["Gender", patient.gender],
                        ["Room", patient.roomType],
                        ["Department", patient.scenarioLocation],
                        ["Speciality", patient.category],
                        ["Condition", patient.condition],
                        ["Height", patient.height],
                        ["Weight", patient.weight],
                        ["Blood Tests", patient.bloodTests],
                        ["Observations", patient.initialAdmissionObservations],
                        [
                          "Expected Observations",
                          patient.expectedObservationsForAcuteCondition,
                        ],
                        ["Outcome", patient.expectedOutcome],
                        ["Assessment", patient.patientAssessment],
                        ["Pharmaceuticals", patient.pharmaceuticals],
                        ["Treatment Algorithm", patient.treatmentAlgorithm],
                        ["Team Roles", patient.healthcareTeamRoles],
                        ["Traits", patient.teamTraits],
                        ["Diagnostic Equipment", patient.diagnosticEquipment],
                        [
                          "Recommended Tests",
                          patient.recommendedDiagnosticTests,
                        ],
                        [
                          "Monitoring",
                          patient.recommendedObservationsDuringEvent,
                        ],
                        [
                          "Recovery Results",
                          patient.observationResultsRecovery,
                        ],
                        [
                          "Deterioration Results",
                          patient.observationResultsDeterioration,
                        ],
                        [
                          "Social/Economic History",
                          patient.socialEconomicHistory,
                        ],
                        [
                          "Family Medical History",
                          patient.familyMedicalHistory,
                        ],
                        [
                          "Lifestyle & Home Situation",
                          patient.lifestyleAndHomeSituation,
                        ],
                      ].map(([label, value]) =>
                        value ? (
                          <div key={label}>
                            <strong>{label}:</strong>{" "}
                            {typeof value === "object" ? (
                              Array.isArray(value) ? (
                                value.join(", ")
                              ) : (
                                <div className="pl-4">
                                  {Object.entries(value).map(([k, v]) => (
                                    <div key={k}>
                                      <strong>{k}:</strong> {String(value)}
                                    </div>
                                  ))}
                                </div>
                              )
                            ) : (
                              value
                            )}
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
                </div>
                {selectedIndexes.length > 0 && (
                  <div className="pt-4 text-right">
                    <button
                      className="bg-primary text-white font-semibold py-2 px-4 rounded"
                      onClick={handleSave}
                    >
                      {t("save_selected")} ({selectedIndexes.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default AIGenerateModal;
