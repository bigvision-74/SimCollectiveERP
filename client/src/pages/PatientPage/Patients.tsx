import React, { useEffect } from "react";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import { useState } from "react";
import Alerts from "@/components/Alert";
import {
  createArchiveAction,
  permanentDeleteAction,
  recoverDataAction,
} from "@/actions/archiveAction";
import Arpatients from "@/components/ArchieveComponents/patients";
import Patientlist from "@/pages/PatientList/index";
import Addpatient from "@/pages/AddPatient/index";
import { useLocation } from "react-router-dom";
import Button from "@/components/Base/Button";

interface ArchiveData {
  userData: any[];
  patientData: any[];
  orgData: any[];
}
function Patientspage() {
  const [selectedPick, setSelectedPick] = useState("patientlist");
  const [patientCount, setPatientCount] = useState(0);
  const [plan, setPlan] = useState("");
  const [planDate, setPlanDate] = useState("");
  const userRole = localStorage.getItem("role");
  const [archiveData, setArchiveData] = useState<ArchiveData>({
    userData: [],
    patientData: [],
    orgData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const alertMessage = location.state?.alertMessage || "";

  useEffect(() => {
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });

      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  }, [alertMessage]);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleActionAdd = (
    newMessage: string,
    variant: "success" | "danger" = "success"
  ) => {
    setShowAlert({
      variant,
      message: newMessage,
    });

    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };
  const handleActionAdd1 = (alertData: {
    variant: "success" | "danger";
    message: string;
  }) => {
    setShowAlert(alertData);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };

  const handleAction = async (id: string, type: string) => {
    await permanent(id, type);
    fetcharchive();
  };

  const handleClick = (option: string) => {
    setSelectedPick(option);
  };

  const fetcharchive = async () => {
    try {
      const data = await createArchiveAction();
      console.log(data, "data");
      setArchiveData(data);
    } catch (error) {
      console.log("Error in fetching archive", error);
    }
  };
  useEffect(() => {
    if (
      selectedPick === "patientlist" ||
      selectedPick === "addpatient" ||
      selectedPick === "Arpatients"
    ) {
      fetcharchive();
    }
  }, [selectedPick]);

  console.log("archivedata", archiveData);

  // Peramanenrt delete
  const permanent = async (id: string, type: string) => {
    try {
      const dataDelete = await permanentDeleteAction(id, type);
      if (dataDelete) {
        window.scrollTo({ top: 0, behavior: "smooth" });

        setShowAlert({
          variant: "success",
          message: t("recorddeletesuccess"),
        });

        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
      }
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "danger",
        message: t("recorddeletefailed"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
      console.log("error in deleting", error);
    }
  };

  const handleRecovery = async (id: string, type: string) => {
    try {
      await recoverDataAction(id, type);

      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "success",
        message: t("recoverySuccessful"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);

      await fetcharchive();
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "danger",
        message: t("recoveryFailed"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);

      console.error("Error in recovering:", error);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patientPage")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5">
              <div
                className={`flex px-4 py-2 items-center cursor-pointer ${
                  selectedPick === "patientlist"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("patientlist")}
              >
                <Lucide icon="Users" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("patientlist")}</div>
              </div>
              <div
                className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                  selectedPick === "addpatient"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("addpatient")}
              >
                <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("addpatient")}</div>
              </div>

              <div
                className={`flex px-4 py-2 items-center cursor-pointer ${
                  selectedPick === "Arpatients"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("Arpatients")}
              >
                <Lucide icon="Users" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("ArchivePatient")}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            <div>
              {selectedPick === "patientlist" ? (
                <Patientlist
                  onPatientCountChange={setPatientCount}
                  planChange={setPlan}
                  planDateChange={setPlanDate}
                  onShowAlert={handleActionAdd}
                  //   onRecover={handleRecovery}
                />
              ) : selectedPick === "addpatient" ? (
                <Addpatient
                  patientCount={patientCount}
                  onShowAlert={handleActionAdd1}
                  plan={plan}
                  planDate={planDate}
                />
              ) : selectedPick === "Arpatients" ? (
                <Arpatients
                  data={archiveData.patientData}
                  onAction={handleAction}
                  onRecover={handleRecovery}
                />
              ) : (
                //    : selectedPick === "patients" ? (
                //     <Arpatients
                //       data={archiveData.patientData}
                //       onAction={handleAction}
                //       onRecover={handleRecovery}
                //     />
                //   )
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Patientspage;
