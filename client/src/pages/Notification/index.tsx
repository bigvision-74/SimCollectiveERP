import React, { useEffect, useState } from "react";
import { allNotificationAction } from "@/actions/adminActions";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import {
  FormInput,
  FormSelect,
  FormCheck,
  FormLabel,
  FormTextarea,
} from "@/components/Base/Form";
import { t } from "i18next";

type Notification = {
  id: number;
  notify_by_name?: string;
  photo?: string;
  created_at?: string;
  message?: string;
  title?: string;
  notification_created_at?: string;
  notify_to_name?: string;
  notify_by_photo?: string;
};

const NotificationPage = () => {
  const useremail = localStorage.getItem("user");
  const userrole = localStorage.getItem("role");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (useremail) {
          const data = await allNotificationAction(useremail);
          setNotifications(data);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    fetchNotifications();
  }, [useremail, itemsPerPage]);

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
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold mb-5">{t("all_notifications")}</h2>
      {notifications.length === 0 ? (
        <div className="text-slate-500 flex justify-center items-center h-40">
          {t("no_notifications_found")}
        </div>
      ) : (
        <div className="space-y-4">
          {currentNotifications.map((notification, index) => (
            <div
              key={notification.id || index}
              className="flex items-start p-4 bg-white dark:bg-darkmode-600 shadow rounded-lg"
            >
              <div className="flex-none w-10 h-10 rounded-full overflow-hidden mr-3">
                <img
                  src={
                    notification.notify_by_photo || "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                  }
                  alt="User"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-base">
                    {notification.notify_by_name || "Unknown User"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {notification.notification_created_at
                      ? new Date(
                          notification.notification_created_at
                        ).toLocaleString()
                      : ""}
                  </div>
                </div>
                <div className="text-slate-600 mt-1">
                  {notification.message || notification.title || t("Nomessage")}
                </div>
              </div>
            </div>
          ))}

          {notifications.length > 0 && (
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

              {/* Items Per Page Selector */}
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
      )}
    </div>
  );
};

export default NotificationPage;
