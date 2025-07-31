import { useState, useEffect } from "react";
import _ from "lodash";
import fakerData from "@/utils/faker";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { useParams, Link } from "react-router-dom";
import {
  getUserReportAction,
  getUserReportsListByIdAction,
  getInvestigationReportsAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";

interface UserReport {
  id: number;
  investigation_id: string;
  parameter_id: string;
  patient_id: string;
  value: string;
  latest_report_id: string;
  name: string;
}
interface UserTest {
  id: number;
  name: string;
  category: string;
  test_name: string;
  investigation_id: string;
  parameter_id: string;
  patient_id: string;
  value: string;
}

function Main() {
  const [selectedOption, setSelectedOption] = useState(
    localStorage.getItem("selectedOption") || "organisation"
  );
  const { id } = useParams();
  const [users, setUsers] = useState<UserReport[]>([]);
  const [userTests, setUserTests] = useState<UserTest[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [testDetails, setTestDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgId, setOrgId] = useState("");
  const user = localStorage.getItem("role");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const fetchOrg = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setOrgId(userData.orgid);
      fetchOrgs(userData.orgid);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrgs = async (id: string) => {
    try {
      let result;
      if (user == "Superadmin") {
        result = await getUserReportAction();
        setUsers(result || []);
      } else {
        result = await getUserReportAction(id);
        setUsers(result || []);
      }

      const grouped = _.groupBy(result, "name");
      const firstName = Object.keys(grouped)[0];
      const firstPatientId = grouped[firstName]?.[0]?.patient_id;

      if (firstName && firstPatientId) {
        setSelectedTab(firstName);
        await handleClick(firstPatientId);
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
    }
  };

  const groupedUsers = _.groupBy(users, "name");

  const handleClick = async (patient_id: string) => {
    try {
      const data = await getUserReportsListByIdAction(Number(patient_id));
      console.log(data, "resultresult");
      setUserTests(data);
      setSelectedOption(patient_id);
      localStorage.setItem("selectedOption", patient_id);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };
  const getInvestigationParamsById = async (id: number) => {
    try {
      const data = await getInvestigationReportsAction(id);
      console.log(id, "idididid");
      console.log(data, "Fetched Test Details");
      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      {/* Organization Profile Header */}
      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("InvestReports")}</h2>
      </div>

      {/* Vertical Tabs */}
      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box p-5">
            <div className="flex items-center">
              <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto md:ml-0">
                <div className="relative w-56 text-slate-500">
                  <FormInput
                    type="text"
                    className="w-56 pr-10 !box"
                    placeholder={t("Search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Lucide
                    icon="Search"
                    className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              {Object.keys(groupedUsers).filter((name) =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-2 text-gray-500">
                  No user tabs available.
                </div>
              )}

              {Object.keys(groupedUsers)
                .filter((name) =>
                  name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((name) => {
                  const patientId = groupedUsers[name]?.[0]?.patient_id;

                  return (
                    <div
                      key={name}
                      className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                        selectedTab === name
                          ? "text-white rounded-lg bg-primary"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedTab(name);
                        setShowDetails(false);
                        handleClick(patientId);
                      }}
                    >
                      <Lucide icon="FileText" className="w-4 h-4 mr-2" />
                      <div className="flex-1 truncate">{name}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        {/* Content Area */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
              {!showDetails ? (
                <Table className="border-spacing-y-[10px] border-separate -mt-2">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th className="border-b-0 whitespace-nowrap">
                        #
                      </Table.Th>
                      <Table.Th className="border-b-0 whitespace-nowrap">
                        {t("Patient_name")}
                      </Table.Th>
                      <Table.Th className="text-center border-b-0 whitespace-nowrap">
                        {t("category")}
                      </Table.Th>
                      <Table.Th className="text-center border-b-0 whitespace-nowrap">
                        {t("Test_Name")}
                      </Table.Th>
                      <Table.Th className="text-center border-b-0 whitespace-nowrap">
                        {t("action")}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {userTests.filter((user) => user.name === selectedTab)
                      .length > 0 ? (
                      userTests
                        .filter((user) => user.name === selectedTab)
                        .map((user, key) => (
                          <Table.Tr key={user.id} className="intro-x">
                            <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                              <a className="font-medium whitespace-nowrap">
                                {key + 1}
                              </a>
                            </Table.Td>
                            <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                              {user.name}
                            </Table.Td>
                            <Table.Td className="text-center box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                              {user.category}
                            </Table.Td>
                            <Table.Td className="text-center box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                              {user.test_name}
                            </Table.Td>
                            <Table.Td className="text-center box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                              <div className="flex items-center justify-center">
                                <Lucide
                                  icon="Eye"
                                  className="w-4 h-4 mr-1 cursor-pointer"
                                  onClick={async () => {
                                    setSelectedTest(user);
                                    setLoading(true);
                                    const details =
                                      await getInvestigationParamsById(
                                        Number(user.investigation_id)
                                      );
                                    setLoading(false);
                                    setShowDetails(true);
                                  }}
                                />
                              </div>
                            </Table.Td>
                          </Table.Tr>
                        ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="text-center py-4">
                          {t("noMatchingRecords")}
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              ) : (
                <div className="p-5">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      {selectedTest?.test_name}
                    </h3>
                    <Button
                      onClick={() => setShowDetails(false)}
                      variant="primary"
                    >
                      {t("Back")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <table className="min-w-full border text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="px-4 py-2 border">
                            {t("ParameterName")}
                          </th>
                          <th className="px-4 py-2 border">{t("Value")}</th>
                          <th className="px-4 py-2 border">
                            {t("NormalRange")}
                          </th>
                          <th className="px-4 py-2 border">{t("Units")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testDetails.map((param) => (
                          <tr
                            key={param.id}
                            className="bg-white hover:bg-slate-50"
                          >
                            <td className="px-4 py-2 border">{param.name}</td>
                            <td className="px-4 py-2 border">{param.value}</td>
                            <td className="px-4 py-2 border">
                              {param.normal_range}
                            </td>
                            <td className="px-4 py-2 border">{param.units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
