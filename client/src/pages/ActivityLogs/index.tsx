import "@/assets/css/vendors/tabulator.css";
import Lucide from "@/components/Base/Lucide";
import { Menu, Dialog } from "@/components/Base/Headless"; // Added Dialog for Modal
import Button from "@/components/Base/Button";
import { FormInput, FormSelect } from "@/components/Base/Form";
import * as xlsx from "xlsx";
import { useEffect, useRef, createRef, useState } from "react";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";

// Add this at the top
interface LogData {
  id: number;
  created_at: string;
  user: { name: string; role: string };
  action_type: string;
  entity_name: string;
  entity_id: number;
  ip_address: string;
  details: any;
}

// --- 1. DUMMY DATA FOR LOGS ---
const DUMMY_LOGS = [
  {
    id: 1,
    created_at: "2023-11-27T09:30:00",
    user: { name: "Dr. Ayesha Smith", role: "Doctor" },
    action_type: "UPDATE",
    entity_name: "Patient",
    entity_id: 1024,
    ip_address: "192.168.1.45",
    details: {
      changes: {
        status: { old: "Admitted", new: "Discharged" },
        assigned_nurse: { old: "Nurse Joy", new: "None" },
      },
    },
  },
  {
    id: 2,
    created_at: "2023-11-27T10:15:00",
    user: { name: "Admin User", role: "Administrator" },
    action_type: "CREATE",
    entity_name: "User",
    entity_id: 55,
    ip_address: "192.168.1.10",
    details: {
      data: {
        username: "jdoe",
        role: "Receptionist",
        email: "jdoe@hospital.com",
      },
    },
  },
  {
    id: 3,
    created_at: "2023-11-27T11:00:00",
    user: { name: "Nurse Joy", role: "Nurse" },
    action_type: "DELETE",
    entity_name: "Report",
    entity_id: 889,
    ip_address: "192.168.1.12",
    details: {
      data: {
        report_type: "Blood Test",
        generated_by: "Dr. House",
        reason: "Duplicate Entry",
      },
    },
  },
  {
    id: 4,
    created_at: "2023-11-27T12:30:00",
    user: { name: "Dr. Ayesha Smith", role: "Doctor" },
    action_type: "UPDATE",
    entity_name: "Prescription",
    entity_id: 4002,
    ip_address: "192.168.1.45",
    details: {
      changes: {
        dosage: { old: "500mg", new: "1000mg" },
        frequency: { old: "Once a day", new: "Twice a day" },
      },
    },
  },
];

// --- 2. HELPER COMPONENT FOR LOG DETAILS ---
const LogDetailsViewer = ({ log }: { log: any }) => {
  if (!log) return null;

  // Render Diff for Updates
  if (log.action_type === "UPDATE") {
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
            {Object.entries(log.details.changes || {}).map(
              ([key, val]: any) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="p-2 font-medium capitalize border-r">
                    {key.replace(/_/g, " ")}
                  </td>
                  <td className="p-2 text-danger bg-red-50 border-r">
                    {String(val.old)}
                  </td>
                  <td className="p-2 text-success bg-green-50">
                    {String(val.new)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Render Snapshot for Create/Delete
  const snapshotData = log.details.data || {};
  const isDelete = log.action_type === "DELETE";

  return (
    <div
      className={`p-4 rounded border ${
        isDelete ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
      }`}
    >
      <h4
        className={`font-bold mb-2 ${
          isDelete ? "text-danger" : "text-success"
        }`}
      >
        {isDelete ? "Deleted Record Data:" : "New Record Data:"}
      </h4>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {Object.entries(snapshotData).map(([key, val]) => (
          <div key={key}>
            <span className="font-semibold text-slate-600 capitalize">
              {key.replace(/_/g, " ")}:{" "}
            </span>
            <span className="text-slate-900">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 3. MAIN COMPONENT ---
function Main() {
  const tableRef = createRef<HTMLDivElement>();
  const tabulator = useRef<Tabulator>();
  const [filter, setFilter] = useState({
    field: "user.name",
    type: "like",
    value: "",
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const initTabulator = () => {
    if (tableRef.current) {
      tabulator.current = new Tabulator(tableRef.current, {
        data: DUMMY_LOGS,
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        layout: "fitColumns",
        responsiveLayout: "collapse",
        placeholder: "No logs found",
        columns: [
          // FIX 1: Added 'title' property (required by TS)
          {
            title: "",
            formatter: "responsiveCollapse",
            width: 40,
            minWidth: 30,
            hozAlign: "center",
            resizable: false,
            headerSort: false,
          },
          {
            title: "TIMESTAMP",
            field: "created_at",
            minWidth: 150,
            responsive: 0,
            vertAlign: "middle",
            formatter(cell) {
              const val = cell.getValue();
              return `<div class="text-slate-500 whitespace-nowrap">${new Date(
                val
              ).toLocaleString()}</div>`;
            },
          },
          {
            title: "ACTOR",
            field: "user.name",
            minWidth: 150,
            vertAlign: "middle",
            formatter(cell) {
              // FIX 2: Cast data to LogData interface
              const row = cell.getData() as LogData;
              return `<div>
                <div class="font-medium whitespace-nowrap">${row.user.name}</div>
                <div class="text-slate-500 text-xs whitespace-nowrap">${row.user.role}</div>
              </div>`;
            },
          },
          {
            title: "ACTION",
            field: "action_type",
            hozAlign: "center",
            width: 120,
            vertAlign: "middle",
            formatter(cell) {
              const action = cell.getValue();
              let colorClass = "text-slate-600";
              let iconName = "activity";

              if (action === "CREATE") {
                colorClass = "text-success";
                iconName = "plus-circle";
              }
              if (action === "UPDATE") {
                colorClass = "text-primary";
                iconName = "edit-2";
              }
              if (action === "DELETE") {
                colorClass = "text-danger";
                iconName = "trash";
              }

              return `<div class="flex items-center justify-center ${colorClass} font-bold">
                 <i data-lucide="${iconName}" class="w-4 h-4 mr-1"></i> ${action}
              </div>`;
            },
          },
          {
            title: "ENTITY",
            field: "entity_name",
            minWidth: 120,
            vertAlign: "middle",
            formatter(cell) {
              // FIX 3: Cast data to LogData interface
              const row = cell.getData() as LogData;
              return `<div>
                <span class="font-medium">${row.entity_name}</span> 
                <span class="text-slate-400 text-xs ml-1">#${row.entity_id}</span>
              </div>`;
            },
          },
          {
            title: "IP ADDRESS",
            field: "ip_address",
            visible: false,
            print: true,
            download: true,
          },
          {
            title: "DETAILS",
            minWidth: 100,
            field: "actions",
            hozAlign: "center",
            vertAlign: "middle",
            headerSort: false,
            cellClick: (e, cell) => {
              const logData = cell.getData() as LogData; // Cast here as well
              setSelectedLog(logData);
              setModalOpen(true);
            },
            formatter() {
              return `<button class="btn btn-sm btn-secondary w-24">View</button>`;
            },
          },
        ],
      });
    }

    tabulator.current?.on("renderComplete", () => {
      createIcons({
        icons,
        attrs: { "stroke-width": 1.5 },
        nameAttr: "data-lucide",
      });
    });
  };

  const reInitOnResizeWindow = () => {
    window.addEventListener("resize", () => {
      if (tabulator.current) {
        tabulator.current.redraw();
        createIcons({
          icons,
          attrs: { "stroke-width": 1.5 },
          nameAttr: "data-lucide",
        });
      }
    });
  };

  const onFilter = () => {
    if (tabulator.current) {
      tabulator.current.setFilter(filter.field, filter.type, filter.value);
    }
  };

  const onResetFilter = () => {
    setFilter({ ...filter, field: "user.name", type: "like", value: "" });
    onFilter();
  };

  // Export Functions
  const onExportCsv = () =>
    tabulator.current?.download("csv", "audit_logs.csv");
  const onExportJson = () =>
    tabulator.current?.download("json", "audit_logs.json");
  const onExportXlsx = () => {
    (window as any).XLSX = xlsx;
    tabulator.current?.download("xlsx", "audit_logs.xlsx", {
      sheetName: "Logs",
    });
  };
  const onPrint = () => tabulator.current?.print();

  useEffect(() => {
    initTabulator();
    reInitOnResizeWindow();
  }, []);

  return (
    <>
      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">System Audit Logs</h2>
      </div>

      {/* FILTERS */}
      <div className="p-5 mt-5 intro-y box">
        <div className="flex flex-col sm:flex-row sm:items-end xl:items-start">
          <form
            className="xl:flex sm:mr-auto"
            onSubmit={(e) => {
              e.preventDefault();
              onFilter();
            }}
          >
            <div className="items-center sm:flex sm:mr-4">
              <label className="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                Field
              </label>
              <FormSelect
                value={filter.field}
                onChange={(e) =>
                  setFilter({ ...filter, field: e.target.value })
                }
                className="w-full mt-2 sm:mt-0 sm:w-auto"
              >
                <option value="user.name">Actor Name</option>
                <option value="action_type">Action (Create/Update)</option>
                <option value="entity_name">Entity (Patient/User)</option>
              </FormSelect>
            </div>
            <div className="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
              <label className="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                Value
              </label>
              <FormInput
                value={filter.value}
                onChange={(e) =>
                  setFilter({ ...filter, value: e.target.value })
                }
                type="text"
                className="mt-2 sm:w-40 2xl:w-full sm:mt-0"
                placeholder="Search..."
              />
            </div>
            <div className="mt-2 xl:mt-0">
              <Button
                variant="primary"
                type="button"
                className="w-full sm:w-16"
                onClick={onFilter}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1"
                onClick={onResetFilter}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto scrollbar-hidden">
          <div id="tabulator" ref={tableRef} className="mt-5"></div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">
              Activity Details:{" "}
              <span className="text-slate-500">
                {selectedLog?.action_type} {selectedLog?.entity_name}
              </span>
            </h2>
          </Dialog.Title>
          <Dialog.Description>
            {selectedLog && (
              <div className="flex flex-col gap-4">
                <div className="text-xs text-slate-500">
                  Performed by{" "}
                  <span className="font-medium text-slate-700">
                    {selectedLog.user.name}
                  </span>{" "}
                  on {new Date(selectedLog.created_at).toLocaleString()}
                  <br />
                  IP Address: {selectedLog.ip_address}
                </div>
                {/* Use our Smart Component */}
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

export default Main;
