import React, { useState, useEffect } from "react";
import Table from "@/components/Base/Table";
import { FormCheck } from "@/components/Base/Form";
import { Link, useNavigate } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog, Menu } from "@/components/Base/Headless";
import { FormInput, FormSelect } from "@/components/Base/Form";
import { getAllPatientsAction } from "@/actions/patientActions";

const SessionTable = () => {
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(
    new Set()
  );
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const [sessionName, setSessionName] = useState("");
  const [patientType, setPatientType] = useState("");
  const [roomType, setRoomType] = useState("");
  const [patient, setPatient] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState({
    sessionName: false,
    patientType: false,
    roomType: false,
    patient: false,
  });

  const patientTypes = ["Inpatient", "Outpatient"];
  const rooms = [
    "Emergency Department (Triage, Resuscitation Room, Majors, Minors)",
    "Trauma Room",
    "Acute Medical Unit (AMU)",
    "Observation Room",
    "Rapid Assessment Unit",
    "Intensive Care Unit (ICU)",
    "High Dependency Unit (HDU)",
    "Coronary Care Unit (CCU)",
    "Neonatal Intensive Care Unit (NICU)",
    "Paediatric Intensive Care Unit (PICU)",
    "Operating Theatre (General, Orthopaedic, Cardiac, etc.)",
    "Anaesthetic Room",
    "Post-Anaesthesia Care Unit (PACU)",
    "Day Surgery Unit",
    "Endoscopy Suite",
    "Interventional Radiology Room",
    "Maternity Suite (Labour Room, Delivery Room, Recovery Room)",
    "Antenatal Clinic Room",
    "Postnatal Ward",
    "Obstetric Operating Theatre",
    "Paediatric Ward",
    "Paediatric Outpatient Clinic",
    "Child Assessment Unit",
    "General Outpatient Clinic Room",
    "Specialist Clinic Room (Cardiology, Dermatology, Rheumatology, etc.)",
    "Minor Procedures Room",
    "Radiology (X-Ray, CT, MRI, Ultrasound)",
    "Nuclear Medicine Room",
    "Mammography Room",
    "General Medical Ward",
    "Surgical Ward",
    "Oncology Ward",
    "Cardiology Ward",
    "Neurology Ward",
    "Respiratory Ward",
    "Gastroenterology Ward",
    "Haematology Ward",
    "Renal Ward",
    "Orthopaedic Ward",
    "Stroke Unit",
    "Burns Unit",
    "Infectious Diseases Ward",
    "Rehabilitation Ward",
    "Geriatric Ward",
    "Palliative Care Unit",
    "Psychiatric Ward",
    "Seclusion Room",
    "Crisis Assessment Room",
    "Chemotherapy Suite",
    "Radiotherapy Room",
    "Bone Marrow Transplant Unit",
    "Dialysis Unit",
    "Peritoneal Dialysis Room",
    "Pharmacy Preparation Room",
    "Pathology Lab",
    "Blood Bank",
    "Physiotherapy Room",
    "Occupational Therapy Room",
    "Audiology Room",
    "Speech and Language Therapy Room",
    "Nutrition and Dietetics Room",
    "Pain Management Clinic",
    "Dermatology Treatment Room",
    "Ophthalmology Clinic Room",
    "ENT (Ear, Nose, and Throat) Clinic Room",
    "Isolation Room (Negative Pressure)",
    "Decontamination Room",
    "Family Counseling Room",
    "Bereavement Room",
    "Staff Rest Room (Clinical Support)",
  ];

  // fetch patient list
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getAllPatientsAction();
        const completedPatients = res.filter(
          (patient: any) => patient.status === "completed"
        );
        setPatients(completedPatients);
      } catch (err) {
        console.error("Failed to load patients:", err);
      }
    };
    fetchPatients();
  }, []);

  const handleSave = () => {
    const errors = {
      sessionName: !sessionName,
      patientType: !patientType,
      roomType: !roomType,
      patient: !patient,
    };
    setFormErrors(errors);

    if (Object.values(errors).some((e) => e)) return;

    const sessionData = {
      sessionName,
      patientType,
      roomType,
      patient,
    };

    // Save logic here
    console.log({ sessionName, patientType, roomType, patient });
    navigate(`/patients-view/${patient}`, { state: sessionData });
  };

  const dummySessions = [
    {
      id: 1,
      sessionName: "Morning Ward Round",
      patientType: "Inpatient",
      roomType: "General Ward",
      patientName: "John Doe",
    },
    {
      id: 2,
      sessionName: "Emergency Simulation",
      patientType: "Outpatient",
      roomType: "Emergency Room",
      patientName: "Jane Smith",
    },
    {
      id: 3,
      sessionName: "Cardio Case Review",
      patientType: "Inpatient",
      roomType: "ICU",
      patientName: "Robert Brown",
    },
  ];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAllChecked(checked);
    if (checked) {
      setSelectedSessions(new Set(dummySessions.map((s) => s.id)));
    } else {
      setSelectedSessions(new Set());
    }
  };

  const handleRowCheckboxChange = (id: number) => {
    const newSet = new Set(selectedSessions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSessions(newSet);
  };

  return (
    <>
      <div className="col-span-12 overflow-auto intro-y lg:overflow-auto p-5">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y">
          <>
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                className="mr-2 shadow-md"
                // disabled={selectedUsers.size === 0}
                onClick={() => {
                  setShowUpsellModal(true);
                }}
              >
                Add Session
              </Button>
            </div>
          </>
        </div>
        <Table className="border-spacing-y-[10px] border-separate">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                <FormCheck.Input
                  id="select-all"
                  type="checkbox"
                  className="mr-2 border"
                  checked={selectAllChecked}
                  onChange={handleSelectAll}
                />
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                #
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Session Name
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Patient Type
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Room Type
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Patient Name
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dummySessions.map((session, index) => (
              <Table.Tr key={session.id} className="intro-x">
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  <FormCheck.Input
                    id={`session-${session.id}`}
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectedSessions.has(session.id)}
                    onChange={() => handleRowCheckboxChange(session.id)}
                  />
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {index + 1}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.sessionName}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.patientType}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.roomType}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.patientName}
                </Table.Td>
                <Table.Td
                  className={clsx([
                    "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                    "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                  ])}
                >
                  <div className="flex items-center justify-center">
                    <Link to="#" className="flex items-center mr-3">
                      <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />{" "}
                      Edit
                    </Link>
                    <a
                      className="flex items-center text-danger cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Delete ${session.sessionName}?`);
                      }}
                    >
                      <Lucide icon="Trash2" className="w-4 h-4 mr-1" /> Delete
                    </a>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog
        size="xl"
        open={showUpsellModal}
        onClose={() => {
          setShowUpsellModal(false);
        }}
      >
        <Dialog.Panel className="p-10 relative">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="absolute top-0 right-0 mt-3 mr-3"
          >
            ✕
          </a>

          <div className="intro-y box mt-3">
            <div className="flex flex-col items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
              <h2 className="mr-auto text-base font-medium">Create Session</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Session Name */}
              <div>
                <label className="block font-medium mb-1">Session Name</label>
                <FormInput
                  type="text"
                  value={sessionName}
                  onChange={(e) => {
                    setSessionName(e.target.value);
                    setFormErrors((prev) => ({ ...prev, sessionName: false }));
                  }}
                  className={formErrors.sessionName ? "border-red-500" : ""}
                />
                {formErrors.sessionName && (
                  <p className="text-red-500 text-sm mt-1">
                    Session Name is required
                  </p>
                )}
              </div>

              {/* Patient Type */}
              <div>
                <label className="block font-medium mb-1">Patient Type</label>
                <FormSelect
                  value={patientType}
                  onChange={(e) => {
                    setPatientType(e.target.value);
                    setFormErrors((prev) => ({ ...prev, patientType: false }));
                  }}
                  className={formErrors.patientType ? "border-red-500" : ""}
                >
                  <option value="">Select Patient Type</option>
                  {patientTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Room Type */}
              <div>
                <label className="block font-medium mb-1">Room Type</label>
                <FormSelect
                  value={roomType}
                  onChange={(e) => {
                    setRoomType(e.target.value);
                    setFormErrors((prev) => ({ ...prev, roomType: false }));
                  }}
                  className={formErrors.roomType ? "border-red-500" : ""}
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Select Patient */}
              <div>
                <label className="block font-medium mb-1">Select Patient</label>
                <FormSelect
                  value={patient}
                  onChange={(e) => {
                    setPatient(e.target.value);
                    setFormErrors((prev) => ({ ...prev, patient: false }));
                  }}
                  className={formErrors.patient ? "border-red-500" : ""}
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `${p.first_name} ${p.last_name}`}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="text-right pt-4">
                <Button variant="primary" className="w-32" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default SessionTable;
