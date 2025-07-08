import _ from "lodash";
import clsx from "clsx";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Dialog, Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { deletePatientAction, getAllPatientsAction } from "@/actions/patientActions";
import profile from "@/assets/images/fakers/profile.webp";
import Alert from "@/components/Base/Alert";
import Alerts from "@/components/Alert";
import "./style.css";
import { t } from "i18next";

type Patient = {
  id: number;
  name: string;
  email: string;
  patient_thumbnail: string;
  updated_at: string;
  fname: string;
  lname: string;
  patient_id: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
};

function PatientMain() {
  const navigate = useNavigate();
  const deleteButtonRef = useRef(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatients, setCurrentPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [patientIdToDelete, setPatientIdToDelete] = useState<number | null>(null);
  const [deletePatient, setDeletePatient] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [editedsuccess, setEditedsuccess] = useState(false);
  const [name, setName] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";

  const fetchPatients = async () => {
    try {
      setLoading1(true);
      const data = await getAllPatientsAction();
      setPatients(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading1(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };
  
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    fetchPatients();
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });

      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  }, [alertMessage]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setTotalPages(Math.ceil(patients.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const newCurrentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, patients]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = [
    "name",
    "email",
    "patient_id",
    "fname",
    "lname",
    "phone",
    "gender",
    "address"
  ];

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    if (Array.isArray(patients) && patients.length !== 0) {
      const filtered = patients.filter((patient) => {
        return propertiesToSearch.some((prop) => {
          const fieldValue = patient[prop as keyof Patient];
          if (fieldValue) {
            return fieldValue
              .toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }
          return false;
        });
      });

      setFilteredPatients(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPatients(filtered.slice(indexOfFirstItem, indexOfLastItem));
    }
  }, [currentPage, itemsPerPage, searchQuery, patients]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedPatients(new Set(filteredPatients.map((patient) => patient.id)));
    } else {
      setSelectedPatients(new Set());
    }
    setSelectAllChecked(event.target.checked);
  };

  const handleRowCheckboxChange = (patientId: number) => {
    const newSelectedPatients = new Set(selectedPatients);
    if (newSelectedPatients.has(patientId)) {
      newSelectedPatients.delete(patientId);
    } else {
      newSelectedPatients.add(patientId);
    }
    setSelectedPatients(newSelectedPatients);
    setSelectAllChecked(newSelectedPatients.size === filteredPatients.length);
  };

  const handleDeleteClick = (patientId: number) => {
    setPatientIdToDelete(patientId);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeletePatient(false);
    setDeleteError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      if (patientIdToDelete) {
        await deletePatientAction(patientIdToDelete, name);
        setDeletePatient(true);
      } else if (selectedPatients.size > 0) {
        const deletePromises = Array.from(selectedPatients).map((patientId) =>
          deletePatientAction(patientId)
        );
        await Promise.all(deletePromises);
        setDeletePatient(true);
      }
      const data = await getAllPatientsAction();
      setPatients(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setSelectedPatients(new Set());
      setSelectAllChecked(false);
      if (currentPage > Math.ceil(data.length / itemsPerPage)) {
        setCurrentPage(Math.max(1, Math.ceil(data.length / itemsPerPage)));
      }
    } catch (error) {
      console.error("Error deleting patient(s):", error);
      setDeleteError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setDeleteConfirmationModal(false);
    setPatientIdToDelete(null);
    setName("");
  };

  const handleDeleteSelected = () => {
    setPatientIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  useEffect(() => {
    const alert = sessionStorage.getItem("PatientAddedSuccessfully");
    if (alert) {
      setShowAlert({
        variant: "success",
        message: alert,
      });
      sessionStorage.removeItem("PatientAddedSuccessfully");
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  }, []);

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      {deletePatient && (
        <Alert variant="soft-success" className="flex items-center mb-2">
          <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />{" "}
          {t("patientArchiveSuccess")}
        </Alert>
      )}
      {deleteError && (
        <Alert variant="soft-danger" className="flex items-center mb-2">
          <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
          {t("patientArchiveError")}
        </Alert>
      )}
      {editedsuccess && (
        <Alert variant="soft-success" className="flex items-center mb-2">
          <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
          {t("patientUpdateSuccess")}
        </Alert>
      )}

      <div className="flex mt-10 items-center h-10 intro-y">
        <h2 className="mr-5 text-lg font-medium truncate">{t("listPatient")}</h2>
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
            onClick={() => navigate(`/add-patient`)}
            variant="primary"
            className="mr-2 shadow-md AddNewPatientListbtn"
          >
            {t("newPatient")}
          </Button>
          <Button
            variant="primary"
            className="mr-2 shadow-md"
            disabled={selectedPatients.size === 0}
            onClick={handleDeleteSelected}
          >
            {t("archivePatients")}
          </Button>

          <div className="hidden mx-auto md:block text-slate-500">
            {!loading1 ? (
              filteredPatients && filteredPatients.length > 0 ? (
                <>
                  {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                  {Math.min(indexOfLastItem, filteredPatients.length)} {t("of")}{" "}
                  {filteredPatients.length} {t("entries")}
                </>
              ) : (
                t("noMatchingRecords")
              )
            ) : (
              <div>{t("loading")}</div>
            )}
          </div>
          <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto md:ml-0">
            <div className="relative w-56 text-slate-500">
              <FormInput
                type="text"
                className="w-56 pr-10 !box"
                placeholder={t("Search")}
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Lucide
                icon="Search"
                className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
          <Table className="border-spacing-y-[10px] border-separate -mt-2">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  <FormCheck.Input
                    id="remember-me"
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("patient_thumbnail")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("patient_name")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_id")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_email")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_phone")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_gender")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentPatients.map((patient, key) => (
                <Table.Tr key={patient.id} className="intro-x">
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <FormCheck.Input
                      id="remember-me"
                      type="checkbox"
                      className="mr-2 border"
                      checked={selectedPatients.has(patient.id)}
                      onChange={() => handleRowCheckboxChange(patient.id)}
                    />
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <a className="font-medium whitespace-nowrap">
                      {indexOfFirstItem + key + 1}
                    </a>
                  </Table.Td>
                  <Table.Td className="box w-40 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div className="flex">
                      <div className="w-16 h-16 image-fit zoom-in">
                        <Tippy
                          as="img"
                          alt="Patient Thumbnail"
                          className="rounded-lg shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
                          src={
                            patient.patient_thumbnail?.startsWith("http")
                              ? patient.patient_thumbnail
                              : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${patient.patient_thumbnail}`
                          }
                          content={`${patient.fname} ${patient.lname}`}
                        />
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <a className="font-medium whitespace-nowrap">
                      {patient.fname + "  " + patient.lname}
                    </a>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.patient_id}
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
                  <Table.Td
                    className={clsx([
                      "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                      "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                    ])}
                  >
                    <div className="flex items-center justify-center">
                      {/* Edit Link */}
                      <Link
                        to={`/edit-patient/${patient.id}`}
                        className="flex items-center mr-3"
                      >
                        <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />{" "}
                        {t("edit")}
                      </Link>

                      {/* Delete Link */}
                      <a
                        className="flex items-center text-danger cursor-pointer"
                        onClick={(event) => {
                          event.preventDefault();
                          const name = patient.fname + " " + patient.lname;
                          setName(name);
                          handleDeleteClick(patient.id);
                        }}
                      >
                        <Lucide icon="Archive" className="w-4 h-4 mr-1" />{" "}
                        {t("Archive")}
                      </a>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        {filteredPatients.length > 0 && (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap">
            <Pagination className="w-full sm:w-auto sm:mr-auto">
              <Pagination.Link onChange={() => handlePageChange(1)}>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>

              <Pagination.Link
                onChange={() => handlePageChange(currentPage - 1)}
              >
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>

              {(() => {
                const pages = [];
                const maxPagesToShow = 5;
                const ellipsisThreshold = 2;

                pages.push(
                  <Pagination.Link
                    key={1}
                    active={currentPage === 1}
                    onChange={() => handlePageChange(1)}
                  >
                    1
                  </Pagination.Link>
                );

                if (currentPage > ellipsisThreshold + 1) {
                  pages.push(
                    <span key="ellipsis-start" className="px-3 py-2">
                      ...
                    </span>
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
                      onChange={() => handlePageChange(i)}
                    >
                      {i}
                    </Pagination.Link>
                  );
                }

                if (currentPage < totalPages - ellipsisThreshold) {
                  pages.push(
                    <span key="ellipsis-end" className="px-3 py-2">
                      ...
                    </span>
                  );
                }

                if (totalPages > 1) {
                  pages.push(
                    <Pagination.Link
                      key={totalPages}
                      active={currentPage === totalPages}
                      onChange={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Pagination.Link>
                  );
                }

                return pages;
              })()}

              <Pagination.Link
                onChange={() => handlePageChange(currentPage + 1)}
              >
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>

              <Pagination.Link
                onChange={() => handlePageChange(totalPages)}
              >
                <Lucide icon="ChevronsRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>

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
        )}
      </div>
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
              {patientIdToDelete ? `${t("ReallyArchPatient")}` : `${t("ReallyArchPatients")} `}
              <br />
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setPatientIdToDelete(null);
              }}
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
              {t("Archive")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default PatientMain;