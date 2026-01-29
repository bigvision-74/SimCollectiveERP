import React, { useState, useEffect, useRef } from "react";
import Table from "@/components/Base/Table";
import { useNavigate } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import { FormSelect, FormCheck } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import {
  getAllWardSessionAction,
  deleteSessionsAction,
} from "@/actions/sessionAction";

// ... (formatDate helper remains the same) ...
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

const SessionTable: React.FC<Component> = ({ onShowAlert }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection & Delete State
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(
    new Set(),
  );
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);

  const [sessionIdToDelete, setSessionIdToDelete] = useState<number | null>(
    null,
  );

  const deleteButtonRef = useRef(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchWardSessions = async () => {
    try {
      const response = await getAllWardSessionAction();
      if (Array.isArray(response)) {
        setSessions(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Error fetching sessions", error);
    }
  };

  useEffect(() => {
    fetchWardSessions();
  }, []);

  // ... (Pagination Logic remains the same) ...
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPage(pageNumber);
    }
  };
  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = sessions.slice(indexOfFirstItem, indexOfLastItem);

  // --- SELECTION LOGIC ---
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const visibleIds = currentSessions.map((s) => s.id);
      setSelectedSessions(new Set(visibleIds));
    } else {
      setSelectedSessions(new Set());
    }
    setSelectAllChecked(event.target.checked);
  };

  const handleRowCheckboxChange = (id: number) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSessions(newSelected);
    const allVisibleSelected = currentSessions.every((s) =>
      newSelected.has(s.id),
    );
    setSelectAllChecked(allVisibleSelected && currentSessions.length > 0);
  };

  // --- DELETE HANDLERS ---
  const handleDeleteClick = (id: number) => {
    setSessionIdToDelete(id);
    setDeleteConfirmationModal(true);
  };

  const handleBulkDeleteClick = () => {
    setSessionIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      let idsToDelete: number[] = [];

      if (sessionIdToDelete) {
        idsToDelete = [sessionIdToDelete];
      } else {
        idsToDelete = Array.from(selectedSessions);
      }

      if (idsToDelete.length === 0) return;

      const adminName = "Admin User"; // Replace with dynamic user name

      // CALLING THE PERMANENT DELETE ACTION
      await deleteSessionsAction(idsToDelete, adminName);

      onShowAlert({
        variant: "success",
        message: "Session(s) permanently deleted.",
      });

      setSelectedSessions(new Set());
      setSelectAllChecked(false);
      setSessionIdToDelete(null);

      await fetchWardSessions();
    } catch (error) {
      console.error("Delete failed", error);
      onShowAlert({
        variant: "danger",
        message: "Failed to delete session(s).",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmationModal(false);
    }
  };

  // ... (View Handler & Helpers remain the same) ...
  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    setViewModalOpen(true);
  };

  const getEndedByName = (session: any) => {
    if (session.endedBy === "auto") return "Auto System";
    if (session.ended_by_fname)
      return `${session.ended_by_fname} ${session.ended_by_lname}`;
    return session.endedBy || "-";
  };

  return (
    <>
      {/* Top Bar with Bulk Action */}
      <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="danger" // Changed to Danger for delete
            className="mr-2 shadow-md"
            disabled={selectedSessions.size === 0}
            onClick={handleBulkDeleteClick}
          >
            <Lucide icon="Trash2" className="w-4 h-4 mr-2" />
            {t("Delete Selected")}
          </Button>
        </div>
      </div>

      <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
        <Table className="border-spacing-y-[10px] border-separate">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="border-b-0 whitespace-nowrap w-10">
                <FormCheck.Input
                  type="checkbox"
                  checked={selectAllChecked}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </Table.Th>
              <Table.Th className="w-12 text-center border-b-0 whitespace-nowrap">
                #
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Ward Name
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Started By
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Ended By
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Status
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Start Time
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Duration
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("action")}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {currentSessions.length > 0 ? (
              currentSessions.map((session, index) => (
                <Table.Tr key={session.id} className="intro-x">
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <FormCheck.Input
                      type="checkbox"
                      checked={selectedSessions.has(session.id)}
                      onChange={() => handleRowCheckboxChange(session.id)}
                      className="cursor-pointer"
                    />
                  </Table.Td>
                  {/* ... (Columns for Data remain the same) ... */}
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div className="font-medium">{session.ward_name}</div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {session.started_by_fname} {session.started_by_lname}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <span
                      className={clsx("text-xs font-medium px-2 py-1 rounded", {
                        "bg-slate-100 text-slate-600":
                          session.endedBy === "auto",
                        "bg-primary/10 text-primary":
                          session.endedBy !== "auto",
                      })}
                    >
                      {getEndedByName(session)}
                    </span>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div
                      className={clsx(
                        "flex items-center justify-center whitespace-nowrap",
                        {
                          "text-success": session.status === "COMPLETED",
                          "text-warning": session.status === "ACTIVE",
                          "text-danger": session.status === "CANCELLED",
                        },
                      )}
                    >
                      {session.status}
                    </div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatDate(session.start_time)}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {session.duration || "-"}
                  </Table.Td>

                  <Table.Td className="box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div className="flex items-center justify-center">
                      <div
                        onClick={() => handleViewSession(session)}
                        className="flex items-center mr-3 cursor-pointer text-primary"
                      >
                        <Lucide icon="Eye" className="w-4 h-4 mr-1" />{" "}
                        {t("view")}
                      </div>
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteClick(session.id);
                        }}
                        className="flex items-center text-danger cursor-pointer"
                      >
                        <Lucide icon="Trash2" className="w-4 h-4 mr-1" />{" "}
                        {t("delete")}
                      </a>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={9} className="text-center py-4">
                  {t("noMatchingRecords")}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {/* ... (Pagination controls remain the same) ... */}
        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 col-span-12 intro-y sm:flex-row sm:flex-nowrap mt-5">
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                {/* ... Pagination Links ... */}
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link active>{currentPage}</Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage + 1)}
                >
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>
            <div className="text-center text-slate-500 w-full sm:w-auto md:mx-auto">
              {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
              {Math.min(indexOfLastItem, sessions.length)} {t("of")}{" "}
              {sessions.length} {t("entries")}
            </div>
            <div className="flex-1 flex justify-end">
              <FormSelect
                className="w-20 mt-3 !box sm:mt-0"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
          </div>
        )}
      </div>

      {/* VIEW SESSION MODAL */}
      <Dialog
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedSession(null);
        }}
        size="xl"
      >
        <Dialog.Panel>
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="text-base font-medium">{t("Session Details")}</h2>
            <Lucide
              icon="X"
              className="w-4 h-4 cursor-pointer text-slate-500 hover:text-slate-700"
              onClick={() => setViewModalOpen(false)}
            />
          </div>

          {/* MODAL BODY */}
          {selectedSession && (
            <div className="p-5 overflow-y-auto max-h-[80vh]">
              {/* --- SECTION 1: OVERVIEW HERO (NEW DESIGN) --- */}
              <div className="bg-slate-50 dark:bg-darkmode-600/50 rounded-xl p-5 mb-6 border border-slate-200 dark:border-darkmode-400">
                {/* Row 1: Ward Name & Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Lucide icon="Building" className="w-3 h-3" />
                      {t("Ward Name")}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {selectedSession.ward_name}
                    </h2>
                  </div>

                  <div className="flex flex-col items-end">
                    <div
                      className={clsx(
                        "px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wide mb-1",
                        {
                          "bg-green-100 text-green-700":
                            selectedSession.status === "COMPLETED",
                          "bg-yellow-100 text-yellow-700":
                            selectedSession.status !== "COMPLETED",
                        },
                      )}
                    >
                      {selectedSession.status}
                    </div>
                  </div>
                </div>

                {/* Row 2: Timing Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Start Time */}
                  <div className="bg-white dark:bg-darkmode-600 p-3 rounded-lg border border-slate-200 dark:border-darkmode-500 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Lucide icon="PlayCircle" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">
                        {t("Started")}
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(selectedSession.start_time)}
                      </div>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="bg-white dark:bg-darkmode-600 p-3 rounded-lg border border-slate-200 dark:border-darkmode-500 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <Lucide icon="StopCircle" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">
                        {t("Ended")}
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {selectedSession.ended_at
                          ? formatDate(selectedSession.ended_at)
                          : "Ongoing"}
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bg-white dark:bg-darkmode-600 p-3 rounded-lg border border-slate-200 dark:border-darkmode-500 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Lucide icon="Hourglass" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">
                        {t("Duration")}
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {selectedSession.duration || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECTION 2: ASSIGNMENTS (FACULTY & OBSERVERS) --- */}
              <div className="grid grid-cols-12 gap-4 mb-6">
                {/* Faculty */}
                <div className="col-span-12 sm:col-span-6">
                  <h3 className="font-medium text-slate-900 dark:text-slate-200 mb-2 flex items-center">
                    <Lucide
                      icon="GraduationCap"
                      className="w-4 h-4 mr-2 text-primary"
                    />
                    Faculty
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.assignments?.faculty?.length > 0 ? (
                      selectedSession.assignments.faculty.map((fac: any) => (
                        <div
                          key={fac.id}
                          className="bg-slate-100 dark:bg-darkmode-600 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 dark:border-darkmode-400"
                        >
                          {fac.fname} {fac.lname}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm italic">
                        No faculty assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Observers */}
                <div className="col-span-12 sm:col-span-6">
                  <h3 className="font-medium text-slate-900 dark:text-slate-200 mb-2 flex items-center">
                    <Lucide icon="Eye" className="w-4 h-4 mr-2 text-primary" />
                    Observers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.assignments?.Observer?.length > 0 ? (
                      selectedSession.assignments.Observer.map((obs: any) => (
                        <div
                          key={obs.id}
                          className="bg-slate-100 dark:bg-darkmode-600 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 dark:border-darkmode-400"
                        >
                          {obs.fname} {obs.lname}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm italic">
                        No observers assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* --- SECTION 3: ZONE ASSIGNMENTS --- */}
              {/* --- SECTION 3: ZONE ASSIGNMENTS --- */}
              <div className="mb-4">
                <h3 className="font-medium text-slate-900 dark:text-slate-200 mb-3 flex items-center">
                  <Lucide
                    icon="LayoutGrid"
                    className="w-4 h-4 mr-2 text-primary"
                  />
                  Zone Assignments
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Iterate only through keys starting with 'zone' */}
                  {selectedSession.assignments &&
                    Object.keys(selectedSession.assignments)
                      .filter((key) => key.startsWith("zone"))
                      .sort()
                      .map((zoneKey) => {
                        const zoneData = selectedSession.assignments[zoneKey];
                        // Skip if no user assigned (optional)
                        if (!zoneData?.userDetails) return null;

                        return (
                          <div
                            key={zoneKey}
                            className="border border-slate-200 dark:border-darkmode-400 rounded-lg overflow-hidden shadow-sm"
                          >
                            {/* Zone Header: User Assigned */}
                            <div className="bg-slate-50 dark:bg-darkmode-600 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-darkmode-400">
                              <span className="font-semibold text-primary uppercase text-xs tracking-wider">
                                {zoneKey.replace("zone", "Zone ")}
                              </span>
                              <div className="flex items-center text-sm font-medium">
                                <Lucide
                                  icon="User"
                                  className="w-4 h-4 mr-2 text-slate-500"
                                />
                                {zoneData.userDetails.fname}{" "}
                                {zoneData.userDetails.lname}
                              </div>
                            </div>

                            {/* Zone Body: Patients List - Simplified */}
                            <div className="p-3 bg-white dark:bg-darkmode-700">
                              <div className="text-xs text-slate-500 mb-2 font-medium">
                                Assigned Patients (
                                {zoneData.patientDetails?.length || 0})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {zoneData.patientDetails?.map(
                                  (patient: any) => (
                                    <div
                                      key={patient.id}
                                      className="px-3 py-1.5 bg-slate-100 dark:bg-darkmode-600 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-md border border-slate-200 dark:border-darkmode-500"
                                    >
                                      {patient.name}
                                    </div>
                                  ),
                                )}
                                {(!zoneData.patientDetails ||
                                  zoneData.patientDetails.length === 0) && (
                                  <div className="text-xs text-slate-400 italic py-1">
                                    No patients assigned
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* --- FOOTER: ADMIN INFO --- */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-darkmode-400 flex flex-col sm:flex-row justify-between text-xs text-slate-500">
                <div className="mb-2 sm:mb-0">
                  Started by:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedSession.started_by_fname}{" "}
                    {selectedSession.started_by_lname}
                  </span>
                </div>
                <div>
                  Ended by:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedSession.ended_by_fname
                      ? `${selectedSession.ended_by_fname} ${selectedSession.ended_by_lname}`
                      : "System"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MODAL FOOTER BUTTON */}
          <div className="px-5 py-3 text-right border-t border-slate-200/60 dark:border-darkmode-400 bg-slate-50 dark:bg-darkmode-600 rounded-b-lg">
            <Button
              variant="primary"
              onClick={() => setViewModalOpen(false)}
              className="w-24"
            >
              {t("Close")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
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
              icon="AlertTriangle" // Changed Icon to Warning/Triangle
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Are you sure?")}</div>
            <div className="mt-2 text-slate-500">
              {sessionIdToDelete
                ? t("This process cannot be undone.")
                : `${t("This process cannot be undone.")} (${selectedSessions.size} items selected)`}
              <br />
              {t("Do you really want to delete these records? ")}
            </div>
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
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <div className="loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                t("Delete")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default SessionTable;
