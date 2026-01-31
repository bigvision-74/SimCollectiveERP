import React, { useState, useEffect } from "react";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import { FormSelect, FormCheck } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import {
  getAllSessionAction,
  deleteIndividualSessionsAction,
} from "@/actions/sessionAction";

// Helper to format date
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
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await getAllSessionAction();
      if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      } else if (Array.isArray(response)) {
        setSessions(response);
      }
    } catch (error) {
      console.error("Error fetching sessions", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Pagination Calculations
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
      // Select all visible items on current page
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

    // Update header checkbox
    const allVisibleSelected =
      currentSessions.length > 0 &&
      currentSessions.every((s) => newSelected.has(s.id));
    setSelectAllChecked(allVisibleSelected);
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
        // Single Delete
        idsToDelete = [sessionIdToDelete];
      } else {
        // Bulk Delete
        idsToDelete = Array.from(selectedSessions);
      }

      if (idsToDelete.length === 0) return;

      const adminName = "Admin"; // You can replace this with dynamic user data

      await deleteIndividualSessionsAction(idsToDelete, adminName);

      onShowAlert({
        variant: "success",
        message: `${idsToDelete.length} session(s) permanently deleted.`,
      });

      // Reset State
      setSelectedSessions(new Set());
      setSelectAllChecked(false);
      setSessionIdToDelete(null);

      // Refresh Data
      await fetchSessions();
    } catch (error) {
      console.error("Delete failed", error);
      onShowAlert({
        variant: "danger",
        message: "Failed to delete sessions. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmationModal(false);
    }
  };

  // View Handler
  const handleViewSession = (session: any) => {
    let parsedSession = { ...session };

    if (
      parsedSession.participants &&
      typeof parsedSession.participants === "string"
    ) {
      try {
        parsedSession.participants = JSON.parse(parsedSession.participants);
      } catch (e) {
        console.error("Failed to parse participants JSON", e);
        parsedSession.participants = [];
      }
    } else if (!parsedSession.participants) {
      parsedSession.participants = [];
    }

    setSelectedSession(parsedSession);
    setViewModalOpen(true);
  };

  const getEndedByName = (session: any) => {
    if (session.endedBy === "auto") return "Auto System";
    if (session.endedby_fname)
      return `${session.endedby_fname} ${session.endedby_lname}`;
    return session.endedBy || "-";
  };

  const getStartedByName = (session: any) => {
    if (session.creator_fname || session.creator_lname)
      return `${session.creator_fname || ""} ${session.creator_lname || ""}`.trim();
    return session.creator_name || session.startedBy || "-";
  };

  return (
    <>
      {/* Top Bar with Bulk Action */}
      <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="danger"
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
              {/* Checkbox Header */}
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
                Session Name
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                Patient
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
                  {/* Row Checkbox */}
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <FormCheck.Input
                      type="checkbox"
                      checked={selectedSessions.has(session.id)}
                      onChange={() => handleRowCheckboxChange(session.id)}
                      className="cursor-pointer"
                    />
                  </Table.Td>

                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div className="font-medium">
                      {session.name || "Untitled"}
                    </div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {session.patient_name || "-"}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {session.creator_fname} {session.creator_lname}
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
                        "flex items-center justify-center whitespace-nowrap font-medium",
                        {
                          "text-success":
                            session.state === "ended" ||
                            session.state === "COMPLETED",
                          "text-warning":
                            session.state !== "ended" &&
                            session.state !== "COMPLETED",
                        },
                      )}
                    >
                      {session.state == "ended" ? "COMPLETED" : "ACTIVE"}
                    </div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatDate(session.startTime)}
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

        {/* Pagination Logic */}
        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 col-span-12 intro-y sm:flex-row sm:flex-nowrap mt-5">
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {(() => {
                  const pages = [];
                  const ellipsisThreshold = 2;
                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => handlePageChange(1)}
                    >
                      1
                    </Pagination.Link>,
                  );
                  if (currentPage > ellipsisThreshold + 1) {
                    pages.push(
                      <span
                        key="start-dots"
                        className="px-3 py-2 text-slate-400"
                      >
                        ...
                      </span>,
                    );
                  }
                  for (
                    let i = Math.max(2, currentPage - ellipsisThreshold);
                    i <=
                    Math.min(totalPages - 1, currentPage + ellipsisThreshold);
                    i++
                  ) {
                    pages.push(
                      <Pagination.Link
                        key={i}
                        active={currentPage === i}
                        onPageChange={() => handlePageChange(i)}
                      >
                        {i}
                      </Pagination.Link>,
                    );
                  }
                  if (currentPage < totalPages - ellipsisThreshold) {
                    pages.push(
                      <span key="end-dots" className="px-3 py-2 text-slate-400">
                        ...
                      </span>,
                    );
                  }
                  if (totalPages > 1) {
                    pages.push(
                      <Pagination.Link
                        key={totalPages}
                        active={currentPage === totalPages}
                        onPageChange={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Pagination.Link>,
                    );
                  }
                  return pages;
                })()}

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

      {/* --- DETAILS MODAL --- */}
      <Dialog
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedSession(null);
        }}
        size="lg"
      >
        <Dialog.Panel>
          <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="px-6 py-5 bg-white shadow-sm z-10 flex items-start justify-between rounded-t-lg">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Session Details
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedSession?.name}
                </p>
              </div>

              <div className="flex flex-col items-end">
                <div
                  className={clsx(
                    "px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wide mb-1",
                    {
                      "bg-green-100 text-green-700":
                        selectedSession?.state === "ended",
                      "bg-yellow-100 text-yellow-700":
                        selectedSession?.state !== "ended",
                    },
                  )}
                >
                  {selectedSession?.state == "ended" ? "COMPLETED" : "ACTIVE"}
                </div>
                <p className="text-xs text-slate-400">
                  ID: {selectedSession?.id}
                </p>
              </div>
            </div>

            {selectedSession && (
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                {/* Summary Banner */}
                <div className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border border-slate-100">
                  {/* Started By */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <Lucide icon="UserPlus" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Started By
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {getStartedByName(selectedSession)}
                      </div>
                    </div>
                  </div>

                  {/* Ended By */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                      <Lucide icon="UserMinus" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Ended By
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {getEndedByName(selectedSession)}
                        {selectedSession?.endedBy === "auto" && (
                          <span className="ml-2 text-xs text-slate-500">
                            (System)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Lucide icon="Clock" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Duration
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {selectedSession.duration || "Active"}
                      </div>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Lucide icon="User" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Patient
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {selectedSession.patient_name || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Start Time */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                      Start Time
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatDate(selectedSession.startTime)}
                    </div>
                  </div>

                  {/* End Time (if available) */}
                  {selectedSession.endTime && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                        End Time
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {formatDate(selectedSession.endTime)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Participants Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                    <Lucide
                      icon="Users"
                      className="w-4 h-4 mr-2 text-slate-500"
                    />
                    Participants
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedSession.participants &&
                    Array.isArray(selectedSession.participants) &&
                    selectedSession.participants.length > 0 ? (
                      selectedSession.participants.map(
                        (user: any, idx: number) => (
                          <div
                            key={user.id || idx}
                            className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                {user.name ? user.name.charAt(0) : "U"}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-700">
                                  {user.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {user.role || "User"}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 italic">
                              {user.uemail}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="text-sm text-slate-400 italic p-4 text-center bg-white rounded border border-dashed">
                        No participants recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end rounded-b-lg">
              <Button variant="primary" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
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
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="AlertTriangle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Are you sure?")}</div>
            <div className="mt-2 text-slate-500">
              {sessionIdToDelete
                ? t("This process cannot be undone.")
                : `${t("This process cannot be undone.")} (${selectedSessions.size} items selected)`}
              <br />
              {t("Do you really want to delete these records?")}
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
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : t("Delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default SessionTable;
