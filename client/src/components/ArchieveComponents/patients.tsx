import _ from "lodash";
import { useState, useRef, useEffect, ChangeEvent, useMemo } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Dialog, Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { getAdminOrgAction } from "@/actions/adminActions";

type Patient = {
  name: string;
  organisation_id: string;
  email: string;
  date_of_birth: string;
  id: number;
  gender: string;
  phone: string;
};
interface Component {
  onAction: (id: string, type: string) => void;
  data: any[];
  onRecover: (id: string, type: string) => void;
}

const Arpatients: React.FC<Component> = ({
  data = [],
  onAction,
  onRecover,
}) => {
  const deleteButtonRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [selectedPatients, setselectedPatients] = useState<Set<number>>(
    new Set()
  );
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPatients, setcurrentPatients] = useState<Patient[]>([]);
  const [filteredPatients, setfilteredPatients] = useState<Patient[]>([]);
  const [recoveryConfirmationModal, setRecoveryConfirmationModal] =
    useState(false);
  const [userIdToRecover, setUserIdToRecover] = useState<number | null>(null);

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
    setTotalPages(Math.ceil(filteredPatients.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const handleDeleteSelected = () => {
    setUserIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = useMemo(
    () => ["name", "email", "phone", "gender", "date_of_birth"],
    []
  );

  useEffect(() => {
    const filterPatients = async () => {
      if (!Array.isArray(data)) return;

      const useremail = localStorage.getItem("user");
      const userRole = localStorage.getItem("role");
      const org = await getAdminOrgAction(String(useremail));

      let filteredData = data;

      if (userRole === "Admin" && org?.id) {
        filteredData = data.filter(
          (patient: any) => Number(patient.organisation_id) === org.orgid
        );
      }

      const filtered = filteredData.filter((patient) =>
        propertiesToSearch.some((prop) =>
          patient[prop as keyof Patient]
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );

      setfilteredPatients(filtered);

      const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
      setTotalPages(newTotalPages);

      const validatedCurrentPage = Math.min(currentPage, newTotalPages || 1);

      if (currentPage !== validatedCurrentPage && validatedCurrentPage > 0) {
        setCurrentPage(validatedCurrentPage);
        return;
      }

      const indexOfLastItem = validatedCurrentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      setcurrentPatients(filtered.slice(indexOfFirstItem, indexOfLastItem));
    };

    filterPatients();
  }, [currentPage, itemsPerPage, searchQuery, data, propertiesToSearch]);

  // Separate effect for resetting page when data changes significantly
  useEffect(() => {
    if (filteredPatients.length > 0) {
      const newTotalPages = Math.ceil(filteredPatients.length / itemsPerPage);
      const validatedCurrentPage = Math.min(currentPage, newTotalPages || 1);

      if (currentPage !== validatedCurrentPage) {
        setCurrentPage(validatedCurrentPage);
      }
    }
  }, [filteredPatients.length, itemsPerPage]);

  const handleDeleteConfirm = async () => {
    if (userIdToDelete) {
      onAction(String(userIdToDelete), "patient");
    } else {
      const deletePromises = Array.from(selectedPatients).map((userId) =>
        onAction(String(userId), "patient")
      );
      await Promise.all(deletePromises);
      setselectedPatients(new Set());
    }

    setDeleteConfirmationModal(false);
  };
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const { t } = useTranslation();
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setselectedPatients(new Set(filteredPatients.map((user) => user.id)));
    } else {
      setselectedPatients(new Set());
    }
    setSelectAllChecked(event.target.checked);
  };

  const handleRowCheckboxChange = (userId: number) => {
    const newSelectedUsers = new Set(selectedPatients);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setselectedPatients(newSelectedUsers);
    setSelectAllChecked(newSelectedUsers.size === filteredPatients.length);
  };

  const handleDeleteClick = (userId: number) => {
    setUserIdToDelete(userId);
    setDeleteConfirmationModal(true);
  };

  const handleRecoveryClick = (orgId: number) => {
    setUserIdToRecover(orgId);
    setRecoveryConfirmationModal(true);
  };

  const handleRecoveryConfirm = async () => {
    if (userIdToRecover) {
      try {
        onRecover(String(userIdToRecover), "patient");
        setRecoveryConfirmationModal(false);
      } catch (error) {
        console.error("Recovery failed:", error);
      }
    }
  };

  return (
    <>
      {/* {showAlert && <Alerts data={showAlert} />} */}

      <div className="grid grid-cols-12 gap-6">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y sm:flex-nowrap">
          <Button
            variant="primary"
            className="mr-2 shadow-md"
            disabled={selectedPatients.size === 0}
            onClick={() => {
              handleDeleteSelected();
            }}
          >
            {t("delete_patient")}
          </Button>

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
        {/* BEGIN: Data List */}
        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto patientTable">
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
                  {t("patient_name")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_email")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("patient_phone")}
                </Table.Th>
                {/* <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("date_of_birth")}
                </Table.Th> */}
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("gender")}
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
                    <a href="" className="font-medium whitespace-nowrap">
                      {indexOfFirstItem + key + 1}
                    </a>
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
                  {/* <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.date_of_birth}
                  </Table.Td> */}
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
                      <a
                        className="flex items-center text-success cursor-pointer mr-3"
                        onClick={(event) => {
                          event.preventDefault();
                          handleRecoveryClick(patient.id);
                        }}
                      >
                        <Lucide icon="RotateCw" className="w-4 h-4 mr-1" />
                        {t("Recover")}
                      </a>
                      {/* Delete Link */}
                      <a
                        href="#"
                        className="flex items-center text-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteClick(patient.id);
                          setDeleteConfirmationModal(true);
                        }}
                      >
                        <Lucide icon="Trash2" className="w-4 h-4 mr-1" />{" "}
                        {t("delete")}
                      </a>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        {/* END: Data List */}
        {/* BEGIN: Pagination */}

        {filteredPatients.length > 0 ? (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap">
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                {/* First Page Button */}
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>

                {/* Previous Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {/* Page Numbers with Ellipsis */}
                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5; // Number of page links to show (excluding ellipsis)
                  const ellipsisThreshold = 2; // Number of pages to show before/after ellipsis

                  // Always show the first page
                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => handlePageChange(1)}
                    >
                      1
                    </Pagination.Link>
                  );

                  // Show ellipsis if current page is far from the start
                  if (currentPage > ellipsisThreshold + 1) {
                    pages.push(
                      <span key="ellipsis-start" className="px-3 py-2">
                        ...
                      </span>
                    );
                  }

                  // Show pages around the current page
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
                      </Pagination.Link>
                    );
                  }

                  // Show ellipsis if current page is far from the end
                  if (currentPage < totalPages - ellipsisThreshold) {
                    pages.push(
                      <span key="ellipsis-end" className="px-3 py-2">
                        ...
                      </span>
                    );
                  }

                  // Always show the last page
                  if (totalPages > 1) {
                    pages.push(
                      <Pagination.Link
                        key={totalPages}
                        active={currentPage === totalPages}
                        onPageChange={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Pagination.Link>
                    );
                  }

                  return pages;
                })()}

                {/* Next Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage + 1)}
                >
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>

                {/* Last Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            <div className="hidden mx-auto md:block text-slate-500">
              {filteredPatients ? (
                filteredPatients.length > 0 ? (
                  <>
                    {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                    {Math.min(indexOfLastItem, filteredPatients.length)}{" "}
                    {t("of")} {filteredPatients.length} {t("entries")}
                  </>
                ) : (
                  t("noMatchingRecords")
                )
              ) : (
                <div>{t("loading")}</div>
              )}
            </div>

            {/* Items Per Page Selector */}
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
        ) : !loading ? (
          <div className="col-span-12 text-center text-slate-500">
            {t("noMatchingRecords")}
          </div>
        ) : (
          <div className="col-span-12 text-center text-slate-500">
            {t("loading")}
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
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">
              {t("ReallyDel")}
              <br />
              {t("undone")}
            </div>
          </div>
          <div className="px-5 pb-8  text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setUserIdToDelete(null);
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
              {t("delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog
        open={recoveryConfirmationModal}
        onClose={() => {
          setRecoveryConfirmationModal(false);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="RotateCw"
              className="w-16 h-16 mx-auto mt-3 text-success"
            />
            <div className="mt-5 text-3xl">{t("SureRecover")}</div>
            <div className="mt-2 text-slate-500">
              {t("ReallyRecover")}
              <br />
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setRecoveryConfirmationModal(false);
                setUserIdToRecover(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="success"
              type="button"
              className="w-24 text-white"
              ref={deleteButtonRef}
              onClick={handleRecoveryConfirm}
            >
              {t("Recover")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default Arpatients;
