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
import {
  addVirtualSessionAction,
  deleteVirtualSessionAction,
  getAllVirtualSessionsAction,
} from "@/actions/virtualAction";
import { getAdminOrgAction } from "@/actions/adminActions";
import Alerts from "@/components/Alert";
import { getAllOrgAction } from "@/actions/organisationAction";
import { log } from "console";

interface Organisation {
  id: string;
  name: string;
}

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
  const [sessionTime, setSessionTime] = useState("");

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  const navigate = useNavigate();
  const [virtualSessions, setVirtualSessions] = useState<any[]>([]);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [sessionIdToDelete, setSessionIdToDelete] = useState<number | null>(
    null
  );
  const deleteButtonRef = React.useRef(null);

  const [formErrors, setFormErrors] = useState({
    sessionName: false,
    patientType: false,
    roomType: false,
    patient: false,
    sessionTime: false,
  });

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const patientTypes = ["Child", "Oldman", "Woman"];

  const rooms = ["OT"];

  const times = [
    { label: "5 Minutes", value: "5" },
    { label: "10 Minutes", value: "10" },
    { label: "15 Minutes", value: "15" },
    { label: "30 Minutes", value: "30" },
    { label: "60 Minutes", value: "60" },
    { label: "Unlimited", value: "unlimited" },
  ];

  // fetch all orgination
  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const data = await getAllOrgAction();
        setOrganisations(data);
      } catch (error) {
        console.error("Failed to fetch organisations:", error);
      }
    };

    fetchOrganisations();
  }, []);

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

  // filtered patients based on selected organization
  const filteredPatients = selectedOrg
    ? patients.filter((p) => String(p.organisation_id) === String(selectedOrg))
    : patients;

  console.log(filteredPatients, "filteredPatients");

  // reset patient when org changes
  useEffect(() => {
    setPatient("");
  }, [selectedOrg]);

  // save virtual function
  const handleSave = async () => {
    const useremail = localStorage.getItem("user");
    const userData = await getAdminOrgAction(String(useremail));

    const errors = {
      sessionName: !sessionName,
      patientType: !patientType,
      roomType: !roomType,
      patient: !patient,
      sessionTime: !sessionTime,
      selectedOrg: !selectedOrg,
    };
    setFormErrors(errors);

    if (Object.values(errors).some((e) => e)) return;

    const sessionData = {
      user_id: userData.uid,
      session_name: sessionName,
      patient_type: patientType,
      room_type: roomType,
      selected_patient: patient,
      session_time: sessionTime,
      organisation_id: selectedOrg,
    };

    try {
      const res = await addVirtualSessionAction(sessionData);
      const newSessionId = res?.data;
      console.log(newSessionId, "newSessionId");

      const sessionDataWithId = { sessionId: newSessionId, ...sessionData };

      // Read existing sessions for this patient
      const existingSessions: any[] = JSON.parse(
        localStorage.getItem(`active-sessions-${patient}`) ?? "[]"
      );

      // Add the new session
      existingSessions.push(sessionDataWithId);

      // Save back to localStorage
      localStorage.setItem(
        `active-sessions-${patient}`,
        JSON.stringify(existingSessions)
      );

      navigate(`/patients-view/${patient}`, {
        state: { sessionId: newSessionId, ...sessionData },
      });
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  // after save  virtual value fetch funciton
  useEffect(() => {
    const fetchVirtualSessions = async () => {
      const sessions = await getAllVirtualSessionsAction();
      setVirtualSessions(sessions);
    };
    fetchVirtualSessions();
  }, []);

  // delete virtual session function
  const handleDeleteSession = (id: number) => {
    setSessionIdToDelete(id);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionIdToDelete) return;

    try {
      await deleteVirtualSessionAction(sessionIdToDelete);

      // Remove deleted session from UI
      setVirtualSessions((prev) =>
        prev.filter((session) => session.id !== sessionIdToDelete)
      );

      // Show success alert
      setShowAlert({
        variant: "success",
        message: t("recorddeletesuccess"),
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
      setShowAlert({
        variant: "danger",
        message: t("recorddeletefail"),
      });
    } finally {
      setDeleteConfirmationModal(false);
      setSessionIdToDelete(null);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

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
                {t("add_session")}
              </Button>
            </div>
          </>
        </div>
        <Table className="border-spacing-y-[10px] border-separate">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                #
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("session_name1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("patient_type1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("room_type1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("patient_name1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("action")}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {virtualSessions.map((session, index) => (
              <Table.Tr key={session.id} className="intro-x">
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {index + 1}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.session_name}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.patient_type}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {session.room_type}
                </Table.Td>
                <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                  {patients.find(
                    (p) => String(p.id) === String(session.selected_patient)
                  )?.name || "Unknown"}
                </Table.Td>

                <Table.Td
                  className={clsx([
                    "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                    "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                  ])}
                >
                  <div className="flex items-center justify-center">
                    {/* View Button */}
                    <div
                      onClick={() =>
                        navigate(`/patients-view/${session.selected_patient}`)
                      }
                      className="flex items-center mr-3 cursor-pointer"
                    >
                      <Lucide icon="FileText" className="w-4 h-4 mr-1" />
                      {t("view")}
                    </div>

                    {/* Delete Button */}
                    <a
                      className="flex items-center text-danger cursor-pointer"
                      onClick={(event) => {
                        event.preventDefault();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Lucide icon="Archive" className="w-4 h-4 mr-1" />
                      {t("Archive")}
                    </a>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      {/* create virtual session  dialog box */}
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
                  placeholder="Enter Session Name"
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

              {/* Organization */}
              <div>
                <label className="block font-medium mb-1">Organization</label>
                <FormSelect
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                >
                  <option value="">Select Organisations</option>
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Select Patient */}
              {/* Select Patient */}
              <div>
                <label className="block font-medium mb-1">Select Patient</label>
                <FormSelect
                  value={patient}
                  onChange={(e) => {
                    setPatient(e.target.value);
                    setFormErrors((prev) => ({ ...prev, patient: false }));
                  }}
                  disabled={!selectedOrg} // disable if no org selected
                  className={formErrors.patient ? "border-red-500" : ""}
                >
                  <option value="">Select Patient</option>
                  {selectedOrg &&
                    patients
                      .filter(
                        (p) => String(p.organisation_id) === String(selectedOrg)
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                </FormSelect>
                {formErrors.patient && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select a patient
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

              {/* Session time  */}
              <div>
                <label className="block font-medium mb-1">Session Time</label>
                <FormSelect
                  value={sessionTime}
                  onChange={(e) => {
                    setSessionTime(e.target.value);
                    setFormErrors((prev) => ({ ...prev, sessionTime: false }));
                  }}
                  className={formErrors.sessionTime ? "border-red-500" : ""}
                >
                  <option value="">Select Time</option>
                  {times.map((time) => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
                </FormSelect>
                {formErrors.sessionTime && (
                  <p className="text-red-500 text-sm mt-1">
                    Duration is required
                  </p>
                )}
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

      {/* delete dialogbox  */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
          setSessionIdToDelete(null);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Archive"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">{t("ReallyArch")}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setSessionIdToDelete(null);
              }}
              className="w-24 mr-4"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              ref={deleteButtonRef}
              onClick={handleDeleteConfirm}
            >
              {t("archive")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};
export default SessionTable;
