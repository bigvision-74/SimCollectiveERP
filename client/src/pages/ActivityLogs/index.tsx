import { useState, useEffect } from "react";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import clsx from "clsx";
import { getActivityLogsAction } from "@/actions/adminActions";

// --- INTERFACES ---
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

// --- HELPER COMPONENT FOR LOG DETAILS ---
const LogDetailsViewer = ({ log }: { log: LogData }) => {
  if (!log || !log.details)
    return <div className="text-slate-500">No details available</div>;

  // 1. FIELD MAPPING CONFIGURATION
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

  // Helper: Get human readable label
  const getLabel = (key: string) => {
    // Check specific mapping first
    if (fieldLabels[key]) return fieldLabels[key];
    
    // Fallback: Replace underscores with spaces (e.g., date_of_birth -> date of birth)
    return key.replace(/_/g, " ");
  };

  // Helper: Hide ID fields
  const shouldShowField = (key: string) => {
    const lowerKey = key.toLowerCase();
    // Hides 'id', 'entity_id', 'user_id' but keeps 'organisation_id' if you want to show it (optional)
    // currently hiding all keys ending in _id except specific ones if needed.
    // For now, adhering to "do not show any id" request:
    return lowerKey !== "id" && !lowerKey.endsWith("_id");
  };

  // 2. UPDATE DIFF VIEW
  if (log.action_type === "UPDATE" && log.details.changes) {
    const changes = Object.entries(log.details.changes).filter(([key]) =>
      shouldShowField(key)
    );

    if (changes.length === 0) return <div className="text-slate-500 italic">No specific changes to display.</div>;

    return (
      <div className="overflow-hidden border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 border-b">Field</th>
              <th className="p-2 border-b text-danger">Before</th>
              <th className="p-2 border-b text-success">After</th>
            </tr>
          </thead>
          <tbody>
            {changes.map(([key, val]: any) => (
              <tr key={key} className="border-b last:border-0">
                <td className="p-2 font-medium capitalize border-r">
                  {getLabel(key)}
                </td>
                <td className="p-2 text-danger bg-red-50 border-r">
                  {String(val.old ?? "N/A")}
                </td>
                <td className="p-2 text-success bg-green-50">
                  {String(val.new ?? "N/A")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. CREATE/DELETE/ARCHIVE SNAPSHOT VIEW
  const snapshotData = log.details.data || {};
  
  const visibleData = Object.entries(snapshotData).filter(([key]) =>
    shouldShowField(key)
  );

  if (visibleData.length === 0) {
    return (
      <div className="text-slate-500 italic">
        No specific data changes recorded.
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
        {isDelete ? "Deleted Record Data:" : isArchive ? "Archived Record Data:" : "Record Data:"}
      </h4>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {visibleData.map(([key, val]) => (
          <div key={key} className="break-all">
            <span className="font-semibold text-slate-600 capitalize">
              {getLabel(key)}:{" "}
            </span>
            <span className="text-slate-900">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
function ActivityLogs() {
  // Data State
  const [logs, setLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Selection State
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // Filter State
  const [filterField, setFilterField] = useState("user.name");
  const [filterValue, setFilterValue] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);

  // Calculated properties
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalRecords);

  // --- FETCH DATA ---
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: currentPage,
        size: itemsPerPage,
      };

      if (filterValue.trim() !== "") {
        queryParams.filters = JSON.stringify([
          { field: filterField, type: "like", value: filterValue }
        ]);
      }

      const response = await getActivityLogsAction(queryParams);

      if (response) {
        setLogs(response.data || []);
        setTotalRecords(response.total_records || 0); 
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    setSelectedLogs(new Set());
    setSelectAllChecked(false);
  }, [currentPage, itemsPerPage]);

  // --- HANDLERS ---
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilter = () => {
    setFilterValue("");
    setFilterField("user.name");
    setCurrentPage(1);
    setTimeout(() => fetchLogs(), 10); 
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAllChecked(checked);
    if (checked) {
      const allIds = new Set(logs.map((log) => log.id));
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
    setSelectAllChecked(newSelected.size === logs.length);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">System Audit Logs</h2>
      </div>

      <div className="p-5 mt-5 intro-y box">
        {/* FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-end xl:items-start mb-5">
          <form className="xl:flex sm:mr-auto" onSubmit={handleFilterSubmit}>
            <div className="items-center sm:flex sm:mr-4">
              <label className="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                Field
              </label>
              <FormSelect
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full mt-2 sm:mt-0 sm:w-auto"
              >
                <option value="user.name">User Name</option>
                <option value="action_type">Action Type</option>
                <option value="entity_name">Entity Name</option>
              </FormSelect>
            </div>
            <div className="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
              <label className="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                Value
              </label>
              <FormInput
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                type="text"
                className="mt-2 sm:w-40 2xl:w-full sm:mt-0"
                placeholder="Search..."
              />
            </div>
            <div className="mt-2 xl:mt-0">
              <Button variant="primary" type="submit" className="w-full sm:w-16">
                Filter
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1"
                onClick={handleResetFilter}
              >
                Reset
              </Button>
            </div>
          </form>
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
                <Table.Th className="border-b-0 whitespace-nowrap">DATE</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">USER NAME</Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">ROLE</Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">ACTION</Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">ENTITY</Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">DETAILS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                   <Table.Td colSpan={7} className="text-center py-10 text-slate-500 bg-white">
                      Loading...
                   </Table.Td>
                </Table.Tr>
              ) : logs.length === 0 ? (
                 <Table.Tr>
                   <Table.Td colSpan={7} className="text-center py-10 text-slate-500 bg-white">
                      No logs found.
                   </Table.Td>
                </Table.Tr>
              ) : (
                logs.map((log) => (
                  <Table.Tr key={log.id} className="intro-x">
                    {/* CHECKBOX */}
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedLogs.has(log.id)}
                        onChange={() => handleRowCheckboxChange(log.id)}
                      />
                    </Table.Td>

                    {/* DATE */}
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                       <div className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                       </div>
                    </Table.Td>

                    {/* USER NAME */}
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="font-medium whitespace-nowrap">
                        {log.user?.name || "Unknown"}
                      </div>
                    </Table.Td>

                    {/* ROLE */}
                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                       <span>{log.user?.role || "System"}</span>
                    </Table.Td>

                    {/* ACTION TYPE */}
                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                       <div className={clsx("flex items-center justify-center font-medium", {
                          "text-success": log.action_type === "CREATE",
                          "text-primary": log.action_type === "UPDATE",
                          "text-danger": log.action_type === "DELETE",
                          "text-warning": log.action_type === "ARCHIVE",
                       })}>
                          <Lucide icon={
                             log.action_type === "CREATE" ? "PlusCircle" :
                             log.action_type === "UPDATE" ? "Pen" :
                             log.action_type === "DELETE" ? "Trash" : "Archive"
                          } className="w-4 h-4 mr-1" />
                          {log.action_type}
                       </div>
                    </Table.Td>

                    {/* ENTITY */}
                    <Table.Td className="box text-center rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                        <div>
                            <div className="font-medium">{log.entity_name}</div>
                        </div>
                    </Table.Td>

                    {/* ACTIONS BUTTON */}
                    <Table.Td className={clsx([
                        "box w-40 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                        "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400"
                    ])}>
                       <div className="flex items-center justify-center">
                          <a
                             className="flex items-center text-primary cursor-pointer mr-2"
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
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>

        {/* PAGINATION SECTION */}
        {logs.length > 0 && (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4 mt-4">
            {/* 1. PAGINATION CONTROLS */}
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link onPageChange={() => handlePageChange(currentPage - 1)}>
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {(() => {
                  const pages = [];
                  const ellipsisThreshold = 2;

                  // Always show First Page
                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => handlePageChange(1)}
                    >
                      1
                    </Pagination.Link>
                  );

                  // Start Ellipsis
                  if (currentPage > ellipsisThreshold + 2) {
                    pages.push(
                      <span key="ellipsis-start" className="px-3 py-2 text-slate-500">...</span>
                    );
                  }

                  // Middle Pages
                  const startPage = Math.max(2, currentPage - ellipsisThreshold);
                  const endPage = Math.min(totalPages - 1, currentPage + ellipsisThreshold);

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

                  // End Ellipsis
                  if (currentPage < totalPages - ellipsisThreshold - 1) {
                    pages.push(
                      <span key="ellipsis-end" className="px-3 py-2 text-slate-500">...</span>
                    );
                  }

                  // Always show Last Page (if more than 1 page)
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

                <Pagination.Link onPageChange={() => handlePageChange(currentPage + 1)}>
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link onPageChange={() => handlePageChange(totalPages)}>
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            {/* 2. SHOWING TEXT */}
            <div className="hidden mx-auto md:block text-slate-500">
               Showing {indexOfFirstItem + 1} to {indexOfLastItem} of {totalRecords} entries
            </div>

            {/* 3. ITEMS PER PAGE SELECTOR */}
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

      {/* MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">Activity Details</h2>
          </Dialog.Title>
          <Dialog.Description>
            {selectedLog && (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-slate-600">
                    <span className="font-bold">{selectedLog.action_type}</span> on <span className="font-bold">{selectedLog.entity_name}</span>
                    <br/>
                    By: {selectedLog.user?.name}
                    <br/>
                    Date: {new Date(selectedLog.created_at).toLocaleString()}
                </div>
                {/* Smart Component with Field Labels */}
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
              Close
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default ActivityLogs;