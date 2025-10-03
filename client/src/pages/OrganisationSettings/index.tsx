import { useState, useEffect } from "react";
import _ from "lodash";
import Lucide from "@/components/Base/Lucide";
import OrgEdit from "@/components/OrgEdit";
import OrgAddUser from "@/components/OrgAddUser";
import OrgUserList from "@/components/OrgUserList";
import OrgAddPatient from "@/components/OrgAddPatient";
import OrgPatientList from "@/components/OrgPatientList";
import OrgNotifications from "@/components/OrgNotifications";
import { useParams } from "react-router-dom";
import { getOrgAction } from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import dayjs from "dayjs";

function Main() {
  const [selectedOption, setSelectedOption] = useState(
    localStorage.getItem("selectedOption") || "organisation"
  );
  const { id } = useParams();
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [orgProfile, setOrgProfile] = useState("");
  const currentUserRole = localStorage.getItem("role");
  const [orgPlanType, setOrgPlanType] = useState("");
  const [orgAmount, setOrgAmount] = useState("");
  const [orgDuration, setOrgDuration] = useState("");

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const getDuration = (createdAt: string, amount: number) => {
    if (!createdAt) return "-";

    const startDate = dayjs(createdAt);
    let endDate = startDate;

    switch (Number(amount)) {
      case 0: // Free trial 30 days
        endDate = startDate.add(30, "day");
        break;
      case 1000: // 1 year
        endDate = startDate.add(1, "year");
        break;
      case 3000: // 5 years
        endDate = startDate.add(5, "year");
        break;
      default:
        endDate = startDate;
    }

    return `${startDate.format("DD MMM YYYY")} to ${endDate.format(
      "DD MMM YYYY"
    )}`;
  };

  const fetchOrgs = async () => {
    try {
      if (!id) {
        console.error("ID is undefined");
        return;
      }
      const numericId = Number(id);
      const data = await getOrgAction(numericId);
      console.log(data, "data");

      if (data) {
        setOrgName(data.name);
        setOrgId(data.organisation_id);
        setOrgProfile(data.organisation_icon);

        setOrgPlanType(data.planType);
        setOrgAmount(data.amount);
        setOrgDuration(
          data.created_at ? getDuration(data.created_at, data.amount) : "N/A"
        );
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

      {/* Vertical Tabs */}
      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="flex items-center p-5 bg-white dark:bg-darkmode-600 shadow">
              <div className="flex-none w-16 h-16 image-fit">
                <img
                  alt="Organization Profile"
                  className="rounded-full shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
                  src={
                    orgProfile?.startsWith("http")
                      ? orgProfile
                      : "https://insightxr.s3.eu-west-2.amazonaws.com/image/KXyX-4KFD-SICCode6512Companies_OperatorsofNonresidentialBuildingsCompanies.png"
                  }
                />
              </div>

              <div className="ml-4 mt-2">
                {/* Organization Name */}
                <h2 className="text-xl font-semibold">{orgName}</h2>

                {/* 2x2 Info Grid */}
                <div className="grid grid-cols-2 gap-4 mt-2 text-slate-500 text-sm">
                  <div className="flex items-center truncate sm:whitespace-normal">
                    <span className="font-semibold">{t("planType")}: </span>
                    <span className="font-normal ml-1">
                      {orgPlanType === "free" ? "Free" : (orgPlanType || "-")}
                    </span>
                  </div>
                  {/* <div className="flex items-center truncate sm:whitespace-normal">
                    <span className="font-semibold">{t("amount")}: </span>
                    <span className="font-normal ml-1">
                      {orgAmount && Number(orgAmount) !== 0 ? orgAmount : "-"}
                    </span>
                  </div> */}
                </div>

                {/* Optional Duration Row */}
                <div className="flex items-center mt-3 truncate sm:whitespace-normal text-slate-500 text-sm">
                  <span className="font-semibold">{t("duration")}: </span>
                  <span className="font-normal ml-1">
                    {orgDuration && orgDuration !== "N/A" ? orgDuration : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div
                className={`flex px-4 py-2 items-center cursor-pointer ${
                  selectedOption === "organisation"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("organisation")}
              >
                <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("org")}</div>
              </div>
              <div
                className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                  selectedOption === "addUser"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("addUser")}
              >
                <Lucide icon="UserPlus" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("add_user")}</div>
              </div>
              <div
                className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                  selectedOption === "userList"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("userList")}
              >
                <Lucide icon="List" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("UserList")}</div>
              </div>

              {currentUserRole === "Superadmin" && (
                <>
                  <div
                    className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                      selectedOption === "addPatient"
                        ? "text-white rounded-lg bg-primary"
                        : ""
                    }`}
                    onClick={() => handleClick("addPatient")}
                  >
                    <Lucide icon="Users" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("AddPatient")}</div>
                  </div>

                  <div
                    className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                      selectedOption === "patientList"
                        ? "text-white rounded-lg bg-primary"
                        : ""
                    }`}
                    onClick={() => handleClick("patientList")}
                  >
                    <Lucide icon="List" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("patientList")}</div>
                  </div>

                  <div
                    className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                      selectedOption === "notifications"
                        ? "text-white rounded-lg bg-primary"
                        : ""
                    }`}
                    onClick={() => handleClick("notifications")}
                  >
                    <Lucide icon="Bell" className="w-4 h-4 mr-2" />
                    <div className="flex-1 truncate">{t("notifications")}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Content Area */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            <div>
              {selectedOption === "organisation" ? (
                <OrgEdit onAction={handleAction1} />
              ) : selectedOption === "addUser" ? (
                <OrgAddUser onAction={handleAction} />
              ) : selectedOption === "userList" ? (
                <OrgUserList onAction={handleAction} />
              ) : selectedOption === "addPatient" ? (
                <OrgAddPatient onAction={handleAction} />
              ) : selectedOption === "patientList" ? (
                <OrgPatientList onAction={handleAction} />
              ) : selectedOption === "notifications" ? (
                <OrgNotifications onAction={handleAction} />
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

export default Main;
