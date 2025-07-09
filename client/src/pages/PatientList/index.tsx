import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import {
  deletePatientAction,
  getAllPatientsAction,
} from "@/actions/patientActions";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import Alert from "@/components/Base/Alert";
import { clsx } from "clsx";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function PatientList() {
  const navigate = useNavigate();
  const deleteButtonRef = useRef(null);
  const location = useLocation();

  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(
    new Set()
  );
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [patientIdToDelete, setPatientIdToDelete] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Fetch patients data
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data } = await getAllPatientsAction();
      setPatients(data);
      setFilteredPatients(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setLoading(false);
      setShowAlert({
        variant: "danger",
        message: t("patientFetchError"),
      });
    }
  };

  useEffect(() => {
    fetchPatients();

    // Handle alert messages from navigation
    const alertMessage = location.state?.alertMessage || "";
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });
      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );
      setTimeout(() => setShowAlert(null), 3000);
    }
  }, [location.state]);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((patient) =>
        Object.entries(patient).some(([key, value]) => {
          if (["id", "created_at", "updated_at"].includes(key)) return false;
          return (
            value &&
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      );
      setFilteredPatients(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, patients]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = e.target.checked
      ? new Set<number>(patients.map((p) => p.id))
      : new Set<number>();
    setSelectedPatients(newSelected);
    setSelectAllChecked(e.target.checked);
  };

  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedPatients);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedPatients(newSelected);
    setSelectAllChecked(newSelected.size === currentPatients.length);
  };

  // Delete handlers
  const handleDeleteClick = (id: number) => {
    setPatientIdToDelete(id);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedPatients.size > 0) {
      setDeleteConfirmationModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (patientIdToDelete) {
        await deletePatientAction(patientIdToDelete);
      } else if (selectedPatients.size > 0) {
        await Promise.all(
          [...selectedPatients].map((id) => deletePatientAction(id))
        );
      }
      await fetchPatients();
      setSelectedPatients(new Set());
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 3000);
    }
    setDeleteConfirmationModal(false);
    setPatientIdToDelete(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  };

  return (
    <>
      {/* Alert messages */}
      {showAlert && <Alerts data={showAlert} />}
      {deleteSuccess && (
        <Alert variant="soft-success" className="flex items-center mb-2">
          <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
          {t("patientArchiveSuccess")}
        </Alert>
      )}
      {deleteError && (
        <Alert variant="soft-danger" className="flex items-center mb-2">
          <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
          {t("patientArchiveError")}
        </Alert>
      )}

      <div className="flex mt-10 items-center h-10 intro-y">
        <h2 className="mr-5 text-lg font-medium truncate">
          {t("patient_list")}
        </h2>
        <a
          className="flex items-center ml-auto text-primary cursor-pointer dark:text-white"
          onClick={(e) => {
            window.location.reload();
          }}
        >
          <Lucide icon="RefreshCcw" className="w-5 h-5 mr-3" />
        </a>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap">
          <Button
            variant="primary"
            onClick={() => navigate("/add-patient")}
            className="shadow-md mr-2"
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            {t("newPatient")}
          </Button>
          <Button
            variant="danger"
            disabled={selectedPatients.size === 0}
            onClick={handleDeleteSelected}
            className="shadow-md mr-2"
          >
            <Lucide icon="Trash2" className="w-4 h-4 mr-2" />
            {t("archivePatients")}
          </Button>

          {/* Search input aligned to right */}
          <div className="relative w-full sm:w-64 ml-auto">
            <FormInput
              type="text"
              className="w-full pr-10 !box"
              placeholder={t("Search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Lucide
              icon="Search"
              className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
            />
          </div>
        </div>
      </div>

      {/* Patient table */}
      <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
        <Table className="border-spacing-y-[10px] border-separate mt-5">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="border-b-0 whitespace-nowrap">
                <FormCheck.Input
                  type="checkbox"
                  className="mr-2 border"
                  checked={selectAllChecked}
                  onChange={handleSelectAll}
                />
              </Table.Th>
              <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
              <Table.Th className="border-b-0 whitespace-nowrap">
                {t("name")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("email")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("phone")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("gender")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("dob")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("category")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("actions")}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={9} className="text-center">
                  {t("loading")}...
                </Table.Td>
              </Table.Tr>
            ) : currentPatients.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9} className="text-center">
                  {t("no_patient_found")}
                </Table.Td>
              </Table.Tr>
            ) : (
              currentPatients.map((patient, index) => (
                <Table.Tr key={patient.id} className="intro-x">
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <FormCheck.Input
                      type="checkbox"
                      className="mr-2 border"
                      checked={selectedPatients.has(patient.id)}
                      onChange={() => handleRowSelect(patient.id)}
                    />
                  </Table.Td>

                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {indexOfFirstItem + index + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.name}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.email}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.phone}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.gender}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatDate(patient.date_of_birth)}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.category}
                  </Table.Td>
                  <Table.Td
                    className={clsx([
                      "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                      "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                    ])}
                  >
                    <div className="flex items-center justify-center">
                      <Link
                        to={`/edit-patient/${patient.id}`} // Use Link for client-side routing
                        className="flex items-center mr-3"
                      >
                        <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />{" "}
                        {t("edit")}
                      </Link>

                      <a
                        className="flex items-center text-danger cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault();
                          handleDeleteClick(patient.id);
                          setDeleteConfirmationModal(true);
                        }}
                      >
                        <Lucide icon="Archive" className="w-4 h-4 mr-1" />{" "}
                        {t("Archive")}
                      </a>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredPatients.length > 0 && (
        <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap">
          <Pagination className="w-full sm:w-auto sm:mr-auto">
            <Pagination.Link onClick={() => handlePageChange(1)}>
              <Lucide icon="ChevronsLeft" className="w-4 h-4" />
            </Pagination.Link>
            <Pagination.Link
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            >
              <Lucide icon="ChevronLeft" className="w-4 h-4" />
            </Pagination.Link>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Pagination.Link
                  key={pageNum}
                  active={currentPage === pageNum}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Link>
              );
            })}

            <Pagination.Link
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
            >
              <Lucide icon="ChevronRight" className="w-4 h-4" />
            </Pagination.Link>
            <Pagination.Link onClick={() => handlePageChange(totalPages)}>
              <Lucide icon="ChevronsRight" className="w-4 h-4" />
            </Pagination.Link>
          </Pagination>

          <select
            className="w-20 mt-3 form-select box sm:mt-0"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
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
            <div className="mt-2 text-slate-500">
              {patientIdToDelete ? t("ReallyArch") : t("ReallyArch")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setPatientIdToDelete(null);
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
}

export default PatientList;
