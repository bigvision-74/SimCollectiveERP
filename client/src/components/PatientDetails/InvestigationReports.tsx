import { useEffect, useState } from "react";
import Table from "@/components/Base/Table";
import {
  getInvestigationReportsAction,
  getPatientNotesAction,
  getUserReportsListByIdAction,
  addPatientNoteAction,
} from "@/actions/patientActions";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import { getAdminOrgAction } from "@/actions/adminActions";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";

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
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [noteFormErrors, setNoteFormErrors] = useState({
    title: "",
    content: "",
  });
  const [noteLoading, setNoteLoading] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const fetchPatientReports = async (id: string) => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      setCurrentOrgId(userData.orgid);
      setUserRole(userData.role);

      setLoading(true);
      const data = await getUserReportsListByIdAction(
        Number(id),
        Number(userData.orgid)
      );

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
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const data = await getInvestigationReportsAction(
        id,
        investigation_id,
        userData.orgid
      );

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

  const uniqueDates = Array.from(
    new Map(
      testDetails.map((p) => [
        p.created_at,
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

  const isVideo = (value: string): boolean => {
    return /\.(mp4)$/i.test(value);
  };

  const getFullImageUrl = (value: string) => {
    return value.startsWith("http")
      ? value
      : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${value}`;
  };

  //Ankit Dhiman: add new note buy user side
  const handleNoteSubmit = async () => {
    let errors = { title: "", content: "" };
    if (!noteTitle.trim()) errors.title = t("Note title is required");
    if (!noteInput.trim()) errors.content = t("Note content is required");

    setNoteFormErrors(errors);
    if (errors.title || errors.content) return;

    try {
      setNoteLoading(true);

      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const payload = {
        patient_id: Number(selectedTest?.patient_id),
        sessionId: Number(selectedTest?.id),
        doctor_id: Number(userData.id),
        title: noteTitle,
        content: noteInput,
        organisation_id: userData.orgid,
        report_id: Number(selectedTest?.investigation_id),
      };

      console.log(payload, "payload");

      await addPatientNoteAction(payload);
      setShowAlert({ variant: "success", message: t("Noteaddedsuccessfully") });

      setNoteTitle("");
      setNoteInput("");
      setOpenNoteDialog(false);

      getPatientNotes(
        Number(selectedTest?.investigation_id),
        Number(selectedTest?.patient_id)
      );
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setNoteLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  // get all patient notes by id
  const getPatientNotes = async (reportId: number, patientId: number) => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const response = await getPatientNotesAction(
        Number(patientId),
        Number(userData.orgid),
        reportId // ✅ use param
      );
      console.log(response, "reposnse");

      const formattedNotes = (response || []).map((note: any) => ({
        ...note,
        doctor_name:
          Number(note.doctor_id) === Number(userData.uid)
            ? "You"
            : `${note.doctor_fname || ""} ${note.doctor_lname || ""}`.trim() ||
              "Unknown",
      }));

      setPatientNotes(formattedNotes); // ✅ Use formatted notes
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

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

      <Dialog open={!!modalVideoUrl} onClose={() => setModalVideoUrl(null)}>
        {modalVideoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg overflow-hidden max-w-3xl w-full p-4 relative">
              <button
                className="absolute top-2 right-2 z-10 bg-white rounded-full shadow p-3 text-[1.5rem] leading-[1rem] text-gray-600 hover:text-red-600"
                onClick={() => setModalVideoUrl(null)}
              >
                ✕
              </button>

              <video
                src={modalVideoUrl}
                controls
                autoPlay
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
                  <h2 className="text-lg font-semibold">
                    {t("ReportPreview")}
                  </h2>
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

        {/* add new note diloag box  */}
        <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)}>
          <Dialog.Panel className="p-7 relative w-[80vw] max-w-4xl sm:w-auto">
            <>
              {/* Close Button */}
              <a
                onClick={(event: React.MouseEvent) => {
                  event.preventDefault();
                  setNoteTitle("");
                  setNoteInput("");
                  setNoteFormErrors({ title: "", content: "" });
                  setOpenNoteDialog(false);
                }}
                className="absolute top-0 right-0 mt-3 mr-3"
              >
                <Lucide icon="X" className="w-6 h-6 text-slate-400" />
              </a>

              {/* Box Container */}
              <div className="col-span-12 intro-y lg:col-span-8 box mt-3">
                {/* Header */}
                <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
                  <h2 className="mr-auto text-base font-medium">
                    {t("add_note")}
                  </h2>
                </div>

                {/* Form */}
                <div className="p-5">
                  {/* Note Title */}
                  <div className="flex items-center justify-between">
                    <FormLabel
                      htmlFor="noteTitle"
                      className="font-bold videoModuleName"
                    >
                      {t("NoteTitle")}
                    </FormLabel>
                  </div>
                  <FormInput
                    id="noteTitle"
                    name="title"
                    type="text"
                    placeholder={t("EnterNoteTitle")}
                    className={`w-full mb-2 ${clsx({
                      "border-danger": noteFormErrors.title,
                    })}`}
                    value={noteTitle}
                    onChange={(e) => {
                      setNoteTitle(e.target.value);
                      setNoteFormErrors((p) => ({ ...p, title: "" }));
                    }}
                  />
                  {noteFormErrors.title && (
                    <p className="text-red-500 text-sm">
                      {noteFormErrors.title}
                    </p>
                  )}

                  {/* Note Content */}
                  <div className="flex items-center justify-between mt-5">
                    <FormLabel
                      htmlFor="noteContent"
                      className="font-bold videoModuleName"
                    >
                      {t("NoteContent")}
                    </FormLabel>
                  </div>
                  <FormTextarea
                    id="noteContent"
                    name="content"
                    rows={6}
                    placeholder={t("WriteyourNote")}
                    className={`w-full mb-2 ${clsx({
                      "border-danger": noteFormErrors.content,
                    })}`}
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                      setNoteFormErrors((p) => ({ ...p, content: "" }));
                    }}
                  />
                  {noteFormErrors.content && (
                    <p className="text-red-500 text-sm">
                      {noteFormErrors.content}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="mt-5 text-right">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      className="w-24 mr-2"
                      onClick={() => setOpenNoteDialog(false)}
                      disabled={noteLoading}
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="w-24"
                      onClick={handleNoteSubmit}
                      disabled={noteLoading}
                    >
                      {noteLoading ? (
                        <div className="loader">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      ) : (
                        t("SaveNote")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          </Dialog.Panel>
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
                          icon="FileText"
                          className="w-4 h-4 mr-1 cursor-pointer"
                          onClick={async () => {
                            setSelectedTest(test);
                            setLoading(true);
                            await getInvestigationParamsById(
                              Number(test.patient_id),
                              Number(test.investigation_id)
                            );
                            getPatientNotes(
                              Number(test.investigation_id),
                              Number(test.patient_id)
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

              <div className="flex gap-2">
                {userRole === "User" && (
                  <Button
                    onClick={() => setOpenNoteDialog(true)}
                    variant="outline-primary"
                  >
                    {t("AddNote")}
                  </Button>
                )}
                <Button onClick={() => setShowDetails(false)} variant="primary">
                  {t("Back")}
                </Button>
              </div>
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
                        !scheduled_date ||
                        new Date(scheduled_date) <= new Date();

                      return (
                        <th key={date} className="px-4 py-2 border text-left">
                          <div className="flex justify-between items-center">
                            <span>
                              {new Date(date).toLocaleString("en-GB")}
                            </span>
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
                      ) : typeof value === "string" && isVideo(value) ? (
                        <div
                          className="relative w-20 h-20 rounded cursor-pointer"
                          onClick={() =>
                            setModalVideoUrl(getFullImageUrl(value))
                          }
                        >
                          {/* Thumbnail (just shows first frame of video) */}
                          <video
                            src={getFullImageUrl(value)}
                            className="w-20 h-20 object-cover rounded"
                            muted
                            playsInline
                          />

                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
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
                                {new Date(scheduledDate).toLocaleString(
                                  "en-GB"
                                )}
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

            {/* Notes Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-primary mb-3">
                {t("Notes")}
              </h4>

              {patientNotes.length > 0 ? (
                <div
                  className={clsx("space-y-4", {
                    "max-h-96 overflow-y-auto": patientNotes.length > 5, // scroll if more than 5 notes
                  })}
                >
                  {patientNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 border rounded-lg shadow-sm bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-gray-800">
                          {note.title}
                        </h5>
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                      <div className="text-xs text-gray-500 mt-2 italic">
                        {t("created_by")}: {note.doctor_name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">{t("NoNotesAvailable")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PatientDetailTable;
