import { useEffect, useState } from "react";
import Table from "@/components/Base/Table";
import {
  getInvestigationReportsAction,
  getPatientNotesAction,
  getUserReportsListByIdAction,
  addPatientNoteAction,
  updateInvestigationResultAction,
  deleteInvestigationReportAction,
  addCommentsAction,
  updateCommentsAction,
  deleteCommentsAction,
} from "@/actions/patientActions";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { t } from "i18next";
import { Dialog } from "@/components/Base/Headless";
import { getAdminOrgAction } from "@/actions/adminActions";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import MediaLibrary from "@/components/MediaLibrary";
import { useUploads } from "@/components/UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { getUserOrgIdAction } from "@/actions/userActions";

interface TestParameter {
  id: number;
  name: string;
  normal_range: string;
  units: string;
  value: string;
  created_at: string;
  scheduled_date: string | null;
  submitted_by: number;
  request_investigation_id: number;
  submitted_by_fname: string;
  submitted_by_lname: string;
  field_type?: string;
}

interface UserTest {
  id: number;
  name: string;
  category: string;
  test_name: string;
  investigation_id: string;
  patient_id: string;
}

type GroupedTest = {
  normal_range: string;
  units: string;
  valuesByDate: Record<string, string>;
  field_type?: string;
};

interface ReportNote {
  id: number;
  reportId: string;
  note: string;
  addedBy: string;
  created_at: string;
  fname: string;
  lname: string;
  user_thumbnail: string;
  doctor_id?: number;
  doctor_fname?: string;
  doctor_lname?: string;
  title?: string;
  content?: string;
  doctor_name?: string;
}

interface Props {
  patientId: string;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted"
  ) => void;
}

const PatientDetailTable: React.FC<Props> = ({ patientId, onDataUpdate }) => {
  // --- STATE ---
  const [userTests, setUserTests] = useState<UserTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [testDetails, setTestDetails] = useState<TestParameter[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Media Preview State
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  // User State
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // To track logged in user ID

  // Notes State
  const [reportNotes, setReportNotes] = useState<ReportNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteLoading1, setNoteLoading1] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [patientNotes, setPatientNotes] = useState<ReportNote[]>([]);

  // Modal Notes Management
  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [selectedColumnNotes, setSelectedColumnNotes] = useState<ReportNote[]>(
    []
  );
  const [activeReportId, setActiveReportId] = useState<number | null>(null); // ID of the report currently open in modal
  const [newModalComment, setNewModalComment] = useState(""); // Input for new comment in modal

  // Editing Notes State
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Alert State
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // --- EDITING & UPLOAD STATE ---
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<
    Record<string, string | File>
  >({});
  const [savingReport, setSavingReport] = useState(false);

  // --- DELETE STATE (Reports) ---
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- DELETE STATE (Comments) ---
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);

  // Media Library Logic
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [activeMediaKey, setActiveMediaKey] = useState<string | null>(null);
  const { addTask, updateTask } = useUploads();
  const [isAddingNote, setIsAddingNote] = useState(false);

  // --- FETCH LOGIC ---
  const fetchPatientReports = async (id: string) => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setCurrentOrgId(userData.orgid);
      setUserRole(userData.role);
      setCurrentUserId(Number(userData.id)); // Set current user ID
      setLoading(true);
      const data = await getUserReportsListByIdAction(
        Number(id),
        Number(userData.orgid)
      );
      setUserTests(data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPatientReports(patientId);
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

      setTestDetails(data.test_parameters || []);

      const sortedNotes = (data.notes || []).sort(
        (a: ReportNote, b: ReportNote) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReportNotes(sortedNotes);
      await getPatientNotes(investigation_id, id);
      return sortedNotes; // Return for chaining updates
    } catch (error) {
      console.error("Error fetching params", error);
      return [];
    }
  };

  // Grouping Logic
  const grouped = testDetails.reduce((acc, param) => {
    const key = param.name;
    if (!acc[key]) {
      acc[key] = {
        normal_range: param.normal_range,
        units: param.units,
        valuesByDate: {},
        field_type: param.field_type,
      };
    }
    acc[key].valuesByDate[param.created_at] = param.value;
    return acc;
  }, {} as Record<string, GroupedTest>);

  const uniqueDates = Array.from(
    new Map(
      testDetails.map((p) => [
        p.created_at,
        {
          date: p.created_at,
          scheduled_date: p.scheduled_date,
          submitted_by_fname: p.submitted_by_fname,
          submitted_by_lname: p.submitted_by_lname,
          report_id: p.request_investigation_id,
        },
      ])
    ).values()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- HELPER FUNCTIONS ---
  const isImage = (value: string | File) => {
    if (value instanceof File) return value.type.startsWith("image/");
    if (!value || typeof value !== "string") return false;
    return /\.(jpg|jpeg|png|gif|bmp|webp|jfif|svg|heic|tiff|ico)(\?.*)?$/i.test(
      value
    );
  };

  const isVideo = (value: string | File) => {
    if (value instanceof File) return value.type.startsWith("video/");
    if (!value || typeof value !== "string") return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(value);
  };

  const getFullImageUrl = (value: string | File) => {
    if (value instanceof File) return URL.createObjectURL(value);
    if (!value) return "";
    return value.startsWith("http")
      ? value
      : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${value}`;
  };

  // --- NOTES HANDLERS ---
  const handleNoteSubmit = async () => {
    if (!noteTitle.trim() || !noteInput.trim()) {
      setShowAlert({
        variant: "danger",
        message: t("Title and content required"),
      });
      return;
    }

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
      await addPatientNoteAction(payload);
      setShowAlert({ variant: "success", message: t("Note added") });
      setNoteTitle("");
      setNoteInput("");
      setOpenNoteDialog(false);

      getPatientNotes(
        Number(selectedTest?.investigation_id),
        Number(selectedTest?.patient_id)
      );
    } catch (e) {
      console.error(e);
      setShowAlert({ variant: "danger", message: t("Failed to add note") });
    } finally {
      setNoteLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const getPatientNotes = async (reportId: number, patientId: number) => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      const response = await getPatientNotesAction(
        Number(patientId),
        Number(userData.orgid),
        reportId
      );
      const formattedNotes = (response || []).map((note: any) => ({
        ...note,
        doctor_name:
          Number(note.doctor_id) === Number(userData.uid)
            ? "You"
            : `${note.doctor_fname || ""} ${note.doctor_lname || ""}`,
      }));
      setPatientNotes(formattedNotes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewColumnNotes = (notes: ReportNote[], reportId: number) => {
    setSelectedColumnNotes(notes);
    setActiveReportId(reportId);
    setOpenNotesModal(true);
    setNewModalComment("");
    setEditingNoteId(null);
    setIsAddingNote(false);
  };

  const handleAddComment = async () => {
    if (!newModalComment.trim() || !activeReportId) return;

    try {
      setNoteLoading(true);
      const useremail = localStorage.getItem("user");

      const userData = await getAdminOrgAction(String(useremail));

      const payload = {
        note: newModalComment,
        addedBy: userData.id,
        reportId: activeReportId,
      };

      await addCommentsAction(payload);

      if (selectedTest) {
        const allNotes = await getInvestigationParamsById(
          Number(selectedTest.patient_id),
          Number(selectedTest.investigation_id)
        );
        const updatedModalNotes = allNotes.filter(
          (n: ReportNote) => Number(n.reportId) === Number(activeReportId)
        );
        setSelectedColumnNotes(updatedModalNotes);
      }

      setNewModalComment("");
      setIsAddingNote(false);
    } catch (error) {
      console.error("Error adding comment:", error);
      setShowAlert({ variant: "danger", message: t("Failed to add comment") });
    } finally {
      setNoteLoading(false);
    }
  };

  // --- DELETE COMMENT LOGIC ---

  const handleDeleteNote = (noteId: number) => {
    // Open the confirmation dialog
    setDeleteCommentId(noteId);
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      setIsDeleting(true);
      await deleteCommentsAction(deleteCommentId);

      setShowAlert({
        variant: "success",
        message: t("Comment deleted successfully"),
      });

      // Refresh Data
      if (selectedTest) {
        const allNotes = await getInvestigationParamsById(
          Number(selectedTest.patient_id),
          Number(selectedTest.investigation_id)
        );
        const updatedModalNotes = allNotes.filter(
          (n: ReportNote) => Number(n.reportId) === Number(activeReportId)
        );
        setSelectedColumnNotes(updatedModalNotes);
      }
      setDeleteCommentId(null);
    } catch (e) {
      console.error(e);
      setShowAlert({
        variant: "danger",
        message: t("Failed to delete comment"),
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  // ---------------------------

  const handleStartEditNote = (note: ReportNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note);
  };

  const handleSaveEditedNote = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    setNoteLoading1(true);
    try {
      const payload = {
        note: editingNoteText,
        commentId: editingNoteId,
      };
      await updateCommentsAction(payload);

      // Refresh Data
      if (selectedTest) {
        const allNotes = await getInvestigationParamsById(
          Number(selectedTest.patient_id),
          Number(selectedTest.investigation_id)
        );
        const updatedModalNotes = allNotes.filter(
          (n: ReportNote) => Number(n.reportId) === Number(activeReportId)
        );
        setSelectedColumnNotes(updatedModalNotes);
      }
      setEditingNoteId(null);
      setEditingNoteText("");
      setNoteLoading1(false);
    } catch (e) {
      console.error(e);
      setShowAlert({
        variant: "danger",
        message: t("Failed to update comment"),
      });
      setNoteLoading1(false);
    }
  };

  // --- EDIT & UPLOAD HANDLERS ---

  const handleEnableEdit = (reportId: number) => {
    const reportParams = testDetails.filter(
      (t) => Number(t.request_investigation_id) === Number(reportId)
    );
    const initialData = reportParams.reduce((acc, item) => {
      acc[`${reportId}-${item.id}`] = item.value;
      return acc;
    }, {} as Record<string, string | File>);

    setEditingReportId(reportId);
    setEditFormData(initialData);
  };

  const handleInlineChange = (key: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLibrarySelect = (image: { name: string; url: string }) => {
    if (activeMediaKey) {
      setEditFormData((prev) => ({ ...prev, [activeMediaKey]: image.url }));
    }
    setIsMediaLibraryOpen(false);
    setActiveMediaKey(null);
  };

  const handleNewFileUpload = (key: string, file: File) => {
    setEditFormData((prev) => ({ ...prev, [key]: file }));
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!editingReportId) return;
    try {
      setSavingReport(true);
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const updates = [];

      for (const [key, value] of Object.entries(editFormData)) {
        const paramId = Number(key.split("-")[1]);

        let finalValue = value;

        if (value instanceof File) {
          try {
            const presignedData = await getPresignedApkUrlAction(
              value.name,
              value.type,
              value.size
            );

            const taskId = addTask(value, `param-${paramId}`);
            await uploadFileAction(
              presignedData.presignedUrl,
              value,
              taskId,
              updateTask
            );

            finalValue = presignedData.url;
          } catch (err) {
            console.error("Upload failed for param", paramId, err);
            throw new Error("Image upload failed");
          }
        }

        updates.push({
          parameter_id: paramId,
          value: finalValue as string,
        });
      }

      const payload = {
        report_id: editingReportId,
        submitted_by: Number(userData.id),
        updates: updates,
      };

      await updateInvestigationResultAction(payload);

      setShowAlert({
        variant: "success",
        message: t("Report updated successfully"),
      });
      setEditingReportId(null);
      setEditFormData({});

      if (selectedTest) {
        await getInvestigationParamsById(
          Number(selectedTest.patient_id),
          Number(selectedTest.investigation_id)
        );
      }
    } catch (error) {
      console.error(error);
      setShowAlert({
        variant: "danger",
        message: t("Failed to update report"),
      });
    } finally {
      setSavingReport(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  // --- DELETE HANDLERS ---
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      setIsDeleting(true);
      await deleteInvestigationReportAction(deleteId, data1.id);

      setShowAlert({
        variant: "success",
        message: t("Report deleted successfully"),
      });
      setDeleteId(null); // Close modal

      // Refresh Data
      if (selectedTest) {
        await getInvestigationParamsById(
          Number(selectedTest.patient_id),
          Number(selectedTest.investigation_id)
        );
      }
    } catch (error) {
      console.error(error);
      setShowAlert({
        variant: "danger",
        message: t("Failed to delete report"),
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <MediaLibrary
        investId={String(selectedTest?.investigation_id)}
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleLibrarySelect}
      />

      {/* --- PREVIEW MODALS --- */}
      <Dialog open={!!modalImageUrl} onClose={() => setModalImageUrl(null)}>
        {modalImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded p-4 relative max-w-3xl">
              <button
                className="absolute top-2 right-2 text-xl hover:text-red-500"
                onClick={() => setModalImageUrl(null)}
              >
                ✕
              </button>
              <img
                src={modalImageUrl}
                alt="Preview"
                className="max-h-[80vh] w-auto"
              />
            </div>
          </div>
        )}
      </Dialog>
      <Dialog open={!!modalVideoUrl} onClose={() => setModalVideoUrl(null)}>
        {modalVideoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded p-4 relative max-w-3xl">
              <button
                className="absolute top-2 right-2 text-xl hover:text-red-500"
                onClick={() => setModalVideoUrl(null)}
              >
                ✕
              </button>
              <video
                src={modalVideoUrl}
                controls
                autoPlay
                className="max-h-[80vh] w-auto"
              />
            </div>
          </div>
        )}
      </Dialog>
      <Dialog open={!!openReport} onClose={() => setOpenReport(false)}>
        {openReport && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-3/4 max-w-3xl p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">{t("ReportPreview")}</h2>
                <button onClick={() => setOpenReport(false)}>✕</button>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: reportHtml || "" }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* --- ADD PATIENT NOTE DIALOG (WAS MISSING) --- */}
      <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)}>
        <Dialog.Panel>
          <div className="p-5">
            <div className="text-lg font-medium mb-4">
              {t("Add Patient Note")}
            </div>
            <div className="mb-3">
              <FormLabel>{t("Title")}</FormLabel>
              <FormInput
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={t("Enter title")}
              />
            </div>
            <div className="mb-4">
              <FormLabel>{t("Content")}</FormLabel>
              <FormTextarea
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t("Enter note content")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setOpenNoteDialog(false)}
                disabled={noteLoading}
              >
                {t("Cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleNoteSubmit}
                disabled={noteLoading}
              >
                {noteLoading ? (
                  <Lucide icon="Loader" className="animate-spin w-4 h-4" />
                ) : (
                  t("Save")
                )}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* --- DELETE REPORT DIALOG --- */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Are you sure?")}</div>
            <div className="mt-2 text-slate-500">
              {t("Do you really want to delete this report?")} <br />
              {t("This process cannot be undone.")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setDeleteId(null)}
              className="w-24 mr-3"
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "..." : t("Delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* --- DELETE COMMENT DIALOG --- */}
      <Dialog open={!!deleteCommentId} onClose={() => setDeleteCommentId(null)}>
        <Dialog.Panel className="z-[60]">
          <div className="p-5 text-center">
            <Lucide
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Are you sure?")}</div>
            <div className="mt-2 text-slate-500">
              {t("Do you really want to delete this comment?")} <br />
              {t("This process cannot be undone.")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setDeleteCommentId(null)}
              className="w-24 mr-3"
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={handleConfirmDeleteComment}
              disabled={isDeleting}
            >
              {isDeleting ? "..." : t("Delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={openNotesModal} onClose={() => setOpenNotesModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col relative mx-4 p-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-medium">{t("Comments")}</h3>
              <button onClick={() => setOpenNotesModal(false)}>
                <Lucide icon="X" />
              </button>
            </div>

            {/* --- ADD COMMENT SECTION --- */}
            {isAddingNote ? (
              <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200">
                <FormTextarea
                  rows={2}
                  placeholder={t("Write a new comment...")}
                  value={newModalComment}
                  onChange={(e) => setNewModalComment(e.target.value)}
                  className="text-sm bg-white"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setIsAddingNote(false)}
                    disabled={noteLoading}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={noteLoading || !newModalComment.trim()}
                  >
                    {noteLoading ? (
                      <div className="loader">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    ) : (
                      t("Post")
                    )}
                  </Button>
                </div>
              </div>
            ) : localStorage.getItem("role") !== "Observer" ? (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddingNote(true)}
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                  {t("Add Comment")}
                </Button>
              </div>
            ) : null}

            <div className="overflow-y-auto flex-1">
              {selectedColumnNotes.map((note, idx) => {
                const isOwner = Number(note.addedBy) === currentUserId;
                const isEditing = editingNoteId === note.id;

                return (
                  <div
                    key={idx}
                    className="mb-3 bg-slate-50 p-3 rounded border group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={
                          note.user_thumbnail
                            ? getFullImageUrl(note.user_thumbnail)
                            : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                        }
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        alt="image"
                      />
                      <div className="flex justify-between flex-1 items-start">
                        <div>
                          <div className="text-sm font-bold text-slate-700">
                            {note.fname} {note.lname}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>

                        {isOwner && !isEditing && (
                          <div className="flex gap-2 opacity-100">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="text-primary transition-colors"
                              title={t("Edit")}
                            >
                              <Lucide icon="Pen" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-danger transition-colors"
                              title={t("Delete")}
                            >
                              <Lucide icon="Trash" className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2">
                        <FormTextarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full text-sm mb-2"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setEditingNoteId(null)}
                          >
                            {t("Cancel")}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveEditedNote}
                            disabled={noteLoading || !editingNoteText.trim()}
                          >
                            {noteLoading1 ? (
                              <div className="loader">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                              </div>
                            ) : (
                              t("Save")
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 pl-10 whitespace-pre-wrap">
                        {note.note}
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedColumnNotes.length === 0 && (
                <div className="text-center text-slate-400 py-4 italic">
                  {t("No comments yet")}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      <div className="">
        {!showDetails ? (
          <div className="overflow-x-auto">
            <Table className="border-spacing-y-[10px] border-separate -mt-2">
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
                        `${test.category}-${test.name}`,
                        test,
                      ])
                    ).values(),
                  ].map((test, index) => (
                    <Table.Tr key={test.id} className="intro-x">
                      <Table.Td>{index + 1}</Table.Td>
                      <Table.Td>{test.category}</Table.Td>
                      <Table.Td>{test.name}</Table.Td>
                      <Table.Td>
                        <Lucide
                          icon="FileText"
                          className="w-4 h-4 cursor-pointer hover:text-primary"
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
                      {t("No records")}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex justify-between mb-4 items-center">
              <h3 className="text-lg font-semibold text-primary">
                {selectedTest?.name}
              </h3>
              <div className="flex gap-2">
                {userRole === "User" && (
                  <Button
                    onClick={() => setOpenNoteDialog(true)}
                    variant="outline-primary"
                  >
                    {t("add_note")}
                  </Button>
                )}
                <Button onClick={() => setShowDetails(false)} variant="primary">
                  {t("Back")}
                </Button>
              </div>
            </div>

            <table className="table w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 border bg-slate-100 font-semibold text-left">
                    {t("ParameterName")}
                  </th>
                  <th className="px-4 py-3 border bg-slate-100 font-semibold text-left">
                    {t("NormalRange")}
                  </th>
                  <th className="px-4 py-3 border bg-slate-100 font-semibold text-left">
                    {t("Units")}
                  </th>

                  {uniqueDates.map(
                    ({
                      date,
                      scheduled_date,
                      report_id,
                      submitted_by_fname,
                      submitted_by_lname,
                    }) => {
                      const isFuture =
                        scheduled_date && new Date(scheduled_date) > new Date();
                      const isEditingThisColumn =
                        editingReportId === Number(report_id);

                      return (
                        <th
                          key={date}
                          className={clsx(
                            "px-4 py-3 border text-left min-w-[200px]",
                            {
                              "bg-blue-50": isEditingThisColumn,
                              "bg-slate-100": !isEditingThisColumn,
                            }
                          )}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-700">
                                {new Date(date).toLocaleString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {!isFuture && (
                                <div className="flex gap-1">
                                  {localStorage.getItem("role") ===
                                  "Observer" ? (
                                    <></>
                                  ) : isEditingThisColumn ? (
                                    <>
                                      <button
                                        onClick={handleSaveEdit}
                                        disabled={savingReport}
                                        className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded transition-colors"
                                      >
                                        {savingReport ? (
                                          <Lucide
                                            icon="Loader"
                                            className="w-4 h-4 animate-spin"
                                          />
                                        ) : (
                                          <Lucide
                                            icon="Check"
                                            className="w-4 h-4"
                                          />
                                        )}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        disabled={savingReport}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded transition-colors"
                                      >
                                        <Lucide icon="X" className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleEnableEdit(Number(report_id))
                                        }
                                        disabled={editingReportId !== null}
                                        className={clsx(
                                          "text-primary p-1 rounded transition-colors",
                                          {
                                            "hover:text-primary":
                                              editingReportId === null,
                                            "opacity-30":
                                              editingReportId !== null,
                                          }
                                        )}
                                      >
                                        <Lucide
                                          icon="Pen"
                                          className="w-4 h-4"
                                        />
                                      </button>

                                      <button
                                        onClick={() => {
                                          console.log("Delete", report_id),
                                            setDeleteId(Number(report_id));
                                        }}
                                        disabled={editingReportId !== null}
                                        className={clsx(
                                          "text-danger p-1 rounded transition-colors",
                                          {
                                            "hover:text-red-700":
                                              editingReportId === null,
                                            "opacity-30":
                                              editingReportId !== null,
                                          }
                                        )}
                                      >
                                        <Lucide
                                          icon="Trash"
                                          className="w-4 h-4"
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            {!isEditingThisColumn ? (
                              <span className="text-xs text-gray-500 italic truncate">
                                {submitted_by_fname} {submitted_by_lname}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 italic truncate">
                                Editing...
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    }
                  )}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const parameterEntries = Object.entries(grouped);
                  const totalRows = parameterEntries.length + 1;

                  const renderedRows = parameterEntries.map(
                    ([name, details], rowIndex) => {
                      let processedCells = [];
                      let i = 0;
                      while (i < uniqueDates.length) {
                        const currentDate = uniqueDates[i];
                        const isVisible =
                          !currentDate.scheduled_date ||
                          new Date(currentDate.scheduled_date) <= new Date();

                        if (isVisible) {
                          const isEditingThisColumn =
                            editingReportId === Number(currentDate.report_id);
                          const matchingParam = testDetails.find(
                            (t) =>
                              t.name === name &&
                              String(t.request_investigation_id) ===
                                String(currentDate.report_id)
                          );
                          const currentParamId = matchingParam
                            ? matchingParam.id
                            : null;
                          const compositeKey = `${currentDate.report_id}-${currentParamId}`;

                          const rawValue =
                            editFormData[compositeKey] !== undefined
                              ? editFormData[compositeKey]
                              : details.valuesByDate[currentDate.date] ?? "";

                          // === CELL CONTENT LOGIC ===
                          let content;
                          if (isEditingThisColumn && currentParamId) {
                            // EDIT MODE
                            const isFile = rawValue instanceof File;
                            const isImgUrl =
                              typeof rawValue === "string" && isImage(rawValue);

                            if (
                              matchingParam?.field_type === "image" ||
                              isFile
                            ) {
                              content = (
                                <div className="flex flex-col gap-2 min-w-[220px]">
                                  <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer">
                                      <input
                                        key={`${compositeKey}-input`}
                                        type="file"
                                        accept="image/*,video/mp4"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file)
                                            handleNewFileUpload(
                                              compositeKey,
                                              file
                                            );
                                        }}
                                      />
                                      <div className="p-2 border border-dashed rounded text-center hover:bg-slate-100 text-xs text-slate-500 transition-colors cursor-pointer">
                                        {t("Upload New")}
                                      </div>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMediaKey(compositeKey);
                                        setIsMediaLibraryOpen(true);
                                      }}
                                      className="flex-1 p-2 border rounded text-center hover:bg-slate-100 text-xs text-slate-500 transition-colors"
                                    >
                                      {t("Existing")}
                                    </button>
                                  </div>
                                  {rawValue && (
                                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded border">
                                      {(
                                        isFile
                                          ? rawValue.type.startsWith("image/")
                                          : isImage(String(rawValue))
                                      ) ? (
                                        <img
                                          src={
                                            rawValue
                                              ? getFullImageUrl(rawValue)
                                              : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                                          }
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <Lucide
                                          icon="File"
                                          className="w-8 h-8 text-slate-400"
                                        />
                                      )}
                                      <span className="text-xs truncate max-w-[150px]">
                                        {isFile
                                          ? (rawValue as File).name
                                          : String(rawValue).split("/").pop()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              content = (
                                <FormInput
                                  type="text"
                                  className="min-w-[120px] py-1 px-2 text-sm border-slate-300 focus:border-primary"
                                  value={String(rawValue)}
                                  onChange={(e) =>
                                    handleInlineChange(
                                      compositeKey,
                                      e.target.value
                                    )
                                  }
                                />
                              );
                            }
                          } else {
                            // VIEW MODE (Not Editing)
                            if (rawValue === "" || rawValue === "-") {
                              content = "-";
                            } else {
                              const isHtml =
                                typeof rawValue === "string" &&
                                /<\/?[a-z][\s\S]*>/i.test(rawValue);

                              if (isHtml) {
                                content = (
                                  <a
                                    onClick={() => {
                                      setReportHtml(String(rawValue));
                                      setOpenReport(true);
                                    }}
                                    className="text-primary font-bold cursor-pointer hover:underline"
                                  >
                                    {t("ViewReport")}
                                  </a>
                                );
                              } else if (
                                matchingParam?.field_type === "image" ||
                                isImage(String(rawValue))
                              ) {
                                content = (
                                  <img
                                    src={getFullImageUrl(String(rawValue))}
                                    className="w-16 h-16 object-cover rounded cursor-pointer border"
                                    onClick={() =>
                                      setModalImageUrl(
                                        getFullImageUrl(String(rawValue))
                                      )
                                    }
                                  />
                                );
                              } else if (isVideo(String(rawValue))) {
                                content = (
                                  <div
                                    className="w-16 h-16 bg-black rounded flex items-center justify-center cursor-pointer"
                                    onClick={() =>
                                      setModalVideoUrl(
                                        getFullImageUrl(String(rawValue))
                                      )
                                    }
                                  >
                                    <Lucide
                                      icon="Play"
                                      className="text-white w-6 h-6"
                                    />
                                  </div>
                                );
                              } else {
                                content = String(rawValue);
                              }
                            }
                          }

                          processedCells.push(
                            <td
                              key={currentDate.date}
                              className={clsx("px-4 py-2 border align-middle", {
                                "bg-blue-50/20": isEditingThisColumn,
                              })}
                            >
                              {content}
                            </td>
                          );
                          i++;
                        } else {
                          // Scheduled Logic
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
                            )
                              mergeCount++;
                            else break;
                          }
                          if (rowIndex === 0) {
                            processedCells.push(
                              <td
                                key={`sched-${currentDate.date}`}
                                colSpan={mergeCount}
                                rowSpan={totalRows}
                                className="px-4 py-2 border text-center bg-yellow-50 align-middle"
                              >
                                <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs font-medium block">
                                  {t("Scheduled")}
                                  <br />
                                  {new Date(
                                    String(scheduledDate)
                                  ).toLocaleDateString()}
                                </span>
                              </td>
                            );
                          }
                          i += mergeCount;
                        }
                      }

                      return (
                        <tr
                          key={name}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-2 border font-medium text-slate-700">
                            {name}
                          </td>
                          <td className="px-4 py-2 border text-slate-500 text-xs">
                            {details.normal_range}
                          </td>
                          <td className="px-4 py-2 border text-slate-500 text-xs">
                            {details.units}
                          </td>
                          {processedCells}
                        </tr>
                      );
                    }
                  );

                  // --- NOTES ROW ---
                  let noteCells = [];
                  let j = 0;
                  while (j < uniqueDates.length) {
                    const currentDate = uniqueDates[j];
                    const isVisible =
                      !currentDate.scheduled_date ||
                      new Date(currentDate.scheduled_date) <= new Date();

                    if (isVisible) {
                      const notesForThisReport = reportNotes.filter(
                        (n) =>
                          String(n.reportId) === String(currentDate.report_id)
                      );
                      const latestNote = notesForThisReport[0];

                      noteCells.push(
                        <td
                          key={`note-${currentDate.date}`}
                          className="px-4 py-2 border align-top bg-slate-50/50 min-w-[200px]"
                        >
                          <div className="flex flex-col gap-2">
                            {notesForThisReport.length > 0 ? (
                              <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <img
                                    src={
                                      latestNote.user_thumbnail
                                        ? getFullImageUrl(
                                            latestNote.user_thumbnail
                                          )
                                        : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                                    }
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                    alt="image"
                                  />
                                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                                    {latestNote.fname}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 italic line-clamp-2">
                                  "{latestNote.note}"
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-center block text-xs">
                                {t("No comments")}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                handleViewColumnNotes(
                                  notesForThisReport,
                                  Number(currentDate.report_id)
                                )
                              }
                              className="text-xs text-primary hover:underline self-start flex items-center gap-1"
                            >
                              <Lucide
                                icon="MessageSquare"
                                className="w-3 h-3"
                              />
                              {notesForThisReport.length > 0
                                ? t("ViewallComments")
                                : t("Add Comment")}
                            </button>
                          </div>
                        </td>
                      );
                      j++;
                    } else {
                      let mergeCount = 1;
                      while (j + mergeCount < uniqueDates.length) {
                        const nextDate = uniqueDates[j + mergeCount];
                        if (
                          !(
                            !nextDate.scheduled_date ||
                            new Date(nextDate.scheduled_date) <= new Date()
                          ) &&
                          nextDate.scheduled_date === currentDate.scheduled_date
                        ) {
                          mergeCount++;
                        } else break;
                      }
                      j += mergeCount;
                    }
                  }

                  renderedRows.push(
                    <tr key="notes-row" className="bg-slate-100">
                      <td className="px-4 py-2 border font-semibold text-primary">
                        {t("Comments")}
                      </td>
                      <td className="px-4 py-2 border">-</td>
                      <td className="px-4 py-2 border">-</td>
                      {noteCells}
                    </tr>
                  );

                  return renderedRows;
                })()}
              </tbody>
            </table>

            <div className="mt-8 border-t pt-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-3">
                {t("Patient Notes")}
              </h4>
              {patientNotes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {patientNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-50 border p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-gray-700">
                          {note.title}
                        </h5>
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{note.content}</p>
                      <div className="text-xs text-gray-400 mt-2 italic">
                        By: {note.doctor_name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {t("No notes recorded.")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PatientDetailTable;
