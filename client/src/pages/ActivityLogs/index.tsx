import { useState, useEffect } from "react";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import clsx from "clsx";
import {
  getActivityLogsAction,
  deleteLogsAction,
} from "@/actions/adminActions";
import { t } from "i18next";
import { getUserOrgIdAction } from "@/actions/userActions";
import Alerts from "@/components/Alert";

interface LogData {
  id: number;
  created_at: string;
  user: { name: string; role: string };
  action_type: string;
  entity_name: string;
  entity_id: number;
  ip_address?: string;
  details: {
    data?: Record<string, any>;
    changes?: Record<string, { old: any; new: any }>;
  };
}

interface AlertData {
  variant: "success" | "danger" | "warning";
  message: string;
}

const LogDetailsViewer = ({ log }: { log: LogData }) => {
  // ... (keep the same LogDetailsViewer component)
  if (!log || !log.details)
    return <div className="text-slate-500">{t("Nodetailsavailable")}</div>;

  const fieldLabels: Record<string, string> = {
    fname: "First Name",
    lname: "Last Name",
    username: "Username",
    uemail: "Email",
    phone: "Phone Number",
    role: "Role",
    status: "Status",
    organisation_id: "Organisation",
  };

  const getLabel = (key: string) => {
    if (fieldLabels[key]) return fieldLabels[key];
    return key.replace(/_/g, " ");
  };

  const shouldShowField = (key: string) => {
    const lowerKey = key.toLowerCase();
    return lowerKey !== "id" && !lowerKey.endsWith("_id");
  };

  // Function to check if a value is a file URL
  const isFileUrl = (value: any): boolean => {
    if (typeof value !== "string") return false;
    return value.startsWith("https://insightxr.s3.eu-west-2.amazonaws.com/");
  };

  // Function to check if a file is an image
  const isImageFile = (url: string): boolean => {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
      ".jfif",
    ];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
  };

  // Function to get file name from URL
  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return pathParts[pathParts.length - 1];
    } catch {
      return url.split("/").pop() || "file";
    }
  };

  // Function to render file preview or download link
  const renderFileContent = (url: string) => {
    const fileName = getFileName(url);

    if (isImageFile(url)) {
      return (
        <div className="mt-2">
          <div className="relative w-32 h-32 border rounded-md overflow-hidden">
            <img
              src={url}
              alt={fileName}
              className="object-cover w-full h-full"
              onError={(e) => {
                // If image fails to load, show file icon instead
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                      <Lucide icon="File" class="w-8 h-8 text-slate-400 mb-1" />
                      <span class="text-xs text-slate-600 truncate px-2">${fileName}</span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-2">
          <div className="flex items-center p-2 border rounded-md bg-slate-50">
            <Lucide icon="File" className="w-5 h-5 mr-2 text-slate-500" />
            <span className="flex-1 text-sm truncate">{fileName}</span>
            <a
              href={url}
              download={fileName}
              className="ml-2 text-primary hover:underline"
            >
              <Lucide icon="Download" className="w-4 h-4" />
            </a>
          </div>
        </div>
      );
    }
  };

  // Function to render value with file detection
  const renderValue = (value: any, key?: string) => {
    if (isFileUrl(value)) {
      return <div className="mt-1">{renderFileContent(value)}</div>;
    }

    // For arrays or objects, stringify them
    if (typeof value === "object" && value !== null) {
      return (
        <div className="mt-1">
          <pre className="p-2 text-xs bg-slate-50 rounded border overflow-auto max-h-32">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    return <span className="text-slate-900">{String(value)}</span>;
  };

  if (log.action_type === "UPDATE" && log.details.changes) {
    const changes = Object.entries(log.details.changes).filter(([key]) =>
      shouldShowField(key)
    );

    if (changes.length === 0)
      return (
        <div className="text-slate-500 italic">
          {t("Nospecificchangestodisplay")}
        </div>
      );

    return (
      <div className="overflow-hidden border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b">{t("Field")}</th>
              <th className="p-2 border-b text-danger">{t("Before")}</th>
              <th className="p-2 border-b text-success">{t("After")}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map(([key, val]: any) => (
              <tr key={key} className="border-b last:border-0">
                <td className="p-2 font-medium capitalize border-r">
                  {getLabel(key)}
                </td>
                <td className="p-2 text-danger bg-red-50 border-r">
                  {isFileUrl(val.old) ? (
                    renderFileContent(val.old)
                  ) : (
                    <div className="break-all">{String(val.old ?? "N/A")}</div>
                  )}
                </td>
                <td className="p-2 text-success bg-green-50">
                  {isFileUrl(val.new) ? (
                    renderFileContent(val.new)
                  ) : (
                    <div className="break-all">{String(val.new ?? "N/A")}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const snapshotData = log.details.data || {};

  const visibleData = Object.entries(snapshotData).filter(([key]) =>
    shouldShowField(key)
  );

  if (visibleData.length === 0) {
    return (
      <div className="text-slate-500 italic">
        {t("Nospecificdatachangesrecorded")}
      </div>
    );
  }

  const isDelete = log.action_type === "DELETE";
  const isArchive = log.action_type === "ARCHIVE";

  return (
    <div
      className={clsx("p-4 rounded border", {
        "bg-red-50 border-red-200": isDelete,
        "bg-orange-50 border-orange-200": isArchive,
        "bg-slate-50 border-slate-200": !isDelete && !isArchive,
      })}
    >
      <h4
        className={clsx("font-bold mb-2", {
          "text-danger": isDelete,
          "text-warning": isArchive,
          "text-slate-700": !isDelete && !isArchive,
        })}
      >
        {isDelete
          ? "Deleted Record Data:"
          : isArchive
          ? "Archived Record Data:"
          : "Record Data:"}
      </h4>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        {visibleData.map(([key, val]) => (
          <div key={key} className="break-all">
            <div className="font-semibold text-slate-600 capitalize">
              {getLabel(key)}:
            </div>
            {isFileUrl(val) ? (
              renderFileContent(val)
            ) : (
              <span className="text-slate-900">{String(val)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function ActivityLogs() {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [currentLogs, setCurrentLogs] = useState<LogData[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // Properties to search in logs
  const propertiesToSearch = [
    "user.name",
    "user.role",
    "action_type",
    "entity_name",
    "ip_address",
    "created_at",
  ];

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getActivityLogsAction();

      if (response && response.data) {
        setLogs(response.data || []);
        setFilteredLogs(response.data || []);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setShowAlert({
        variant: "danger",
        message: "Failed to fetch activity logs",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    if (Array.isArray(logs) && logs.length !== 0) {
      let filtered = logs;

      if (searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        filtered = filtered.filter((log) => {
          return propertiesToSearch.some((prop) => {
            // Handle nested properties (e.g., user.name)
            if (prop.includes(".")) {
              const props = prop.split(".");
              let value: any = log;

              for (const p of props) {
                if (value && typeof value === "object") {
                  value = value[p as keyof typeof value];
                } else {
                  value = undefined;
                  break;
                }
              }

              if (value !== undefined && value !== null) {
                return value.toString().toLowerCase().includes(searchLower);
              }
            } else {
              // Handle direct properties
              const fieldValue = log[prop as keyof LogData];
              if (fieldValue !== undefined && fieldValue !== null) {
                return fieldValue
                  .toString()
                  .toLowerCase()
                  .includes(searchLower);
              }
            }

            // Also search in details if needed
            if (log.details?.data) {
              const detailsStr = JSON.stringify(log.details.data).toLowerCase();
              if (detailsStr.includes(searchLower)) return true;
            }

            return false;
          });
        });
      }

      setFilteredLogs(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPage(1); // Reset to first page when search changes
    } else {
      setFilteredLogs([]);
      setTotalPages(1);
    }
  }, [searchQuery, logs, itemsPerPage]);

  // Update current logs for pagination
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const newCurrentLogs = filteredLogs.slice(
      indexOfFirstItem,
      indexOfLastItem
    );
    setCurrentLogs(newCurrentLogs);

    // Reset selection when current logs change
    setSelectedLogs(new Set());
    setSelectAllChecked(false);
  }, [currentPage, itemsPerPage, filteredLogs]);

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleRefresh = () => {
    fetchLogs();
    setSearchQuery("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAllChecked(checked);
    if (checked) {
      const allIds = new Set(currentLogs.map((log) => log.id));
      setSelectedLogs(allIds);
    } else {
      setSelectedLogs(new Set());
    }
  };

  const handleRowCheckboxChange = (id: number) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLogs(newSelected);
    setSelectAllChecked(newSelected.size === currentLogs.length);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDeleteClick = (id?: number) => {
    if (id) {
      // Single log deletion
      setLogIdToDelete(id);
    } else if (selectedLogs.size > 0) {
      // Multiple logs deletion
      setLogIdToDelete(null);
    }
    setDeleteConfirmationModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");

      const idsToDelete = logIdToDelete
        ? [logIdToDelete]
        : Array.from(selectedLogs);

      if (idsToDelete.length === 0) {
        setShowAlert({
          variant: "danger",
          message: "No logs selected for deletion",
        });
        setDeleteConfirmationModal(false);
        setIsDeleting(false);
        return;
      }

      const response = await deleteLogsAction(idsToDelete, data1.id);

      if (response) {
        setShowAlert({
          variant: "success",
          message:
            response.message ||
            `${idsToDelete.length} log(s) deleted successfully`,
        });

        await fetchLogs();

        // Clear selection
        setSelectedLogs(new Set());
        setSelectAllChecked(false);

        // Close modal
        setDeleteConfirmationModal(false);
        setLogIdToDelete(null);
      } else {
        setShowAlert({
          variant: "danger",
          message: response.message || "Failed to delete logs",
        });
        setDeleteConfirmationModal(false);
      }
    } catch (error) {
      console.error("Error deleting logs:", error);
      setShowAlert({
        variant: "danger",
        message: "Failed to delete logs",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getSelectedCountText = () => {
    const count = selectedLogs.size;
    if (count === 0) return "No logs selected";
    if (count === 1) return "1 log selected";
    return `${count} logs selected`;
  };

  return (
    <>
      {/* Alert Component */}
      {showAlert && <Alerts data={showAlert} />}

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("System Logs")}</h2>
        <div className="flex w-full mt-4 sm:w-auto sm:mt-0">
          <Button
            variant="primary"
            className="mr-2 shadow-md"
            onClick={handleRefresh}
          >
            <Lucide icon="RefreshCw" className="w-4 h-4 mr-2" />
            {t("Refresh")}
          </Button>
          <Button
            variant="danger"
            className="shadow-md"
            onClick={() => handleDeleteClick()}
            disabled={selectedLogs.size === 0}
          >
            <Lucide icon="Trash2" className="w-4 h-4 mr-2" />
            {t("Delete")}
          </Button>
        </div>
      </div>

      <div className="p-5 mt-5 intro-y box">
        {/* SEARCH BAR (Simplified like users list) */}
        <div className="flex flex-col sm:flex-row sm:items-end xl:items-start mb-5">
          <div className="w-full sm:w-auto sm:ml-auto">
            <div className="relative w-56 text-slate-500">
              <FormInput
                type="text"
                className="w-56 pr-10 !box"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Lucide
                icon="Search"
                className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
              />
            </div>
          </div>

          {/* Selected logs info */}
          {/* {selectedLogs.size > 0 && (
            <div className="mt-2 sm:mt-0 sm:ml-4">
              <div className="p-2 text-sm bg-slate-100 rounded-md text-slate-600">
                {getSelectedCountText()}
              </div>
            </div>
          )} */}
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-x-auto rounded-lg">
          <Table
            striped
            className="w-full table-auto border-spacing-y-[10px] border-separate -mt-2"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="border-b-0 whitespace-nowrap w-10">
                  <FormCheck.Input
                    id="select-all"
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("Date")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("User")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("Role")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("Action")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("Entity")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("Details")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("Actions")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={8}
                    className="text-center py-10 text-slate-500 bg-white"
                  >
                    {t("Loading...")}
                  </Table.Td>
                </Table.Tr>
              ) : currentLogs.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={8}
                    className="text-center py-10 text-slate-500 bg-white"
                  >
                    {searchQuery
                      ? t("No logs found for your search")
                      : t("No logs found")}
                  </Table.Td>
                </Table.Tr>
              ) : (
                currentLogs.map((log) => (
                  <Table.Tr key={log.id} className="intro-x">
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedLogs.has(log.id)}
                        onChange={() => handleRowCheckboxChange(log.id)}
                      />
                    </Table.Td>

                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </Table.Td>

                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="font-medium whitespace-nowrap">
                        {log.user?.name || "Unknown"}
                      </div>
                    </Table.Td>

                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <span>{log.user?.role || "System"}</span>
                    </Table.Td>

                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div
                        className={clsx(
                          "flex items-center justify-center font-medium",
                          {
                            "text-success": log.action_type === "CREATE",
                            "text-primary": log.action_type === "UPDATE",
                            "text-danger": log.action_type === "DELETE",
                            "text-warning": log.action_type === "ARCHIVE",
                          }
                        )}
                      >
                        <Lucide
                          icon={
                            log.action_type === "CREATE"
                              ? "PlusCircle"
                              : log.action_type === "UPDATE"
                              ? "Pen"
                              : log.action_type === "DELETE"
                              ? "Trash"
                              : "Archive"
                          }
                          className="w-4 h-4 mr-1"
                        />
                        {log.action_type}
                      </div>
                    </Table.Td>

                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div>
                        <div className="font-medium">{log.entity_name}</div>
                      </div>
                    </Table.Td>

                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex items-center justify-center">
                        <a
                          className="flex items-center text-primary cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedLog(log);
                            setModalOpen(true);
                          }}
                        >
                          <Lucide icon="Eye" className="w-4 h-4 mr-1" /> View
                        </a>
                      </div>
                    </Table.Td>

                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(log.id)}
                        >
                          <Lucide icon="Trash2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4 mt-4">
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
                    </Pagination.Link>
                  );

                  if (currentPage > ellipsisThreshold + 2) {
                    pages.push(
                      <span
                        key="ellipsis-start"
                        className="px-3 py-2 text-slate-500"
                      >
                        ...
                      </span>
                    );
                  }

                  const startPage = Math.max(
                    2,
                    currentPage - ellipsisThreshold
                  );
                  const endPage = Math.min(
                    totalPages - 1,
                    currentPage + ellipsisThreshold
                  );

                  for (let i = startPage; i <= endPage; i++) {
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

                  if (currentPage < totalPages - ellipsisThreshold - 1) {
                    pages.push(
                      <span
                        key="ellipsis-end"
                        className="px-3 py-2 text-slate-500"
                      >
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
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            <div className="hidden mx-auto md:block text-slate-500">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredLogs.length)} of{" "}
              {filteredLogs.length} entries
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

      {/* View Details Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">
              {t("Activity Details")}
            </h2>
          </Dialog.Title>
          <Dialog.Description>
            {selectedLog && (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-slate-600">
                  <span className="font-bold">{selectedLog.action_type}</span>{" "}
                  on{" "}
                  <span className="font-bold">{selectedLog.entity_name}</span>
                  <br />
                  By: {selectedLog.user?.name}
                  <br />
                  Date: {new Date(selectedLog.created_at).toLocaleString()}
                </div>
                <LogDetailsViewer log={selectedLog} />
              </div>
            )}
          </Dialog.Description>
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => setModalOpen(false)}
            >
              {t("Close")}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
          setLogIdToDelete(null);
        }}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Trash2"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">
              {logIdToDelete
                ? "Are you sure you want to delete this log? This action cannot be undone."
                : `Are you sure you want to delete ${selectedLogs.size} selected log(s)? This action cannot be undone.`}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setLogIdToDelete(null);
              }}
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Lucide icon="Loader" className="w-4 h-4 mr-2 animate-spin" />
                  {t("Deleting...")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default ActivityLogs;
