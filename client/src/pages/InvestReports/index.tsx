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
import { Dialog } from "@/components/Base/Headless";

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
  updated_at: string;
}

type GroupedTest = {
  normal_range: string;
  units: string;
  valuesByDate: Record<string, string>;
};

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
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

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
      setUserTests(data);
      setSelectedOption(patient_id);
      localStorage.setItem("selectedOption", patient_id);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };
  const getInvestigationParamsById = async (
    id: number,
    investigation_id: number
  ) => {
    try {
      const data = await getInvestigationReportsAction(id, investigation_id);

      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  const grouped1 = testDetails.reduce(
    (acc, param) => {
      const key = param.name;
      if (!acc[key]) {
        acc[key] = {
          normal_range: param.normal_range,
          units: param.units,
          valuesByDate: {},
        };
      }
      acc[key].valuesByDate[param.created_at] = param.value;
      return acc;
    },
    {} as Record<
      string,
      {
        normal_range: string;
        units: string;
        valuesByDate: Record<string, string>;
      }
    >
  );

  // Get unique sorted dates
  const uniqueDates = Array.from(
    new Set(testDetails.map((p) => p.created_at))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const isImage = (value: string): boolean => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value);
  };

  const getFullImageUrl = (value: string) => {
    return value.startsWith("http")
      ? value
      : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${value}`;
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      {/* Image Viewer Modal */}
      <Dialog open={!!modalImageUrl} onClose={() => setModalImageUrl(null)}>
        {modalImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg overflow-hidden max-w-3xl w-full p-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
                onClick={() => setModalImageUrl(null)}
              >
                ✕
              </button>
              <img
                src={modalImageUrl}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        )}
      </Dialog>

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
                  {t("Nousertabsavailable")}
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
                      <Table.Th>#</Table.Th>
                      <Table.Th>{t("category1")}</Table.Th>
                      <Table.Th>{t("Test_Name")}</Table.Th>
                      <Table.Th>{t("action")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {userTests.filter((user) => user.name === selectedTab)
                      .length > 0 ? (
                      [
                        ...new Map(
                          userTests
                            .filter((user) => user.name === selectedTab)
                            .map((test) => [
                              `${test.category}-${test.test_name}`,
                              test,
                            ])
                        ).values(),
                      ].map((user, key) => (
                        <Table.Tr key={user.id} className="intro-x">
                          <Table.Td>
                            <a className="font-medium whitespace-nowrap">
                              {key + 1}
                            </a>
                          </Table.Td>
                          <Table.Td>{user.category}</Table.Td>
                          <Table.Td>{user.test_name}</Table.Td>
                          <Table.Td>
                            <div className="flex">
                              <Lucide
                                icon="Eye"
                                className="w-4 h-4 mr-1 cursor-pointer"
                                onClick={async () => {
                                  setSelectedTest(user);
                                  setLoading(true);
                                  const details =
                                    await getInvestigationParamsById(
                                      Number(user.patient_id),
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
                    <table className="table  w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border text-left">
                            {t("ParameterName")}
                          </th>
                          <th className="px-4 py-2 border text-left">
                            {t("NormalRange")}
                          </th>
                          <th className="px-4 py-2 border text-left">
                            {t("Units")}
                          </th>
                          {uniqueDates.map((date) => (
                            <th
                              key={date}
                              className="px-4 py-2 border text-left"
                            >
                              {new Date(date).toLocaleDateString("en-GB")}{" "}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          Object.entries(grouped1) as [string, GroupedTest][]
                        ).map(([name, details]) => (
                          <tr key={name}>
                            <td className="px-4 py-2 border">{name}</td>
                            <td className="px-4 py-2 border">
                              {details.normal_range}
                            </td>
                            <td className="px-4 py-2 border">
                              {details.units}
                            </td>
                            {uniqueDates.map((date) => {
                              const value = details.valuesByDate[date];
                              return (
                                <td
                                  key={date}
                                  className="px-4 py-2 border text-left"
                                >
                                  {typeof value === "string" &&
                                  isImage(value) ? (
                                    <img
                                      src={getFullImageUrl(value)}
                                      alt={name}
                                      className="w-20 h-20 object-cover rounded cursor-pointer"
                                      onClick={() =>
                                        setModalImageUrl(getFullImageUrl(value))
                                      }
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "https://via.placeholder.com/100";
                                      }}
                                    />
                                  ) : (
                                    value ?? "-"
                                  )}
                                </td>
                              );
                            })}
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
