import { useEffect, useState, ChangeEvent } from "react";
import { t } from "i18next";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import Alerts from "@/components/Alert";
import { getAllContactsAction } from "@/actions/userActions";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

type ContactRequest = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
};

function ContactRequests({ userRole = "Admin" }: { userRole?: string }) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ContactRequest[]>(
    []
  );
  const [currentRequests, setCurrentRequests] = useState<ContactRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const propertiesToSearch = ["name", "email", "subject", "message"];

  // Filtering & Pagination
  useEffect(() => {
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;

    if (requests.length > 0) {
      const filtered = requests.filter((r) =>
        propertiesToSearch.some((prop) => {
          const value = r[prop as keyof ContactRequest];
          return value
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        })
      );
      setFilteredRequests(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentRequests(filtered.slice(indexOfFirst, indexOfLast));
    } else {
      setFilteredRequests([]);
      setCurrentRequests([]);
      setTotalPages(1);
    }
  }, [requests, searchQuery, currentPage, itemsPerPage]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  // fetch all contacts request details
  const fetchContacts = async () => {
    try {
      setLoading(true);

      const data: ContactRequest[] = await getAllContactsAction();

      setRequests(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <h2 className="mt-10 text-lg font-medium intro-y">
        {t("Contact Requests")}
      </h2>

      <div className="grid grid-cols-12 gap-6 mt-5">
        {/* Search Box */}
        <div className="flex col-span-12 justify-end">
          <div className="relative w-56">
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

        {/* Table */}
        <div className="col-span-12 overflow-auto intro-y">
          <Table className="border-spacing-y-[10px] border-separate -mt-2">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("name")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("email")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("subject")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("messages")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentRequests.map((req, key) => (
                <Table.Tr key={req.id} className="intro-x">
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {indexOfFirst + key + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {req.name}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {req.email}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {req.subject}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0  shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {req.message}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        {/* Pagination */}
        {currentRequests.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between col-span-12 mt-5">
            <Pagination>
              <Pagination.Link onPageChange={() => handlePageChange(1)}>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link
                onPageChange={() => handlePageChange(currentPage - 1)}
              >
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link
                active
                onPageChange={() => handlePageChange(currentPage)}
              >
                {currentPage}
              </Pagination.Link>
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

            <div className="text-slate-500">
              {t("showing")} {indexOfFirst + 1} {t("to")}{" "}
              {Math.min(indexOfLast, filteredRequests.length)} {t("of")}{" "}
              {filteredRequests.length} {t("entries")}
            </div>

            <FormSelect
              className="w-20"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={35}>35</option>
              <option value={50}>50</option>
            </FormSelect>
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
    </>
  );
}

export default ContactRequests;
