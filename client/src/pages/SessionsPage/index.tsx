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
import { useNavigate, Link, useLocation } from "react-router-dom";

import Arusers from "@/components/ArchieveComponents/users";
import Organisation from "@/components/ArchieveComponents/organisations";
import Arpatients from "@/components/ArchieveComponents/patients";
import Userlist from "@/pages/UserList/index";
import Adduser from "@/pages/AddUser/index";
import Virtual from "@/pages/VirtualSection";
import WardSessionsList from "@/components/WardSessionsList";
import IndividualSessionsList from "@/components/IndividualSessionsList";
interface ArchiveData {
  userData: any[];
  patientData: any[];
  orgData: any[];
}
function Sessionspage() {
  const [selectedPick, setSelectedPick] = useState("virtualSession");
  const [userCount, setUserCount] = useState(0);
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
        document.title,
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
  const handleActionAdd = (alertData: {
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
      setArchiveData(data);
    } catch (error) {
      console.log("Error in fetching archive", error);
    }
  };

  useEffect(() => {
    if (
      selectedPick === "virtualSession" ||
      selectedPick === "wardSession" ||
      selectedPick === "individualSession"
    ) {
      fetcharchive();
    }
  }, [selectedPick]);

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
        <h2 className="mr-auto text-lg font-medium">{t("userspage")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5">
              <div
                className={`flex px-4 py-2 items-center cursor-pointer ${
                  selectedPick === "virtualSession"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("virtualSession")}
              >
                <Lucide icon="Users" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("virtual_session")}</div>
              </div>

              {userRole != "Faculty" && (
                <div
                  className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                    selectedPick === "wardSession"
                      ? "text-white rounded-lg bg-primary"
                      : ""
                  }`}
                  onClick={() => handleClick("wardSession")}
                >
                  <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
                  <div className="flex-1 truncate">{t("wardSession")}</div>
                </div>
              )}
              {userRole != "Faculty" && (
                <div
                  className={`flex px-4 py-2 items-center cursor-pointer ${
                    selectedPick === "individualSession"
                      ? "text-white rounded-lg bg-primary"
                      : ""
                  }`}
                  onClick={() => handleClick("individualSession")}
                >
                  <Lucide icon="Users" className="w-4 h-4 mr-2" />
                  <div className="flex-1 truncate">
                    {t("individualSession")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            <div>
              {selectedPick === "virtualSession" ? (
                <Virtual onShowAlert={handleActionAdd} />
              ) : selectedPick === "wardSession" ? (
                <WardSessionsList onShowAlert={handleActionAdd} />
              ) : selectedPick === "individualSession" ? (
                <IndividualSessionsList onShowAlert={handleActionAdd} />
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Sessionspage;
