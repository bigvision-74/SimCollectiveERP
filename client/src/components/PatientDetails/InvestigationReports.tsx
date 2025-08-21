import { useEffect, useState } from "react";
import Table from "@/components/Base/Table";
import {
  getInvestigationReportsAction,
  getUserReportsListByIdAction,
} from "@/actions/patientActions";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";

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

type GroupedTest = {
  normal_range: string;
  units: string;
  valuesByDate: Record<string, string>;
};

function PatientDetailTable({ patientId }: { patientId: string }) {
  const [userTests, setUserTests] = useState<UserTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [testDetails, setTestDetails] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const fetchPatientReports = async (id: string) => {
    try {
      setLoading(true);
      const data = await getUserReportsListByIdAction(Number(id));
      setUserTests(data || []);
    } catch (error) {
      console.error("Failed to fetch patient test reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientReports(patientId);
    }
  }, [patientId]);

  const getInvestigationParamsById = async (
    id: number,
    investigation_id: number
  ) => {
    try {
      const data = await getInvestigationReportsAction(id, investigation_id);

      console.log(data, "data");

      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  const grouped = testDetails.reduce(
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
  // const uniqueDates = Array.from(
  //   new Set(testDetails.map((p) => p.created_at))
  // ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const uniqueDates = Array.from(
    new Map(
      testDetails.map((p) => [
        p.created_at, // key for uniqueness
        {
          date: p.created_at,
          scheduled_date: p.scheduled_date,
          submitted_by_fname: p.submitted_by_fname,
          submitted_by_lname: p.submitted_by_lname,
        },
      ])
    ).values()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isImage = (value: string): boolean => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value);
  };

  const getFullImageUrl = (value: string) => {
    return value.startsWith("http")
      ? value
      : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${value}`;
  };

  return (
    <div className="p-5 rounded-md box">
      {/* Image Viewer Modal */}
      <Dialog open={!!modalImageUrl} onClose={() => setModalImageUrl(null)}>
        {modalImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg overflow-hidden max-w-3xl w-full p-4 relative">
              <button
                className="absolute top-2 right-2 z-10 bg-white rounded-full shadow p-3 text-[1.5rem] leading-[1rem] text-gray-600 hover:text-red-600"
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

      <Dialog open={!!openReport} onClose={() => setOpenReport(false)}>
        {openReport && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-3/4 max-w-3xl p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t("ReportPreview")}</h2>
                <button
                  onClick={() => setOpenReport(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: reportHtml || "" }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {!showDetails ? (
        <div className="overflow-x-auto">
          <Table className="border-spacing-y-[10px] border-separate -mt-2 ">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>{t("Category")}</Table.Th>
                <Table.Th>{t("TestName")}</Table.Th>
                <Table.Th>{t("Action")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {userTests.length > 0 ? (
                [
                  ...new Map(
                    userTests.map((test) => [
                      `${test.category}-${test.test_name}`,
                      test,
                    ])
                  ).values(),
                ].map((test, index) => (
                  <Table.Tr key={test.id} className="intro-x ">
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>{test.category}</Table.Td>
                    <Table.Td>{test.test_name}</Table.Td>
                    <Table.Td>
                      <Lucide
                        icon="Eye"
                        className="w-4 h-4 mr-1 cursor-pointer"
                        onClick={async () => {
                          setSelectedTest(test);
                          setLoading(true);
                          await getInvestigationParamsById(
                            Number(test.patient_id),
                            Number(test.investigation_id)
                          );
                          setLoading(false);
                          setShowDetails(true);
                        }}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-4">
                    {t("Notestrecordsavailable")}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex justify-between mb-4 ">
            <h3 className="text-lg font-semibold text-primary">
              {selectedTest?.test_name}
            </h3>
            <Button onClick={() => setShowDetails(false)} variant="primary">
              {t("Back")}
            </Button>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 border text-left">
                  {t("ParameterName")}
                </th>
                <th className="px-4 py-2 border text-left">
                  {t("NormalRange")}
                </th>
                <th className="px-4 py-2 border text-left">{t("Units")}</th>

                {uniqueDates.map(
                  ({
                    date,
                    scheduled_date,
                    submitted_by_fname,
                    submitted_by_lname,
                  }) => {
                    const isVisible =
                      !scheduled_date || new Date(scheduled_date) <= new Date();

                    return (
                      <th key={date} className="px-4 py-2 border text-left">
                        <div className="flex justify-between items-center">
                          <span>{new Date(date).toLocaleString("en-GB")}</span>
                          <span className="text-xs text-gray-500 italic ml-2 whitespace-nowrap">
                            {submitted_by_fname} {submitted_by_lname}
                          </span>
                        </div>
                      </th>
                    );
                  }
                )}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const parameterEntries = Object.entries(grouped) as [
                  string,
                  GroupedTest
                ][];
                const totalRows = parameterEntries.length;

                return parameterEntries.map(([name, details], rowIndex) => {
                  let processedCells = [];
                  let i = 0;

                  while (i < uniqueDates.length) {
                    const currentDate = uniqueDates[i];
                    const isVisible =
                      !currentDate.scheduled_date ||
                      new Date(currentDate.scheduled_date) <= new Date();

                    if (isVisible) {
                      const value =
                        details.valuesByDate[currentDate.date] ?? "-";
                      const isHtmlContent =
                        typeof value === "string" &&
                        /<\/?[a-z][\s\S]*>/i.test(value);

                      const displayValue = isHtmlContent ? (
                        <a
                          onClick={() => {
                            setReportHtml(value);
                            setOpenReport(true);
                          }}
                          className="py-1 text-primary font-bold cursor-pointer"
                        >
                          {t("ViewReport")}
                        </a>
                      ) : typeof value === "string" && isImage(value) ? (
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
                        value
                      );

                      processedCells.push(
                        <td
                          key={currentDate.date}
                          className="px-4 py-2 border text-left"
                        >
                          {displayValue}
                        </td>
                      );
                      i++;
                    } else {
                      let mergeCount = 1;
                      const scheduledDate = currentDate.scheduled_date;

                      while (i + mergeCount < uniqueDates.length) {
                        const nextDate = uniqueDates[i + mergeCount];
                        const nextIsVisible =
                          !nextDate.scheduled_date ||
                          new Date(nextDate.scheduled_date) <= new Date();

                        if (
                          !nextIsVisible &&
                          nextDate.scheduled_date === scheduledDate
                        ) {
                          mergeCount++;
                        } else {
                          break;
                        }
                      }

                      if (rowIndex === 0) {
                        processedCells.push(
                          <td
                            key={`scheduled-${currentDate.date}`}
                            className="px-4 py-2 border text-center bg-yellow-50"
                            colSpan={mergeCount}
                            rowSpan={totalRows}
                          >
                            <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs font-medium">
                              {t("Scheduledvisibleon")}{" "}
                              {new Date(scheduledDate).toLocaleString("en-GB")}
                            </span>
                          </td>
                        );
                      }

                      i += mergeCount;
                    }
                  }

                  return (
                    <tr key={name}>
                      <td className="px-4 py-2 border">{name}</td>
                      <td className="px-4 py-2 border">
                        {details.normal_range}
                      </td>
                      <td className="px-4 py-2 border">{details.units}</td>
                      {processedCells}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PatientDetailTable;
