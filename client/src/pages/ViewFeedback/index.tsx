import React, { useEffect, useState } from "react";
import { t } from "i18next";
import Alerts from "@/components/Alert";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import { getFeedbackListAction } from "@/actions/userActions";
import FormInput from "@/components/Base/Form/FormInput";

interface FeedbackItem {
  id: number;
  name: string;
  email: string;
  feedback: string;
  created_at: string;
}

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Search state
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const data = await getFeedbackListAction();
        setFeedbacks(data || []);
        setFilteredFeedbacks(data || []);
        setTotalPages(Math.ceil((data?.length || 0) / itemsPerPage));
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setAlert({
          variant: "danger",
          message: t("Failed to load feedbacks"),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [itemsPerPage]);

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase();
    setSearchText(value);

    const filtered = feedbacks.filter(
      (f) =>
        f.name.toLowerCase().includes(value) ||
        f.email.toLowerCase().includes(value) ||
        f.feedback.toLowerCase().includes(value)
    );

    setFilteredFeedbacks(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFeedbacks = filteredFeedbacks.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filteredFeedbacks.length / newItemsPerPage));
  };

  return (
    <>
      {alert && <Alerts data={alert} />}

      <div className="grid grid-cols-12 gap-6 mt-8">
        <div className="col-span-12 intro-y">
          <div className="p-6 bg-white dark:bg-[#1e1e2d] rounded-lg shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              {/* Title */}
              <h2 className="text-2xl font-bold">{t("feedback_list")}</h2>

              {/* Search Input */}
              <div className="mt-3 md:mt-0 w-56 relative">
                <FormInput
                  type="text"
                  className="w-56 pr-10 !box"
                  placeholder={t("Search")}
                  value={searchText}
                  onChange={handleSearch}
                />
                <Lucide
                  icon="Search"
                  className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3 text-slate-500"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500">{t("Loading...")}</p>
            ) : filteredFeedbacks.length === 0 ? (
              <p className="text-gray-500">{t("No feedback found.")}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left border">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 border">{t("Name")}</th>
                        <th className="px-4 py-2 border">{t("Email")}</th>
                        <th className="px-4 py-2 border">{t("Feedback")}</th>
                        <th className="px-4 py-2 border">{t("Date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFeedbacks.map((item) => (
                        <tr
                          key={item.id}
                          className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          <td className="px-4 py-2 border">{item.name}</td>
                          <td className="px-4 py-2 border">{item.email}</td>
                          <td className="px-4 py-2 border">{item.feedback}</td>
                          <td className="px-4 py-2 border">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredFeedbacks.length > 0 && (
                  <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap mt-5">
                    <Pagination className="w-full sm:w-auto sm:mr-auto">
                      <Pagination.Link onPageChange={() => handlePageChange(1)}>
                        <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                      </Pagination.Link>
                      <Pagination.Link
                        onPageChange={() => handlePageChange(currentPage - 1)}
                      >
                        <Lucide icon="ChevronLeft" className="w-4 h-4" />
                      </Pagination.Link>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Pagination.Link
                            key={page}
                            active={currentPage === page}
                            onPageChange={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Link>
                        )
                      )}

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

                    {/* Items per page */}
                    <select
                      className="w-20 mt-3 !box sm:mt-0 border rounded px-2 py-1"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackList;
