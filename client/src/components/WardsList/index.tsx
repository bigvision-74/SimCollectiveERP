import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import {
  FormInput,
  FormSelect,
  FormCheck,
  FormLabel,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import Alerts from "@/components/Alert";
import { Dialog } from "@/components/Base/Headless";
import { t } from "i18next";
import clsx from "clsx";
import { getAdminOrgAction } from "@/actions/adminActions";
import { getUserByOrgAction } from "@/actions/userActions";
import {
  getAllWardsAction,
  deleteWardsAction,
  getWardByIdAction,
  updateWardAction,
  allOrgPatientsAction,
} from "@/actions/patientActions";
import WardDetails from "../WardDetails";

interface UserObj {
  id: string;
  fname: string;
  lname: string;
  user_thumbnail?: string;
  uemail?: string;
  role?: string;
  name?: string;
}

interface Patient {
  id: string;
  name: string;
  condition: string;
  age?: number;
}

interface Ward {
  id: number;
  name: string;
  faculty: UserObj | null;
  observer: UserObj | null;
  patientCount?: number;
  studentCount?: number;
  created_at: string;
  orgId: string;
}

interface ComponentProps {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

interface MultiSelectProps<T> {
  options: T[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  error?: boolean;
}

// --- MultiSelect Component ---
const MultiSelectDropdown = <T,>({
  options,
  selectedIds,
  onChange,
  getLabel,
  getId,
  placeholder = "Select...",
  error = false,
}: MultiSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full border rounded px-3 py-2 cursor-pointer bg-white dark:bg-darkmode-800 flex justify-between items-center",
          "border-slate-200 shadow-sm transition duration-200 ease-in-out dark:border-darkmode-400",
          error && "border-danger"
        )}
      >
        <span
          className={clsx(
            "truncate",
            selectedIds.length === 0 && "text-slate-400"
          )}
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} ${t("selected1")}`
            : placeholder}
        </span>
        <Lucide icon="ChevronDown" className="w-4 h-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkmode-800 border border-slate-200 dark:border-darkmode-400 rounded shadow-lg overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">
              {t("Nooptionsavailable")}
            </div>
          ) : (
            <div className="p-2">
              {options.map((option) => {
                const id = getId(option);
                const isSelected = selectedIds.includes(id);
                return (
                  <div
                    key={id}
                    className="flex items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-darkmode-700 cursor-pointer transition-colors"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.tagName === "INPUT" ||
                        target.tagName === "LABEL"
                      )
                        return;
                      handleCheckboxChange(id);
                    }}
                  >
                    <FormCheck className="flex items-center w-full">
                      <FormCheck.Input
                        id={`chk-${id}`}
                        type="checkbox"
                        className="mr-2 border cursor-pointer"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(id)}
                      />
                      <FormCheck.Label
                        htmlFor={`chk-${id}`}
                        className="cursor-pointer select-none w-full"
                      >
                        {getLabel(option)}
                      </FormCheck.Label>
                    </FormCheck>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Helper: Status Color/Text ---
const getCountStatus = (current: number, required: number) => {
  const diff = required - current;
  if (diff === 0) return { text: "Complete", color: "text-success" };
  if (diff > 0) return { text: `${diff} remaining`, color: "text-danger" };
  return { text: `${Math.abs(diff)} over limit`, color: "text-danger" };
};

interface ComponentProps {
  onShowAlert: (alert: { variant: "success" | "danger"; message: string }) => void;
  onSidebarVisibility: (hide: boolean) => void;
  onStartSession: (data: any) => void; // Recieving from UsersPage
}

const WardsList: React.FC<ComponentProps> = ({ 
  onShowAlert, 
  onSidebarVisibility,
  onStartSession
}) => {
  // --- State: List & Pagination ---
  const [wards, setWards] = useState<Ward[]>([]);
  const [currentWards, setCurrentWards] = useState<Ward[]>([]);
  const [filteredWards, setFilteredWards] = useState<Ward[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWards, setSelectedWards] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // --- State: Delete Modal ---
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [wardIdToDelete, setWardIdToDelete] = useState<number | null>(null);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const deleteButtonRef = useRef(null);

  // --- State: Edit Modal ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editWardId, setEditWardId] = useState<string | number | null>(null);
  const [editFetching, setEditFetching] = useState(false);

  // --- State: Edit Form Fields ---
  const [editWardName, setEditWardName] = useState("");
  const [editFaculty, setEditFaculty] = useState("");
  const [editObserver, setEditObserver] = useState("");
  const [editSelectedPatients, setEditSelectedPatients] = useState<Patient[]>(
    []
  );
  const [editSelectedUsers, setEditSelectedUsers] = useState<UserObj[]>([]);
  const [editErrors, setEditErrors] = useState({
    wardName: "",
    patients: "",
    users: "",
    faculty: "",
  });

  // --- State: Data Sources ---
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserObj[]>([]);
  const [facultyList, setFacultyList] = useState<UserObj[]>([]);
  const [observerList, setObserverList] = useState<UserObj[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [viewWardId, setViewWardId] = useState<string | number | null>(null);

  // --- Fetch Wards ---
  const fetchWards = async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(userEmail));
      setOrgId(userData.organisation_id);

      const response = await getAllWardsAction(userData.orgid);

      if (response && response.success) {
        setWards(response.data);
        setFilteredWards(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setSelectedWards(new Set());
        setSelectAllChecked(false);
      } else {
        setWards([]);
        setFilteredWards([]);
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
      onShowAlert({ variant: "danger", message: t("Failedtofetchwards") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  // --- Search & Pagination Logic ---
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    if (!wards) return;

    const filtered = wards.filter((ward) => {
      const wName = ward.name?.toLowerCase() || "";
      const fName = ward.faculty
        ? `${ward.faculty.fname} ${ward.faculty.lname}`.toLowerCase()
        : "";
      return wName.includes(lowerQuery) || fName.includes(lowerQuery);
    });

    setFilteredWards(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchQuery, wards, itemsPerPage]);

  useEffect(() => {
    const last = currentPage * itemsPerPage;
    const first = last - itemsPerPage;
    setCurrentWards(filteredWards.slice(first, last));
  }, [currentPage, itemsPerPage, filteredWards]);

  // --- Delete Handlers ---
  const handleDelete = (id: number) => {
    setWardIdToDelete(id);
    setIsBatchDelete(false);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedWards.size === 0) return;
    setWardIdToDelete(null);
    setIsBatchDelete(true);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      if (isBatchDelete) {
        const promises = Array.from(selectedWards).map((id) =>
          deleteWardsAction(String(id))
        );
        const results = await Promise.all(promises);
        const allOk = results.every((res) => res.success);
        if (allOk)
          onShowAlert({
            variant: "success",
            message: t("Selectedwardsdeleted"),
          });
        else
          onShowAlert({
            variant: "danger",
            message: t("Somewardsfailedtodelete"),
          });
      } else if (wardIdToDelete) {
        const res = await deleteWardsAction(String(wardIdToDelete));
        if (res.success)
          onShowAlert({
            variant: "success",
            message: t("Warddeletedsuccessfully"),
          });
        else
          onShowAlert({
            variant: "danger",
            message: res.message || t("Failedtodelete"),
          });
      }
      setDeleteConfirmationModal(false);
      fetchWards();
    } catch (error) {
      onShowAlert({ variant: "danger", message: t("Erroroccurred") });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Validation Helpers ---
  const validatePatients = (count: number) => {
    if (count === 12) return "";
    return t(`Selected: ${count}. Required: 12.`);
  };

  const validateUsers = (count: number) => {
    if (count === 4) return "";
    return t(`Selected: ${count}. Required: 4.`);
  };

  // --- Edit Handlers ---
  const handleEditOpen = async (id: number) => {
    setEditWardId(id);
    setEditModalOpen(true);
    setEditFetching(true);
    // Reset errors on open
    setEditErrors({ wardName: "", patients: "", users: "", faculty: "" });

    try {
      const currentOrgId =
        orgId ||
        (await getAdminOrgAction(String(localStorage.getItem("user"))))
          .organisation_id;

      // Parallel Fetch
      const [patientsRes, usersRes, wardRes] = await Promise.all([
        allOrgPatientsAction(currentOrgId),
        getUserByOrgAction(currentOrgId),
        getWardByIdAction(String(id)),
      ]);

      // Process Patients
      let allP: Patient[] = [];
      if (patientsRes) {
        const rawP = Array.isArray(patientsRes)
          ? patientsRes
          : patientsRes.data || [];
        allP = rawP.map((p: any) => ({
          id: String(p._id || p.id),
          name: p.name,
          condition: p.category || p.condition || "Unknown",
        }));
        setAvailablePatients(allP);
      }

      // Process Users
      let allU: UserObj[] = [];
      if (usersRes) {
        const rawU = Array.isArray(usersRes) ? usersRes : usersRes.data || [];
        allU = rawU.map((u: any) => ({
          id: String(u._id || u.id),
          fname: u.fname,
          lname: u.lname,
          name: `${u.fname} ${u.lname}`,
          role: u.role,
        }));
        setFacultyList(allU.filter((u) => u.role?.toLowerCase() === "faculty"));
        setObserverList(
          allU.filter((u) =>
            ["observer", "nurse"].includes(u.role?.toLowerCase() || "")
          )
        );
        setAvailableUsers(
          allU.filter((u) =>
            ["student", "intern", "user"].includes(u.role?.toLowerCase() || "")
          )
        );
      }

      // Populate Ward Data
      if (wardRes && wardRes.success) {
        const w = wardRes.data;
        setEditWardName(w.name);

        const facultyId =
          typeof w.faculty === "object" && w.faculty
            ? w.faculty._id || w.faculty.id
            : w.faculty;
        const observerId =
          typeof w.observer === "object" && w.observer
            ? w.observer._id || w.observer.id
            : w.observer;

        setEditFaculty(facultyId ? String(facultyId) : "");
        setEditObserver(observerId ? String(observerId) : "");

        // Map Patients
        const rawWardPatients = w.patients || [];
        const targetPatientIds = rawWardPatients.map((item: any) =>
          typeof item === "object" && item !== null
            ? String(item._id || item.id)
            : String(item)
        );
        setEditSelectedPatients(
          allP.filter((p) => targetPatientIds.includes(p.id))
        );

        // Map Users
        const rawWardUsers = w.users || [];
        const targetUserIds = rawWardUsers.map((item: any) =>
          typeof item === "object" && item !== null
            ? String(item._id || item.id)
            : String(item)
        );
        setEditSelectedUsers(allU.filter((u) => targetUserIds.includes(u.id)));
      } else {
        onShowAlert({
          variant: "danger",
          message: t("Couldnotloadwarddetails"),
        });
        setEditModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      onShowAlert({ variant: "danger", message: t("Errorloadingeditdata") });
      setEditModalOpen(false);
    } finally {
      setEditFetching(false);
    }
  };

  // --- Dynamic Change Handlers with Validation ---

  const handleEditPatientsChange = (ids: string[]) => {
    const newSelectedPatients = availablePatients.filter((p) =>
      ids.includes(p.id)
    );
    setEditSelectedPatients(newSelectedPatients);

    if (editErrors.patients || newSelectedPatients.length !== 12) {
      setEditErrors((prev) => ({
        ...prev,
        patients: validatePatients(newSelectedPatients.length),
      }));
    }
  };

  const handleEditUsersChange = (ids: string[]) => {
    const newSelectedUsers = availableUsers.filter((u) => ids.includes(u.id));
    setEditSelectedUsers(newSelectedUsers);

    if (editErrors.users || newSelectedUsers.length !== 4) {
      setEditErrors((prev) => ({
        ...prev,
        users: validateUsers(newSelectedUsers.length),
      }));
    }
  };

  const handleEditSubmit = async () => {
    let isValid = true;
    const newErrors = { wardName: "", patients: "", users: "", faculty: "" };

    if (!editWardName.trim()) {
      newErrors.wardName = t("Wardnameisrequired");
      isValid = false;
    }

    if (!editFaculty) {
      newErrors.faculty = t("Facultyisrequired");
      isValid = false;
    }

    if (editSelectedPatients.length !== 12) {
      newErrors.patients = validatePatients(editSelectedPatients.length);
      isValid = false;
    }

    if (editSelectedUsers.length !== 4) {
      newErrors.users = validateUsers(editSelectedUsers.length);
      isValid = false;
    }

    setEditErrors(newErrors);

    if (isValid) {
      setActionLoading(true);
      try {
        const payload = {
          wardName: editWardName,
          facultyId: String(editFaculty),
          observerId: editObserver ? String(editObserver) : "", 
          patients: editSelectedPatients.map((p) => String(p.id)), 
          users: editSelectedUsers.map((u) => String(u.id)), 
        };

        const res = await updateWardAction(
          String(editWardId),
          JSON.stringify(payload)
        );

        if (res.success) {
          onShowAlert({
            variant: "success",
            message: t("Wardupdatedsuccessfully"),
          });
          setEditModalOpen(false);
          fetchWards();
        } else {
          onShowAlert({
            variant: "danger",
            message: res.message || t("Updatefailed"),
          });
        }
      } catch (e) {
        onShowAlert({ variant: "danger", message: t("Errorupdatingward") });
      } finally {
        setActionLoading(false);
      }
    }
  };

  // --- Render Helpers ---
  const patientStatus = getCountStatus(editSelectedPatients.length, 12);
  const userStatus = getCountStatus(editSelectedUsers.length, 4);

  const formatName = (user: UserObj | null) => {
    if (!user)
      return <span className="text-slate-400 italic">{t("NotAssigned")}</span>;
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 mr-2 image-fit">
          <img
            alt={user.fname}
            className="rounded-full"
            src={
              user.user_thumbnail?.startsWith("http")
                ? user.user_thumbnail
                : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
            }
          />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-xs">
            {user.fname} {user.lname}
          </span>
        </div>
      </div>
    );
  };

  const handleViewWard = (id: number) => {
    setViewWardId(id);
    setViewMode("detail");
    // Optional: Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setViewMode("list");
    setViewWardId(null);
     onSidebarVisibility(false);
  };

  // If in Detail Mode, return the Detail Component immediately
  if (viewMode === "detail" && viewWardId) {
    return (
      <div className="p-5">
        <WardDetails 
          wardId={viewWardId} 
          onBack={handleBackToList} 
          onSidebarVisibility={onSidebarVisibility}
          onStartSession={onStartSession} // Pass it to Component C
        />
      </div>
    );
  }

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <div className="grid grid-cols-12 gap-6 p-5">
        {/* --- Toolbar --- */}
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y">
          {/* <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              className="mr-2 shadow-md"
              onClick={handleDeleteSelected}
              disabled={selectedWards.size <= 0}
            >
              <Lucide icon="Trash2" className="w-4 h-4 mr-2" />
              {t("Delete Selected")}
            </Button>
          </div> */}
          <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto">
            <div className="relative w-56 text-slate-500">
              <FormInput
                type="text"
                className="w-56 pr-10 !box"
                placeholder={t("SearchWards")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Lucide
                icon="Search"
                className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
              />
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="col-span-12 overflow-auto intro-y lg:overflow-visible">
          <Table className="border-spacing-y-[10px] border-separate -mt-2">
            <Table.Thead>
              <Table.Tr>
                {/* <Table.Th className="border-b-0 whitespace-nowrap w-10">
                  <FormCheck.Input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedWards(
                          new Set(currentWards.map((w) => w.id))
                        );
                      else setSelectedWards(new Set());
                      setSelectAllChecked(e.target.checked);
                    }}
                  />
                </Table.Th> */}
                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("Ward Name")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("faculty")}
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("Observer")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("actions")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentWards.map((ward, index) => (
                <Table.Tr key={ward.id} className="intro-x">
                  {/* <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r dark:bg-darkmode-600">
                    <FormCheck.Input
                      type="checkbox"
                      checked={selectedWards.has(ward.id)}
                      onChange={() => {
                        const newSet = new Set(selectedWards);
                        if (newSet.has(ward.id)) newSet.delete(ward.id);
                        else newSet.add(ward.id);
                        setSelectedWards(newSet);
                        setSelectAllChecked(
                          newSet.size === currentWards.length &&
                            currentWards.length > 0
                        );
                      }}
                    />
                  </Table.Td> */}
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </Table.Td>
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    <div className="font-medium text-primary">{ward.name}</div>
                  </Table.Td>
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatName(ward.faculty)}
                  </Table.Td>
                  <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatName(ward.observer)}
                  </Table.Td>
                  <Table.Td
                    className={clsx([
                      "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                      "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                    ])}
                  >
                    <div className="flex items-center justify-center">
                      <a
                        className="flex items-center mr-3 text-primary cursor-pointer"
                        onClick={() => handleViewWard(ward.id)}
                      >
                        <Lucide icon="Eye" className="w-4 h-4 mr-1" /> View
                      </a>
                      <a
                        className="flex items-center mr-3 text-slate-500 cursor-pointer"
                        onClick={() => handleEditOpen(ward.id)}
                      >
                        <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />{" "}
                        Edit
                      </a>
                      <a
                        className="flex items-center text-danger cursor-pointer"
                        onClick={() => handleDelete(ward.id)}
                      >
                        <Lucide icon="Trash2" className="w-4 h-4 mr-1" /> Delete
                      </a>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        {/* --- Pagination --- */}
        {currentWards.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 col-span-12 intro-y">
            <Pagination className="w-full sm:w-auto sm:mr-auto">
              <Pagination.Link onPageChange={() => setCurrentPage(1)}>
                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link
                onPageChange={() =>
                  setCurrentPage(Math.max(1, currentPage - 1))
                }
              >
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>{currentPage}</Pagination.Link>
              <Pagination.Link
                onPageChange={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
              >
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link onPageChange={() => setCurrentPage(totalPages)}>
                <Lucide icon="ChevronsRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
            <FormSelect
              className="w-20"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </FormSelect>
          </div>
        )}

        {!loading && currentWards.length === 0 && (
          <div className="col-span-12 text-center text-slate-500 mt-5">
            {t("Nowardsfound")}
          </div>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      <Dialog
        size="xl"
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="relative z-50"
      >
        <Dialog.Panel className="w-full max-w-5xl bg-white dark:bg-darkmode-600 rounded-lg shadow-xl mx-auto mt-10">
          <div className="flex justify-between px-5 py-4 border-b dark:border-darkmode-400">
            <h2 className="font-medium">{t("EditWard")}</h2>
            <Lucide
              icon="X"
              className="w-5 h-5 cursor-pointer"
              onClick={() => setEditModalOpen(false)}
            />
          </div>

          <div className="p-5 overflow-y-auto">
            {editFetching ? (
              <div className="flex flex-col items-center py-10">
                <Lucide
                  icon="Loader2"
                  className="w-10 h-10 animate-spin text-slate-500"
                />
                <span className="mt-2">{t("loading")}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- LEFT: Ward Info & Patients --- */}
                <div>
                  <div className="mb-5">
                    <FormLabel className="font-bold">
                      {t("WardName")} <span className="text-danger">*</span>
                    </FormLabel>
                    <FormInput
                      value={editWardName}
                      onChange={(e) => {
                        setEditWardName(e.target.value);
                        if (e.target.value.trim())
                          setEditErrors((p) => ({ ...p, wardName: "" }));
                      }}
                      className={clsx({ "border-danger": editErrors.wardName })}
                    />
                    {editErrors.wardName && (
                      <div className="text-danger mt-1 text-sm">
                        {editErrors.wardName}
                      </div>
                    )}
                  </div>

                  <div className="mb-5">
                    <FormLabel className="font-bold">
                      {t("SelectPatients")} (Required: 12){" "}
                      <span className="text-danger">*</span>
                    </FormLabel>
                    <MultiSelectDropdown
                      options={availablePatients}
                      selectedIds={editSelectedPatients.map((p) => p.id)}
                      onChange={handleEditPatientsChange}
                      getId={(p) => p.id}
                      getLabel={(p) => p.name}
                      placeholder={t("Select 12 patients...")}
                      error={
                        !!editErrors.patients &&
                        editSelectedPatients.length !== 12
                      }
                    />
                    {editErrors.patients &&
                      editSelectedPatients.length !== 12 && (
                        <div className="text-danger mt-1 text-sm">
                          {editErrors.patients}
                        </div>
                      )}

                    {/* Patients Count & Chips */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs text-slate-500 font-bold">
                          {t("SelectedPatients")} ({editSelectedPatients.length}
                          /12):
                        </div>
                        <div
                          className={clsx(
                            "text-xs font-medium",
                            patientStatus.color
                          )}
                        >
                          {patientStatus.text}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 overflow-y-auto">
                        {editSelectedPatients.map((p) => (
                          <div
                            key={p.id}
                            className="relative group bg-blue-50 border border-blue-200 text-blue-700 rounded px-3 py-2 text-xs font-medium flex items-center justify-between transition-all"
                          >
                            <span className="truncate mr-2">{p.name}</span>
                            <button
                              onClick={() =>
                                handleEditPatientsChange(
                                  editSelectedPatients
                                    .filter((x) => x.id !== p.id)
                                    .map((x) => x.id)
                                )
                              }
                              className="text-blue-400 transition-colors"
                            >
                              <Lucide icon="X" className="w-4 h-4" bold />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- RIGHT: Faculty & Users --- */}
                <div>
                  <div className="mb-5">
                    <FormLabel className="font-bold">
                      {t("SelectFaculty")}{" "}
                      <span className="text-danger">*</span>
                    </FormLabel>
                    <FormSelect
                      value={editFaculty}
                      onChange={(e) => {
                        setEditFaculty(e.target.value);
                        if (e.target.value)
                          setEditErrors((p) => ({ ...p, faculty: "" }));
                      }}
                      className={clsx({ "border-danger": editErrors.faculty })}
                    >
                      <option value="">{t("Select...")}</option>
                      {facultyList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </FormSelect>
                    {editErrors.faculty && (
                      <div className="text-danger mt-1 text-sm">
                        {editErrors.faculty}
                      </div>
                    )}
                  </div>

                  <div className="mb-5">
                    <FormLabel className="font-bold">
                      {t("Select Observer")}
                    </FormLabel>
                    <FormSelect
                      value={editObserver}
                      onChange={(e) => setEditObserver(e.target.value)}
                    >
                      <option value="">{t("Select...")}</option>
                      {observerList.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  <div className="mb-5">
                    <FormLabel className="font-bold">
                      {t("AssignStu")} (Required: 4){" "}
                      <span className="text-danger">*</span>
                    </FormLabel>
                    <MultiSelectDropdown
                      options={availableUsers}
                      selectedIds={editSelectedUsers.map((u) => u.id)}
                      onChange={handleEditUsersChange}
                      getId={(u) => u.id}
                      getLabel={(u) => u.name || ""}
                      placeholder={t("Select 4 students...")}
                      error={
                        !!editErrors.users && editSelectedUsers.length !== 4
                      }
                    />
                    {editErrors.users && editSelectedUsers.length !== 4 && (
                      <div className="text-danger mt-1 text-sm">
                        {editErrors.users}
                      </div>
                    )}

                    {/* Student Count & Chips */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs text-slate-500 font-bold">
                          {t("SelectedStu")} ({editSelectedUsers.length}/4):
                        </div>
                        <div
                          className={clsx(
                            "text-xs font-medium",
                            userStatus.color
                          )}
                        >
                          {userStatus.text}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 overflow-y-auto">
                        {editSelectedUsers.map((u) => (
                          <div
                            key={u.id}
                            className="relative group bg-green-50 border border-blue-200 text-green-700 rounded px-3 py-2 text-xs font-medium flex items-center justify-between transition-all"
                          >
                            <span className="mr-2">{u.name}</span>
                            <button
                              onClick={() =>
                                handleEditUsersChange(
                                  editSelectedUsers
                                    .filter((x) => x.id !== u.id)
                                    .map((x) => x.id)
                                )
                              }
                              className="text-green-700 transition-colors"
                            >
                              <Lucide icon="X" className="w-4 h-4" bold />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end px-5 py-4 border-t dark:border-darkmode-400 bg-slate-50 dark:bg-darkmode-700 rounded-b-lg">
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              disabled={actionLoading || editFetching}
            >
              {actionLoading ? (
                <Lucide icon="Loader2" className="w-4 h-4 animate-spin" />
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* ================= DELETE CONFIRMATION ================= */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => setDeleteConfirmationModal(false)}
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
              {isBatchDelete ? t("Delete selected wards?") : t("ReallyArch")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="danger"
              type="button"
              className="w-24"
              ref={deleteButtonRef}
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                t("Archive")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default WardsList;
