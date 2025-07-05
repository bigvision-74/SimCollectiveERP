import { useState, useEffect } from "react";
import _ from "lodash";
import fakerData from "@/utils/faker";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import profile from "@/assets/images/fakers/profile.webp";
import OrgEdit from "@/components/OrgEdit";
import { useParams } from "react-router-dom";
import { getOrgAction } from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
import { t } from "i18next";

function Main() {
  const [selectedOption, setSelectedOption] = useState(
    localStorage.getItem("selectedOption") || "organisation"
  );
  const { id } = useParams();
  const [orgName, setOrgName] = useState("");
  const [orgProfile, setOrgProfile] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const fetchOrgs = async () => {
    try {
      if (!id) {
        console.error("ID is undefined");
        return;
      }
      const numericId = Number(id);
      const data = await getOrgAction(numericId);

      if (data) {
        setOrgName(data.name);
        setOrgProfile(data.organisation_icon);
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleClick = (option: string) => {
    setSelectedOption(option);
    localStorage.setItem("selectedOption", option);
  };

  const handleAction = (
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
  const handleAction1 = (newMessage: string) => {
    console.log(newMessage, "newMessagenewMessage");
    fetchOrgs();
    setShowAlert({
      variant: "success",
      message: newMessage,
    });

    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };
  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>
      
      {/* Organization Profile Header */}
      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">
          {t("organisationSetting")}
        </h2>
      </div>
      
      <div className="flex items-center p-5 mt-5 rounded-md bg-white dark:bg-darkmode-600 shadow">
        <div className="flex-none w-16 h-16 image-fit">
          <img
            alt="Organization Profile"
            className="rounded-full shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
            src={
              orgProfile?.startsWith("http")
                ? orgProfile
                : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${orgProfile}`
            }
          />
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-semibold">{orgName}</h2>
          <p className="text-slate-500">Organization ID: {id}</p>
        </div>
      </div>
      
      {/* Horizontal Tabs */}
      <div className="flex overflow-x-auto mt-5 border-b border-slate-200 dark:border-darkmode-400">
        <button
          className={`flex items-center px-4 py-3 mr-2 ${selectedOption === "organisation"
            ? "text-primary border-b-2 border-primary"
            : "text-slate-500 hover:text-primary"
          }`}
          onClick={() => handleClick("organisation")}
        >
          <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
          {t("org")}
        </button>
        
        {/* Uncomment these if you need other tabs */}
        {/* <button
          className={`flex items-center px-4 py-3 mr-2 ${selectedOption === "addUser"
            ? "text-primary border-b-2 border-primary"
            : "text-slate-500 hover:text-primary"
          }`}
          onClick={() => handleClick("addUser")}
        >
          <Lucide icon="Users" className="w-4 h-4 mr-2" />
          {t("add_user")}
        </button> */}
        
        {/* Add other tab buttons here */}
      </div>
      
      {/* Content Area */}
      <div className="mt-5 rounded-md box">
        <div className="p-5">
          {selectedOption === "organisation" ? (
            <OrgEdit onAction={handleAction1} />
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}

export default Main;