import React, { useEffect, useState } from "react";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import { useLocation } from "react-router-dom";
import WardsList from "@/components/WardsList";
import AddWard from "@/components/AddWard";
import SessionSetup from "@/components/WardSession"; // Import Component D
// Import the type if possible, or define it locally
import { WardData } from "@/components/WardDetails"; 

function Userspage() {
  const [selectedPick, setSelectedPick] = useState("wards");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  
  // NEW: State to hold ward data when a session starts
  const [sessionWardData, setSessionWardData] = useState<WardData | null>(null);

  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (alertMessage) {
      setShowAlert({ variant: "success", message: alertMessage });
      window.history.replaceState({ ...location.state, alertMessage: null }, document.title);
      setTimeout(() => setShowAlert(null), 3000);
    }
  }, [alertMessage]);
  
  const handleActionAdd = (alertData: { variant: "success" | "danger"; message: string }) => {
    setShowAlert(alertData);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setShowAlert(null), 3000);
  };

  const handleClick = (option: string) => {
    setSelectedPick(option);
    setSidebarHidden(false);
  };

  // NEW: Handler to start session (replaces whole page)
  const handleStartSession = (data: WardData) => {
    setSessionWardData(data);
  };

  // NEW: Handler to end session (returns to normal view)
  const handleEndSession = () => {
    setSessionWardData(null);
  };

  // === CONDITION 1: IF SESSION IS ACTIVE, RENDER ONLY D ===
  if (sessionWardData) {
    return (
      <SessionSetup 
        wardData={sessionWardData} 
        onCancel={handleEndSession} 
      />
    );
  }

  // === CONDITION 2: STANDARD VIEW (A + B/C) ===
  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      {!sidebarHidden && (
        <>
          <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
            <h2 className="mr-auto text-lg font-medium">{t("WardsPage")}</h2>
          </div>

          <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
            <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
              <div className="rounded-md box">
                <div className="p-5">
                  <div
                    className={`flex px-4 py-2 items-center cursor-pointer ${
                      selectedPick === "wards" ? "text-white rounded-lg bg-primary" : ""
                    }`}
                    onClick={() => handleClick("wards")}
                  >
                    <Lucide icon="List" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("wards")}</div>
                  </div>
                  <div
                    className={`flex px-4 py-2 items-center cursor-pointer ${
                      selectedPick === "addWard" ? "text-white rounded-lg bg-primary" : ""
                    }`}
                    onClick={() => handleClick("addWard")}
                  >
                    <Lucide icon="Clipboard" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("addward")}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
              <div className="rounded-md box">
                <div>
                  {selectedPick === "wards" ? (
                    <WardsList
                      onShowAlert={handleActionAdd}
                      onSidebarVisibility={setSidebarHidden}
                      onStartSession={handleStartSession} // Pass the function down
                    />
                  ) : selectedPick === "addWard" ? (
                    <AddWard onShowAlert={handleActionAdd} />
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {sidebarHidden && selectedPick === "wards" && (
        <div className="intro-y">
          <WardsList
            onShowAlert={handleActionAdd}
            onSidebarVisibility={setSidebarHidden}
            onStartSession={handleStartSession} // Pass the function down
          />
        </div>
      )}
    </>
  );
}
export default Userspage;