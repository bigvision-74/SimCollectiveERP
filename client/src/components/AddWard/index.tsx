import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/Base/Button";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";
import clsx from "clsx";
import { allOrgPatientsAction, saveWardAction } from "@/actions/patientActions";
import { getUserByOrgAction } from "@/actions/userActions";
import { getAdminOrgAction } from "@/actions/adminActions";

interface Patient {
  id: string;
  name: string;
  age?: string;
  condition: string;
  gender?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface Faculty {
  id: string;
  name: string;
}

interface AddWardProps {
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
            ? `${selectedIds.length} ${t("selected")}`
            : placeholder}
        </span>
        <Lucide icon="ChevronDown" className="w-4 h-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-darkmode-800 border border-slate-200 dark:border-darkmode-400 rounded shadow-lg max-h-60 overflow-y-auto">
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
                      ) {
                        return;
                      }
                      handleCheckboxChange(id);
                    }}
                  >
                    <FormCheck className="flex items-center w-full">
                      <FormCheck.Input
                        id={`checkbox-${id}`}
                        type="checkbox"
                        className="mr-2 border cursor-pointer"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(id)}
                      />
                      <FormCheck.Label
                        htmlFor={`checkbox-${id}`}
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

const getCountStatus = (current: number, required: number) => {
  const diff = required - current;
  if (diff === 0) return { text: "Complete", color: "text-success" };
  if (diff > 0) return { text: `${diff} remaining`, color: "text-danger" };
  return { text: `${Math.abs(diff)} over limit`, color: "text-danger" };
};

const AddWard: React.FC<AddWardProps> = ({ onShowAlert }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [adminId, setAdminId] = useState("");

  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [observerList, setObserverList] = useState<Faculty[]>([]);

  const [wardName, setWardName] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedObserver, setSelectedObserver] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [errors, setErrors] = useState({
    wardName: "",
    patients: "",
    users: "",
    faculty: "",
  });

  useEffect(() => {
    const useremail = localStorage.getItem("user");
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const userData = await getAdminOrgAction(String(useremail));
        setOrgId(userData.organisation_id);
        setAdminId(userData.id);
        const patientsRes = await allOrgPatientsAction(
          userData.organisation_id
        );
        const usersRes = await getUserByOrgAction(userData.organisation_id);

        if (patientsRes && Array.isArray(patientsRes)) {
          const formattedPatients = patientsRes?.map((p: any) => ({
            id: p._id || p.id,
            name: p.name,
            gender: p.gender,
            condition: p.category,
          }));
          setAvailablePatients(formattedPatients);
        }

        if (usersRes && Array.isArray(usersRes)) {
          const allUsers = usersRes.map((u: any) => ({
            id: u._id || u.id,
            name: u.fname + " " + u.lname,
            role: u.role,
            email: u.email,
          }));

          setFacultyList(
            allUsers.filter((u: User) => u.role?.toLowerCase() === "faculty")
          );
          setObserverList(
            allUsers.filter((u: User) => u.role?.toLowerCase() === "observer")
          );
          setAvailableUsers(
            allUsers.filter((u: User) => u.role?.toLowerCase() === "user")
          );
        }
      } catch (error) {
        console.error("Error fetching ward data:", error);
        onShowAlert({
          variant: "danger",
          message: t("FailedtoloaddataPleaserefresh"),
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [onShowAlert]);

  const validatePatients = (count: number) => {
    if (count === 12) return "";
    return t(`Selected: ${count}. Required: 12.`);
  };

  const validateUsers = (count: number) => {
    if (count === 4) return "";
    return t(`Selected: ${count}. Required: 4.`);
  };

  const handlePatientsChange = (newIds: string[]) => {
    const newSelectedPatients = availablePatients.filter((p) =>
      newIds.includes(p.id)
    );
    setSelectedPatients(newSelectedPatients);

    if (errors.patients || newSelectedPatients.length !== 12) {
      setErrors((prev) => ({
        ...prev,
        patients: validatePatients(newSelectedPatients.length),
      }));
    }
  };

  const handleUsersChange = (newIds: string[]) => {
    const newSelectedUsers = availableUsers.filter((u) =>
      newIds.includes(u.id)
    );
    setSelectedUsers(newSelectedUsers);

    if (errors.users || newSelectedUsers.length !== 4) {
      setErrors((prev) => ({
        ...prev,
        users: validateUsers(newSelectedUsers.length),
      }));
    }
  };

  const handleRemovePatient = (id: string) => {
    const newSelectedPatients = selectedPatients.filter((p) => p.id !== id);
    setSelectedPatients(newSelectedPatients);
    setErrors((prev) => ({
      ...prev,
      patients: validatePatients(newSelectedPatients.length),
    }));
  };

  const handleRemoveUser = (id: string) => {
    const newSelectedUsers = selectedUsers.filter((u) => u.id !== id);
    setSelectedUsers(newSelectedUsers);
    setErrors((prev) => ({
      ...prev,
      users: validateUsers(newSelectedUsers.length),
    }));
  };

  const handleSubmit = async () => {
    let isValid = true;
    const newErrors = { wardName: "", patients: "", users: "", faculty: "" };

    if (!wardName.trim()) {
      newErrors.wardName = t("Wardnameisrequired");
      isValid = false;
    }

    if (!selectedFaculty) {
      newErrors.faculty = t("Facultyisrequired");
      isValid = false;
    }

    if (selectedPatients.length !== 12) {
      newErrors.patients = validatePatients(selectedPatients.length);
      isValid = false;
    }

    if (selectedUsers.length !== 4) {
      newErrors.users = validateUsers(selectedUsers.length);
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setLoading(true);
      try {
        const payload = {
          wardName,
          facultyId: selectedFaculty,
          observerId: selectedObserver,
          patients: selectedPatients.map((p) => p.id),
          users: selectedUsers.map((u) => u.id),
          orgId: orgId,
          adminId: adminId,
        };
        await saveWardAction(payload);

        onShowAlert({
          variant: "success",
          message: t("Wardcreatedsuccessfully"),
        });

        setWardName("");
        setSelectedPatients([]);
        setSelectedUsers([]);
        setSelectedFaculty("");
        setSelectedObserver("");
        setErrors({ wardName: "", patients: "", users: "", faculty: "" });
      } catch (error) {
        onShowAlert({
          variant: "danger",
          message: t("Failedtocreateward"),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const patientStatus = getCountStatus(selectedPatients.length, 12);
  const userStatus = getCountStatus(selectedUsers.length, 4);

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-64 text-slate-500">
        <div>{t("Loadingdata")}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 intro-y">
        <div className="border-b border-slate-200/60 dark:border-darkmode-400 p-5 mb-5">
          <div className="text-base font-medium truncate">
            {t("CreateNewWard")}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-5">
          <div>
            <div className="mb-5">
              <FormLabel htmlFor="ward-name" className="font-bold">
                {t("WardName")} <span className="text-danger">*</span>
              </FormLabel>
              <FormInput
                id="ward-name"
                type="text"
                className={clsx({ "border-danger": errors.wardName })}
                placeholder={t("Enterwardname")}
                value={wardName}
                onChange={(e) => {
                  setWardName(e.target.value);
                  if (e.target.value.trim())
                    setErrors((p) => ({ ...p, wardName: "" }));
                }}
              />
              {errors.wardName && (
                <div className="text-danger mt-1 text-sm">
                  {errors.wardName}
                </div>
              )}
            </div>

            <div className="mb-5">
              <FormLabel className="font-bold">
                {t("SelectPatients")} {t("Required12")}{" "}
                <span className="text-danger">*</span>
              </FormLabel>

              <MultiSelectDropdown
                options={availablePatients}
                selectedIds={selectedPatients.map((p) => p.id)}
                onChange={handlePatientsChange}
                getId={(p) => p.id}
                getLabel={(p) => `${p.name} (${p.condition})`}
                placeholder={t("Select12patients")}
                error={!!errors.patients && selectedPatients.length !== 12}
              />

              {errors.patients && selectedPatients.length !== 12 && (
                <div className="text-danger mt-1 text-sm">
                  {errors.patients}
                </div>
              )}

              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-slate-500 font-bold">
                    {t("SelectedPatients")} ({selectedPatients.length}/12):
                  </div>
                  <div
                    className={clsx("text-xs font-medium", patientStatus.color)}
                  >
                    {patientStatus.text}
                  </div>
                </div>

                {selectedPatients.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="relative group bg-blue-50 border border-blue-200 text-blue-700 rounded px-3 py-2 text-xs font-medium flex items-center justify-between transition-all"
                      >
                        <span className="truncate mr-2">{patient.name}</span>
                        <button
                          onClick={() => handleRemovePatient(patient.id)}
                          className="text-blue-400 transition-colors"
                        >
                          <Lucide icon="X" className="w-4 h-4" bold />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic p-2 border border-dashed rounded bg-slate-50">
                    {t("Nopatientsaddedyet")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-5">
              <FormLabel htmlFor="faculty-select" className="font-bold">
                {t("SelectFaculty")} <span className="text-danger">*</span>
              </FormLabel>
              <FormSelect
                id="faculty-select"
                value={selectedFaculty}
                onChange={(e) => {
                  setSelectedFaculty(e.target.value);
                  if (e.target.value) setErrors((p) => ({ ...p, faculty: "" }));
                }}
                className={clsx({ "border-danger": errors.faculty })}
              >
                <option value="" disabled>
                  {t("SelectFacultyMember")}
                </option>
                {facultyList.length > 0 ? (
                  facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {t("Nofacultyfound")}
                  </option>
                )}
              </FormSelect>
              {errors.faculty && (
                <div className="text-danger mt-1 text-sm">{errors.faculty}</div>
              )}
            </div>

            <div className="mb-5">
              <FormLabel htmlFor="observer-select" className="font-bold">
                {t("SelectObserver")}{" "}
                <span className="text-xs text-gray-500 font-normal">
                  ({t("Optional")})
                </span>
              </FormLabel>
              <FormSelect
                id="observer-select"
                value={selectedObserver}
                onChange={(e) => setSelectedObserver(e.target.value)}
              >
                <option value="">{t("SelectObserver")}</option>
                {observerList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* User/Student Selection */}
            <div className="mb-5">
              <FormLabel className="font-bold">
                {t("AssignStu")} {t("Required4")}{" "}
                <span className="text-danger">*</span>
              </FormLabel>

              <MultiSelectDropdown
                options={availableUsers}
                selectedIds={selectedUsers.map((u) => u.id)}
                onChange={handleUsersChange}
                getId={(u) => u.id}
                getLabel={(u) => `${u.name}`}
                placeholder={t("Select4students")}
                error={!!errors.users && selectedUsers.length !== 4}
              />

              {errors.users && selectedUsers.length !== 4 && (
                <div className="text-danger mt-1 text-sm">{errors.users}</div>
              )}

              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-slate-500 font-bold">
                    {t("SelectedStu")} ({selectedUsers.length}/4):
                  </div>
                  <div
                    className={clsx("text-xs font-medium", userStatus.color)}
                  >
                    {userStatus.text}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedUsers.length > 0 ? (
                    selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="relative group bg-green-50 border border-blue-200 text-green-700 rounded px-3 py-2 text-xs font-medium flex items-center justify-between transition-all"
                      >
                        <span className="mr-2">{user.name}</span>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-green-700 transition-colors"
                        >
                          <Lucide icon="X" className="w-4 h-4" bold />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs italic p-2 border border-dashed rounded bg-slate-50 w-full">
                      {t("Nostuassigned")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 border-t border-slate-200/60 dark:border-darkmode-400 p-5">
          <Button
            variant="primary"
            className="w-32"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <div className="loader">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            ) : (
              t("CreateWard")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddWard;
