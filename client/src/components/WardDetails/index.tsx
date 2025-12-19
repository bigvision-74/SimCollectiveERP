import React, { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { getWardByIdAction } from "@/actions/patientActions";
import clsx from "clsx";
import { t } from "i18next";
import SessionSetup from "../WardSession";

export interface UserDetail {
  id: number | string;
  fname: string;
  lname: string;
  username: string;
  uemail: string;
  role: string;
  user_thumbnail: string;
}

export interface PatientDetail {
  id: number | string;
  name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  category: string;
  scenario_location: string;
  room_type: string;
  medical_history: string | null;
  patient_assessment?: string;
  initial_admission_observations?: string;
  medical_equipment?: string;
  treatment_algorithm?: string;
  phone?: string;
}

export interface WardData {
  id: number;
  name: string;
  faculty: UserDetail | null;
  observer: UserDetail | null;
  admin: UserDetail | null;
  users: UserDetail[];
  patients: PatientDetail[];
  created_at: string;
}

interface WardDetailsProps {
  wardId: string | number;
  onBack: () => void;
  onSidebarVisibility: (hide: boolean) => void;
  onStartSession: (data: WardData) => void; // Receive the function
}

const WardDetails: React.FC<WardDetailsProps> = ({
  wardId,
  onBack,
  onSidebarVisibility,
  onStartSession,
}) => {
  const [data, setData] = useState<WardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
//   const [isSessionActive, setIsSessionActive] = useState(false);

  const getAge = (dobString: string) => {
    if (!dobString) return "N/A";
    if (!dobString.includes("-") && !dobString.includes("/")) return dobString;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await getWardByIdAction(String(wardId));
        if (response && response.success) {
          setData(response.data);
        } else {
          setError("Failed to load ward details.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    if (wardId) fetchDetails();
  }, [wardId]);

  const renderUserCard = (
    user: UserDetail | null,
    title: string,
    badgeColor: string
  ) => {
    if (!user) return null;
    return (
      <div className="col-span-12 sm:col-span-6 lg:col-span-4 intro-y">
        <div className="box p-5 border border-slate-200 dark:border-darkmode-400 h-full shadow-sm">
          <div className="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-3 mb-3">
            <div className={`font-medium text-base ${badgeColor}`}>{title}</div>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-12 flex-none image-fit mr-4">
              <img
                alt={user.fname}
                className="rounded-full"
                src={user.user_thumbnail || "https://via.placeholder.com/150"}
              />
            </div>
            <div className="truncate">
              <div className="font-medium truncate">
                {user.fname} {user.lname}
              </div>
              <div className="text-slate-500 text-xs mt-0.5 truncate">
                {user.uemail ? user.uemail : "-"}
              </div>
              <div className="text-slate-400 text-xs mt-0.5">
                @{user.username}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <div className="mb-4">{error || "Loading"}</div>
        <Button variant="outline-secondary" onClick={onBack}>
          <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" /> {t("BacktoList")}
        </Button>
      </div>
    );
  }

  // --- RENDER SESSION VIEW IF ACTIVE ---
//   if (isSessionActive) {
//     return (
//       <div className="fixed inset-0 z-50 bg-white dark:bg-darkmode-800 overflow-auto">
//         <SessionSetup
//           wardData={data}
//           onCancel={() => setIsSessionActive(false)}
//         />
//       </div>
//     );
//   }

  return (
    <div className="intro-y animate-fadeIn">
      <div className="flex items-center justify-between mb-6 mt-5">
        <div className="flex items-center">
          <Button
            variant="secondary"
            onClick={onBack}
            className="mr-4 shadow-sm"
          >
            <Lucide icon="ArrowLeft" className="w-4 h-4 mr-2" /> {t("Back")}
          </Button>
          <div>
            <h2 className="text-lg font-bold">{data.name}</h2>
            <div className="text-xs text-slate-500">
              {t("created")} {new Date(data.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          className="shadow-md"
          onClick={() => onStartSession(data)} 
        >
          {t("start_session")}
        </Button>
      </div>

      {/* Staff & Faculty Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Lucide icon="Users" className="w-5 h-5 mr-2 text-primary" />
            {t("Staff&Faculty")}
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          {renderUserCard(data.faculty, "Faculty", "text-primary")}
          {renderUserCard(data.observer, "Observer", "text-warning")}
          {renderUserCard(data.admin, "Admin", "text-success")}
        </div>

        {/* Assigned Students */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Lucide
              icon="GraduationCap"
              className="w-5 h-5 mr-2 text-primary"
            />
            {t("AssignedStudents")}
          </h3>
          {data.users.length === 0 ? (
            <div className="text-slate-500 italic box p-5 bg-slate-50 dark:bg-darkmode-700">
              {t("Nostudentsassigned")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.users.map((user) => (
                <div
                  key={user.id}
                  className="box p-4 flex items-center bg-white dark:bg-darkmode-600 shadow-sm border border-slate-200 dark:border-darkmode-400 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 flex-none image-fit mr-3">
                    <img
                      alt={user.fname}
                      className="rounded-full"
                      src={
                        user.user_thumbnail || "https://via.placeholder.com/150"
                      }
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium text-sm truncate">
                      {user.fname} {user.lname}
                    </div>
                    <div className="text-slate-500 text-xs truncate">
                      @{user.username}
                    </div>
                    <div className="text-slate-400 text-xs truncate mt-0.5">
                      {user.uemail || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patients Section */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-darkmode-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Lucide icon="Activity" className="w-5 h-5 mr-2 text-primary" />
            {t("PatientsRecords")}
          </h3>
          <div className="text-sm text-slate-500">
            {data.patients.length} {t("patients")}
          </div>
        </div>

        {data.patients.length === 0 ? (
          <div className="text-slate-500 italic box p-8 text-center bg-slate-50 dark:bg-darkmode-700">
            {t("Nopatients")}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} getAge={getAge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PatientCard = ({
  patient,
  getAge,
}: {
  patient: PatientDetail;
  getAge: (d: string) => string | number;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="box overflow-hidden border border-slate-200 dark:border-darkmode-400">
      <div className="p-5 bg-white dark:bg-darkmode-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-4 font-bold text-lg">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-base">{patient.name}</div>
              <div className="text-slate-400 text-xs mt-0.5">
                {patient.gender} • {getAge(patient.date_of_birth)} yrs
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-500">
                  {patient.category}
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="soft-primary"
              size="sm"
              onClick={() => {
                window.open(`/patients-view/${patient.id}`, "_blank");
              }}
              className="text-xs"
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardDetails;
