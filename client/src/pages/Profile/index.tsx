import { useState, useEffect } from "react";
import Lucide from "@/components/Base/Lucide";
import { Tab } from "@/components/Base/Headless";
import Alerts from "@/components/Alert";
import ProfileAccount from "@/components/ProfileAccount";
import ProfilePassword from "@/components/ProfilePassword";
import { getUserAction } from "@/actions/userActions";
import { t } from "i18next";
import dayjs from "dayjs";

function Main() {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user");

  const [user, setUser] = useState<{
    id: string;
    name: string;
    fname: string;
    lname: string;
    uemail: string;
    organisation_id: string | null;
    user_thumbnail: string;
    planType?: string | null;
    organisation?: {
      id: string;
      name: string;
      org_email: string;
      organisation_icon: string;
      planType: string;
    };
    latestPayment?: {
      amount: number;
      currency: string;
      created_at: string;
    };
  }>({
    id: "",
    name: "",
    fname: "",
    lname: "",
    uemail: "",
    organisation_id: "",
    user_thumbnail: "",
    planType: null,
  });

  console.log(user, "user");

  const data = {
    org: user.organisation_id,
    id: user.id,
  };

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const savedTabIndex = parseInt(
    localStorage.getItem("activeTabIndex") || "0",
    10
  );

  const [selectedIndex, setSelectedIndex] = useState(savedTabIndex);

  const handleTabChange = (index: number) => {
    setSelectedIndex(index);
    localStorage.setItem("activeTabIndex", index.toString());
  };
  useEffect(() => {
    const savedTab = localStorage.getItem("activeTabIndex");
    if (savedTab !== null) {
      setSelectedIndex(parseInt(savedTab, 10));
    }
  }, []);

  // const fetchUser = async () => {
  //   if (username) {
  //     try {
  //       const data = await getUserAction(username);

  //       setUser(data);
  //     } catch (error) {
  //       console.error("Error fetching device:", error);
  //     }
  //   }
  // };

  const fetchUser = async () => {
    if (username) {
      try {
        const data = await getUserAction(username);

        setUser({
          ...data,
          latestPayment: data.amount
            ? {
                amount: Number(data.amount),
                currency: data.currency,
                created_at: data.created_at,
              }
            : undefined,
        });
      } catch (error) {
        console.error("Error fetching device:", error);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, [username]);

  const handleAction = (newMessage: string, variant: "success" | "danger") => {
    fetchUser();
    setShowAlert({ variant, message: newMessage });
    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };

  return (
    <>
      <div className="mt-5"></div>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("Profile")}</h2>
      </div>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        <div className="px-5 pt-5 mt-5 intro-y box">
          <div className="flex flex-col pb-5 -mx-5 border-b lg:flex-row border-slate-200/60 dark:border-darkmode-400">
            <div className="flex items-center justify-center flex-1 px-5 lg:justify-start">
              <div className="relative flex-none w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 image-fit">
                <img
                  alt="Profile Image"
                  className="rounded-full "
                  src={
                    user.user_thumbnail
                      ? user?.user_thumbnail?.startsWith("http")
                        ? user.user_thumbnail
                        : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${user.user_thumbnail}`
                      : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                  }
                />
              </div>
              <div className="ml-5">
                <div className="w-24 text-lg font-medium truncate sm:w-40 sm:whitespace-normal">
                  {user.fname + " " + user.lname}
                </div>
                <div className="w-24 font-normal truncate sm:w-40 sm:whitespace-normal">
                  {role}
                </div>
              </div>
            </div>

            <div className="flex-1 px-5 pt-5 mt-6 border-t border-l border-r lg:mt-0 border-slate-200/60 dark:border-darkmode-400 lg:border-t-0 lg:pt-0">
              <div className="font-medium text-center lg:text-left lg:mt-3">
                {t("contact_details")}
              </div>
              <div className="flex flex-col items-center justify-center mt-4 lg:items-start">
                <div className="flex gap-3">
                  <div className="flex items-center font-medium truncate sm:whitespace-normal">
                    <Lucide icon="Inbox" className="w-4 h-4 mr-2" />
                    {t("email")}:
                  </div>
                  <div className="flex items-center font-normal truncate sm:whitespace-normal">
                    {user.uemail}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center font-medium mt-3 truncate sm:whitespace-normal">
                    <Lucide icon="Activity" className="w-4 h-4 mr-2" />
                    {t("role")}:
                  </div>
                  <div className="flex items-center font-normal mt-3 truncate sm:whitespace-normal">
                    {role}
                  </div>
                </div>
                {role && role != "Superadmin" && role !== "Administrator" && (
                  <div className="flex gap-3">
                    <div className="flex items-center font-medium mt-3 truncate sm:whitespace-normal">
                      <Lucide icon="Building" className="w-4 h-4 mr-2" />
                      {t("Organisation")}:
                    </div>
                    <div className="flex items-center font-normal mt-3 truncate sm:whitespace-normal">
                      {user.name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {role && role != "Superadmin" && role !== "Administrator" && (
              <div className="flex-1 px-5 pt-5 mt-6 border-t border-l border-r lg:mt-0 border-slate-200/60 dark:border-darkmode-400 lg:border-t-0 lg:pt-0">
                <div className="font-medium text-center lg:text-left lg:mt-3">
                  {t("plan_details")}
                </div>
                <div className="flex flex-col items-center justify-center mt-4 lg:items-start">
                  <div className="flex gap-3">
                    <div className="flex items-center font-medium truncate sm:whitespace-normal">
                      <Lucide icon="NotepadText" className="w-4 h-4 mr-2" />
                      {t("type")}:
                    </div>
                    <div className="flex items-center font-normal truncate sm:whitespace-normal">
                      {user.organisation?.planType || user.planType || "-"}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center font-medium mt-3 truncate sm:whitespace-normal">
                      <Lucide icon="PoundSterling" className="w-4 h-4 mr-2" />
                      {t("amount")}:
                    </div>
                    <div className="flex items-center font-normal mt-3 truncate sm:whitespace-normal">
                      {user.latestPayment
                        ? `${user.latestPayment.amount} ${user.latestPayment.currency}`
                        : "-"}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center font-medium mt-3 truncate sm:whitespace-normal">
                      <Lucide icon="CalendarDays" className="w-4 h-4 mr-2" />
                      {t("duration")}:
                    </div>
                    <div className="flex items-center font-normal mt-3 truncate sm:whitespace-normal">
                      {user.latestPayment?.created_at
                        ? dayjs(user.latestPayment.created_at).format(
                            "DD MMM YYYY"
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Tab.List
            variant="link-tabs"
            className="flex-col justify-center text-center sm:flex-row lg:justify-start"
          >
            <Tab fullWidth={false}>
              <Tab.Button className="flex items-center py-4 cursor-pointer">
                <Lucide icon="Settings" className="w-4 h-4 mr-2" />{" "}
                {t("account")}
              </Tab.Button>
            </Tab>
            <Tab fullWidth={false}>
              <Tab.Button className="flex items-center py-4 cursor-pointer">
                <Lucide icon="Lock" className="w-4 h-4 mr-2" />{" "}
                {t("Change_password")}
              </Tab.Button>
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels className="mt-5">
          <Tab.Panel>
            <ProfileAccount onAction={handleAction} />
          </Tab.Panel>
          <Tab.Panel>
            <ProfilePassword onAction={handleAction} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
}

export default Main;
