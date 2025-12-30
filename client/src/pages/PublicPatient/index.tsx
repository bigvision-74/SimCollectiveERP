import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import { getPublicPatientsAction } from "@/actions/patientActions";
import { t } from "i18next";
import clsx from "clsx";
import { getAdminOrgAction } from "@/actions/adminActions";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  type: string;
  category: string;
  created_at: string;
  status: string;
  organisation_id?: string;
}

const PublicPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentPatients, setCurrentPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string>("");
  const [userRole, setUserRole] = useState("");

  // const fetchPatients = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await getPublicPatientsAction();

  //     setPatients(data);
  //     setFilteredPatients(data);
  //     setTotalPages(Math.ceil(data.length / itemsPerPage));
  //   } catch (error) {
  //     console.error("Error fetching public patients:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPublicPatientsAction();

      const filtered =
        userRole === "Superadmin"
          ? data
          : data.filter(
              (patient: Patient) =>
                String(patient.organisation_id) !== String(currentOrgId)
            );

      setPatients(filtered);
      setFilteredPatients(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching public patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const useremail = localStorage.getItem("user");

  useEffect(() => {
    const fetchOrg = async () => {
      const org = await getAdminOrgAction(String(useremail));
      setUserRole(org.role);
      setCurrentOrgId(String(org.orgid));
    };
    fetchOrg();
  }, [useremail]);

  useEffect(() => {
    if (currentOrgId) {
      fetchPatients();
    }
  }, [currentOrgId, userRole]);

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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = [
    "name",
    "email",
    "phone",
    "gender",
    "date_of_birth",
    "category",
  ];

  useEffect(() => {
    const filtered = patients.filter((patient) =>
      propertiesToSearch.some((prop) =>
        patient[prop as keyof Patient]
          ?.toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    );

    setFilteredPatients(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPatients(filtered.slice(indexOfFirstItem, indexOfLastItem));
  }, [currentPage, itemsPerPage, searchQuery, patients]);

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap">
          {/* Search input aligned to right */}
          <div className="relative w-full sm:w-64 ml-auto">
            <FormInput
              type="text"
              className="w-full pr-10 !box"
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

      {/* Patient table */}
      <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
        <Table className="border-spacing-y-[10px] border-separate mt-5">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("vr_name")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("user_email")}
              </Table.Th>
              {/* <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("phone1")}
              </Table.Th> */}
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("gender1")}
              </Table.Th>
              {/* <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("dob1")}
              </Table.Th> */}
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("specialities")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("type1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("action")}
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
                  {t("noPublicPatients")}
                </Table.Td>
              </Table.Tr>
            ) : (
              currentPatients.map((patient, index) => (
                <Table.Tr key={patient.id} className="intro-x">
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {indexOfFirstItem + index + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {patient.name}
                    </span>
                    <div
                      className={clsx(
                        "text-xs mt-0.5",
                        patient.status === "draft"
                          ? "text-red-500"
                          : "text-slate-500"
                      )}
                    >
                      {patient.status === "draft" ? t("draft") : t("complete")}
                    </div>
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.email}
                    <div className="text-xs text-slate-400">
                      {patient.phone}
                    </div>
                  </Table.Td>
                  {/* <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.phone}
                  </Table.Td> */}
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient?.gender ? patient.gender : "-"}
                  </Table.Td>
                  {/* <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatDate(patient.date_of_birth)}
                  </Table.Td> */}
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient?.category ? patient.category : "-"}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient?.type
                      ? patient.type.charAt(0).toUpperCase() +
                        patient.type.slice(1)
                      : "-"}
                  </Table.Td>
                  <Table.Td
                    className={clsx([
                      "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                      "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                    ])}
                  >
                    <div className="flex items-center justify-center">
                      {/* View button */}
                      <div
                        onClick={() => {
                          if (patient.status !== "draft") {
                            navigate(`/patients-view/${patient.id}`);
                            localStorage.setItem("from", "patients-public");
                          }
                        }}
                        className={`flex items-center mr-3 ${
                          patient.status === "draft"
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <Lucide icon="FileText" className="w-4 h-4 mr-1" />
                        {t("view")}
                      </div>

                      {/* Edit button (enabled only if same org & not draft) */}
                      {/* <div
                        onClick={() => {
                          if (
                            patient.status !== "draft" &&
                            (userRole === "Superadmin" ||
                              String(patient.organisation_id) ===
                                String(currentOrgId))
                          ) {
                            navigate(`/patient-edit/${patient.id}`);
                            localStorage.setItem("from", "patients-public");
                          }
                        }}
                        className={`flex items-center ${
                          patient.status === "draft" ||
                          (userRole !== "Superadmin" &&
                            String(patient.organisation_id) !==
                              String(currentOrgId))
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />
                        {t("edit")}
                      </div> */}
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
        <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4">
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
                const maxPagesToShow = 5;
                const ellipsisThreshold = 2;

                pages.push(
                  <Pagination.Link
                    key={1}
                    active={currentPage === 1}
                    onPageChange={() => handlePageChange(1)}
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
                      onPageChange={() => handlePageChange(i)}
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
                      onPageChange={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </Pagination.Link>
                  );
                }

                return pages;
              })()}

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
    </>
  );
};

export default PublicPatientPage;
