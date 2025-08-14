import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserAction } from "@/actions/userActions";
import { getOrgAction } from "@/actions/organisationAction";
import {
  getAllPatientsAction,
  getAssignedPatientsAction,
} from "@/actions/patientActions";
import { User, Building2, Mail, Search } from "lucide-react";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  category: string;
}

function Main() {
  const username = localStorage.getItem("user");

  const [user, setUser] = useState<any>({});
  const [orgProfile, setOrgProfile] = useState("");
  const [orgName, setOrgName] = useState("");
  const [organisationId, setOrgId] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const navigate = useNavigate();

  const filteredPatients = patients.filter((p) =>
    [p.name, p.email, p.phone, p.gender, p.category]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const fetchData = async () => {
    if (!username) return;

    try {
      const userData = await getUserAction(username);
      setUser(userData);

      if (userData.organisation_id) {
        const orgData = await getOrgAction(parseInt(userData.organisation_id));
        setOrgProfile(orgData.organisation_icon || "");
        setOrgName(orgData.name);
        setOrgId(orgData.organisation_id);
      }

      const assignedPatients = await getAssignedPatientsAction(userData.id);
      setPatients(assignedPatients);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      {/* User Card */}
      {/* User Card - Responsive */}
      <div className="col-span-12 sm:col-span-6">
        <div className="bg-white dark:bg-darkmode-600 rounded-xl shadow p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-gray-300 shadow">
            <img
              src={
                user.user_thumbnail?.startsWith("http")
                  ? user.user_thumbnail
                  : `/images/${user.user_thumbnail || "default-user.png"}`
              }
              alt="User"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/default-user.png")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="truncate">
                {user.fname} {user.lname}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 flex items-center truncate">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="truncate">{user.uemail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Card - Responsive */}
      <div className="col-span-12 sm:col-span-6">
        <div className="bg-white dark:bg-darkmode-600 rounded-xl shadow p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-gray-300 shadow">
            <img
              src={
                orgProfile?.startsWith("http")
                  ? orgProfile
                  : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${orgProfile}`
              }
              alt="Org"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/default-org.png")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="truncate">{orgName || "Loading..."}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              {t("organisation_id")}: {organisationId}
            </div>
          </div>
        </div>
      </div>

      {/* Patient List Table */}
      <div className="col-span-12 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("patient_list")}</h2>
          <div className="relative w-full sm:w-64 ml-auto">
            <FormInput
              type="text"
              className="w-full pr-10 !box"
              placeholder={t("Search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3 text-gray-400" />
          </div>
        </div>

        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
          <Table className="border-spacing-y-[10px] border-separate mt-5">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
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
                  {t("action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentPatients.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8} className="text-center">
                    {t("no_patient_found")}
                  </Table.Td>
                </Table.Tr>
              ) : (
                currentPatients.map((patient, index) => (
                  <Table.Tr key={patient.id}>
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
                        {/* view patient detail button  */}
                        <Link
                          to={`/patients-view/${patient.id}`} // Use Link for client-side routing
                          className="flex items-center mr-3"
                        >
                          <Lucide icon="Eye" className="w-4 h-4 mr-1" />{" "}
                          {t("view")}
                        </Link>

                        {/* <div
                          onClick={() => {
                            navigate(`/patient-edit/${patient.id}`, {
                              state: {
                                from: "patients",
                              },
                            });
                          }}
                          className="flex items-center mr-3"
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

        {/* Pagination & Items per page */}
        {filteredPatients.length > 0 && (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4 mt-6">
            {/* Pagination */}
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto flex flex-wrap gap-1">
                <Pagination.Link onPageChange={() => setCurrentPage(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>

                <Pagination.Link
                  onPageChange={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {(() => {
                  const totalPages = Math.ceil(
                    filteredPatients.length / itemsPerPage
                  );
                  const pages = [];
                  const maxPagesToShow = 5;
                  const ellipsisThreshold = 2;

                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => setCurrentPage(1)}
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
                        onPageChange={() => setCurrentPage(i)}
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
                        onPageChange={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Pagination.Link>
                    );
                  }

                  return pages;
                })()}

                <Pagination.Link
                  onPageChange={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredPatients.length / itemsPerPage)
                        ? prev + 1
                        : prev
                    )
                  }
                >
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>

                <Pagination.Link
                  onPageChange={() =>
                    setCurrentPage(
                      Math.ceil(filteredPatients.length / itemsPerPage)
                    )
                  }
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            {/* Showing entries */}
            <div className="hidden mx-auto md:block text-slate-500 text-sm">
              {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
              {Math.min(indexOfLastItem, filteredPatients.length)} {t("of")}{" "}
              {filteredPatients.length} {t("entries")}
            </div>

            {/* Items per page */}
            <div className="flex-1 flex justify-end">
              <FormSelect
                className="w-20 mt-3 !box sm:mt-0"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main;
