import React, { useEffect, useState, useRef } from "react";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import {
  addPatientNoteAction,
  deletePatientNoteAction,
  getPatientNotesAction,
  updatePatientNoteAction,
} from "@/actions/patientActions";
import {
  getAdminOrgAction,
  getFacultiesByIdAction,
} from "@/actions/adminActions";
import Alerts from "@/components/Alert";
import Lucide from "../Base/Lucide";
import Button from "../Base/Button";
import SubscriptionModal from "../SubscriptionModal.tsx";
import { sendNotificationToAddNoteAction } from "@/actions/notificationActions";
import { Dialog } from "@/components/Base/Headless";
import { useAppContext } from "@/contexts/sessionContext";
import { io, Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "../UploadContext";
import { getUserOrgIdAction } from "@/actions/userActions";
import { uploadOrgUsedStorageAction } from "@/actions/organisationAction";
interface PatientNoteProps {
  data?: Patient;
}

interface Note {
  id: number;
  title: string;
  author: string;
  date: string;
  content: string;
  attachments: File | string | null;
  doctor_id: number;
}
interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  data?: Patient;
  onDataUpdate?: (
    category: string,
    action: "added" | "updated" | "deleted",
  ) => void;
}

type EditorMode = "add" | "edit" | "view";

const PatientNote: React.FC<Component> = ({
  data,
  onShowAlert,
  onDataUpdate,
}) => {
  const userrole = localStorage.getItem("role");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const [mode, setMode] = useState<EditorMode>("view");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const socket = useRef<Socket | null>(null);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { sessionInfo } = useAppContext();
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState("");
  const [attachments, setAttachments] = useState<File | undefined>(undefined);
  const [uploadStatus, setUploadStatus] = useState("");
  const { addTask, updateTask } = useUploads();

  const [baseStorage, setBaseStorage] = useState<number>(0);
  const [usedStorage, setUsedStorage] = useState<number>(0);

  // const { settings } = useAppSelector(selectSettings);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState({
    title: "",
    content: "",
    attachments: "",
  });
  const [loading, setLoading] = useState(false);

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);
    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);
    const currentDate = new Date();
    return currentDate > expirationDate;
  }

  const fetchNotes = async () => {
    if (!data?.id) return;
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setCurrentUserId(userData.uid);
      setUserRole(userData.role);

      const fetchedNotes = await getPatientNotesAction(data.id, userData.orgid);

      // if (userrole === "Admin") {
      setSubscriptionPlan(userData.planType);
      setPlanDate(userData.planDate);
      // }

      const formattedNotes = fetchedNotes.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        doctor_id: note.doctor_id,
        attachments: note.attachments,
        author:
          note.doctor_id === userData.uid
            ? "You"
            : `${note.doctor_fname || ""} ${note.doctor_lname || ""}`.trim() ||
              "Unknown",
        date: new Date(note.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error loading patient notes:", error);
    }
  };
  useEffect(() => {
    fetchNotes();
  }, [data?.id]);

  const isFreePlanLimitReached =
    subscriptionPlan === "free" &&
    notes.length >= 5 &&
    (userrole === "Admin" || userrole === "Faculty" || userrole === "User");

  const isPerpetualLicenseExpired =
    subscriptionPlan === "5 Year Licence" &&
    isPlanExpired(planDate) &&
    (userrole === "Admin" ||
      userrole === "Faculty" ||
      userrole === "User" ||
      userrole === "Observer");

  const validateForm = () => {
    let isValid = true;
    const newErrors = { title: "", content: "", attachments: "" };
    if (!noteTitle.trim()) {
      newErrors.title = t("Titlerequired");
      isValid = false;
    }
    // else if (noteTitle.trim().length < 3) {
    //   newErrors.title = t("Title3characters");
    //   isValid = false;
    // }
    if (!noteInput.trim()) {
      newErrors.content = t("Notecontentrequired");
      isValid = false;
    } else if (noteInput.trim().length < 10) {
      newErrors.content = t("Notemust10characters");
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const canAddNote = () => {
    if (isFreePlanLimitReached || isPerpetualLicenseExpired) {
      setShowUpsellModal(true);
      return false;
    }
    return true;
  };

  const closeUpsellModal = () => setShowUpsellModal(false);

  const resetForm = () => {
    setNoteInput("");
    setNoteTitle("");
    setSelectedNote(null);
    setIsAdding(true);
    setFileUrl("");
    setFileName("");
    setMode("view"); // This will be changed to "add" when needed
    setErrors({ title: "", content: "", attachments: "" });
  };

  const handleAddNoteClick = () => {
    if (!canAddNote()) return;
    resetForm();
    setMode("add"); // Set mode to add when the button is clicked
  };
  useEffect(() => {
    socket.current = io("wss://sockets.mxr.ai:5000", {
      transports: ["websocket"],
    });

    socket.current.on("connect", () => {
      console.log("Socket connected");
    });
    socket.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus(t("uploadedImg"));
      setErrors((prev) => ({ ...prev, attachments: "" }));

      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setAttachments(file);
      setErrors((prev) => ({ ...prev, attachments: "" }));
      return () => URL.revokeObjectURL(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const MAX_FILE_SIZE = 500000000;

    if (file) {
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml",
        "image/tiff",
        "image/x-icon",
        "image/heic",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          attachments: "Only PNG, JPG, JPEG, GIF, and WEBP images are allowed.",
        }));
        event.target.value = "";
        return;
      }
      console.log(MAX_FILE_SIZE, "MAX_FILE_SIZE");

      if (file.size > MAX_FILE_SIZE) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          attachments: `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        }));
        event.target.value = "";
        return;
      }

      if (file.type === "application/pdf") {
        setFileUrl(
          "https://inpatientsim.s3.us-east-2.amazonaws.com/image/Hi41-bGDu-image8.png",
        );
      } else {
        setFileUrl(URL.createObjectURL(file));
      }
      setSelectedFile(file.type);

      setFileName(file.name);
      setUploadStatus(t("uploadedImg"));
      setAttachments(file);
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      setErrors((prev) => ({ ...prev, attachments: "" }));

      return () => URL.revokeObjectURL(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddNote();
    }
  };

  const handleAddNote = async () => {
    if (!validateForm() || !data?.id) return;
    setLoading(true);

    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const notePayload = new FormData();
      notePayload.append("patient_id", String(data.id));
      notePayload.append("sessionId", String(sessionInfo.sessionId));
      notePayload.append("title", noteTitle.trim());
      notePayload.append("content", noteInput.trim());
      notePayload.append("doctor_id", String(userData.uid));
      notePayload.append("organisation_id", String(userData.orgid));

      if (attachments) {
        const fileSizeMB = Number(
          (attachments.size / (1024 * 1024)).toFixed(2),
        );

        await uploadOrgUsedStorageAction(fileSizeMB, userData.orgid);

        const data = await getPresignedApkUrlAction(
          attachments.name,
          attachments.type,
          attachments.size,
        );

        notePayload.append("attachments", data.url);

        const taskId = addTask(attachments, userData.username);
        await uploadFileAction(
          data.presignedUrl,
          attachments,
          taskId,
          updateTask,
        );
      }

      const savedNote = await addPatientNoteAction(notePayload);

      const newNote: Note = {
        id: savedNote.data.id,
        title: savedNote.data.title,
        attachments: savedNote.data.attachments,
        content: savedNote.data.content,
        doctor_id: userData.uid,
        author: "You",
        date: new Date(savedNote.data.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      resetForm();
      fetchNotes();

      const userData1 = await getAdminOrgAction(String(useremail));
      const payloadData = {
        title: `Note Added`,
        body: `A New Note (${savedNote.data.title}) Updated by ${userData.username}`,
        created_by: userData.uid,
        patient_id: data.id,
      };
      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData1.orgid,
          sessionInfo.sessionId,
        );
      }
      resetForm();
      onShowAlert({ variant: "success", message: t("Noteaddedsuccessfully") });
      setTimeout(() => setShowAlert(null), 3000);
      if (onDataUpdate) {
        onDataUpdate("Patient Note", "added");
      }
    } catch (error: any) {
      console.error("Failed to add patient note:", error);

      if (error?.response?.data) {
        const { message, remainingStorageMB } = error.response.data;
        const alertMessage = remainingStorageMB
          ? `${message} Only ${remainingStorageMB} MB remaining.`
          : message;

        onShowAlert({ variant: "danger", message: alertMessage });
      } else if (error?.message) {
        onShowAlert({ variant: "danger", message: error.message });
      } else {
        onShowAlert({ variant: "danger", message: t("Failedupdatepatient") });
      }

      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!validateForm() || !selectedNote) return;
    setLoading(true);
    try {
      let fileUrl: string | null = null;
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      if (attachments) {
        const fileSizeMB = Number(
          (attachments.size / (1024 * 1024)).toFixed(2),
        );

        await uploadOrgUsedStorageAction(fileSizeMB, userData.orgid);

        const data = await getPresignedApkUrlAction(
          attachments.name,
          attachments.type,
          attachments.size,
        );

        const taskId = addTask(attachments, userData.username);
        await uploadFileAction(
          data.presignedUrl,
          attachments,
          taskId,
          updateTask,
        );

        fileUrl = data.url;
      }

      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");

      const formData = new FormData();
      formData.append("title", noteTitle.trim());
      formData.append("content", noteInput.trim());
      formData.append("sessionId", String(sessionInfo.sessionId));
      formData.append("attachments", fileUrl ?? "");
      formData.append("addedBy", data1.id);

      await updatePatientNoteAction(String(selectedNote.id), formData);

      const updatedNote: Note = {
        ...selectedNote,
        title: noteTitle.trim(),
        content: noteInput.trim(),
        attachments: fileUrl ?? selectedNote.attachments ?? null,
      };

      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id ? updatedNote : note,
      );
      const userEmail = localStorage.getItem("user");
      const userData1 = await getAdminOrgAction(String(userEmail));

      const payloadData = {
        title: `Note Updated`,
        body: `A Note (${noteTitle}) updated by ${userData1.username}`,
        created_by: userData1.uid,
        patient_id: data?.id,
      };

      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData1.orgid,
          sessionInfo.sessionId,
        );
      }

      setNotes(updatedNotes);
      setSelectedNote(updatedNote);
      setMode("view");

      onShowAlert({
        variant: "success",
        message: t("Noteupdatedsuccessfully"),
      });

      if (onDataUpdate) {
        onDataUpdate("Patient Note", "updated");
      }
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error: any) {
      console.error("Failed to update patient note:", error);

      if (error?.response?.data) {
        const { message, remainingStorageMB } = error.response.data;
        const alertMessage = remainingStorageMB
          ? `${message} Only ${remainingStorageMB} MB remaining.`
          : message;

        onShowAlert({ variant: "danger", message: alertMessage });
      } else if (error?.message) {
        onShowAlert({ variant: "danger", message: error.message });
      } else {
        onShowAlert({ variant: "danger", message: t("Failedupdatepatient") });
      }

      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note?.title?.toLowerCase().includes(searchTerm?.toLowerCase()),
  );

  const handleDeleteClick = (noteId: number) => {
    const noteToDelete = notes.find((note) => note.id === noteId);
    if (!noteToDelete) return;
    const isSuperadmin = userRole === "Superadmin";
    const isOwner = Number(currentUserId) === Number(noteToDelete.doctor_id);
    if (isSuperadmin || isOwner) {
      setNoteIdToDelete(noteId);
      setDeleteConfirmationModal(true);
    } else {
      onShowAlert({ variant: "danger", message: t("Youcanonly") });
    }
  };

  const handleDeleteNoteConfirm = async () => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      if (noteIdToDelete) {
        if (!data?.id) return;
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));
        setCurrentUserId(userData.uid);
        setUserRole(userData.role);

        await deletePatientNoteAction(
          noteIdToDelete,
          Number(sessionInfo.sessionId),
          data1.id,
        );

        const fetchedNotes = await getPatientNotesAction(
          data.id,
          userData.orgid,
        );

        const formattedNotes = fetchedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          attachments: note.attachments,
          doctor_id: note.doctor_id,
          author:
            note.doctor_id === userData.uid
              ? "You"
              : `${note.doctor_fname || ""} ${
                  note.doctor_lname || ""
                }`.trim() || "Unknown",
          date: new Date(note.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setNotes(formattedNotes);

        const payloadData = {
          title: `Note Deleted`,
          body: `A Note is deleted by ${userData.username}`,
          created_by: userData.uid,
          patient_id: data.id,
        };
        if (sessionInfo && sessionInfo.sessionId) {
          await sendNotificationToAddNoteAction(
            payloadData,
            userData.orgid,
            sessionInfo.sessionId,
          );
        }

        onShowAlert({
          variant: "success",
          message: t("Notedeletedsuccessfully"),
        });
        if (onDataUpdate) {
          onDataUpdate("Patient Note", "deleted");
        }
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      onShowAlert({ variant: "danger", message: t("Faileddeletenote") });
    } finally {
      setDeleteConfirmationModal(false);
      setNoteIdToDelete(null);
    }
  };

  // Check if user is Superadmin
  const isSuperadmin = userRole === "Superadmin";

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      {/* Sidebar */}
      {(isFreePlanLimitReached || isPerpetualLicenseExpired) && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-300 rounded mb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-indigo-900">
                {t("Notelimitreached")}
              </h3>
              <p className="text-sm text-indigo-700">{t("Upgradetounlock")}</p>
            </div>
            <Button
              onClick={() => setShowUpsellModal(true)}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              {t("ViewPlans")}
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row h-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-r border-gray-200">
          <div className="p-3 sm:p-4 space-y-3">
            {/* Add Note Button - Hidden for Superadmin */}
            {!isSuperadmin &&
              !(isFreePlanLimitReached || isPerpetualLicenseExpired) &&
              (userRole === "Admin" ||
                userRole === "Faculty" ||
                userRole === "User") && (
                <button
                  onClick={handleAddNoteClick} // Changed from resetForm to handleAddNoteClick
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg transition-all bg-primary hover:bg-primary-dark text-white text-sm shadow-sm hover:shadow-md"
                >
                  <Lucide icon="Plus" className="w-4 h-4" />
                  {t("add_note")}
                </button>
              )}

            {/* Search */}
            <div className="relative">
              <FormInput
                type="text"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Lucide
                icon="Search"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              />
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-3 sm:pb-4">
            {filteredNotes.length > 0 ? (
              <div
                className={`space-y-2 ${
                  filteredNotes.length > 5
                    ? "max-h-80 overflow-y-auto pr-1"
                    : ""
                }`}
              >
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all flex justify-between items-start gap-2 ${
                      selectedNote?.id === note.id
                        ? "bg-primary-50/60 border border-primary-100 shadow-xs"
                        : "hover:bg-gray-50/80 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div
                      className="flex-1"
                      onClick={() => {
                        setSelectedNote(note);
                        setNoteTitle(note.title);
                        setNoteInput(note.content);
                        setMode("view");
                        setErrors({ title: "", content: "", attachments: "" });
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-gray-900 line-clamp-1 pr-2 text-xs sm:text-sm">
                          {note.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {window.innerWidth < 640
                            ? note.date.split(",")[0]
                            : note.date}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {t("created_by")}: {note.author}
                      </p>
                    </div>

                    {/* Edit/Delete buttons - Hidden for Superadmin */}
                    {!isSuperadmin &&
                      (userRole === "Admin" ||
                        userRole === "Faculty" ||
                        userRole === "User") && (
                        <>
                          <a
                            className="flex items-center text-primary cursor-pointer"
                            title={t("edit")}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedNote(note);
                              setNoteTitle(note.title);
                              setNoteInput(note.content);
                              setFileUrl(
                                note?.attachments
                                  ? String(note.attachments)
                                  : "",
                              );
                              setIsAdding(false);
                              setMode("edit");
                              setErrors({
                                title: "",
                                content: "",
                                attachments: "",
                              });
                            }}
                          >
                            <Lucide
                              icon="CheckSquare"
                              className="w-4 h-4 text-primary"
                            />
                          </a>
                          <a
                            className="text-danger cursor-pointer"
                            title="Delete note"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteClick(note.id);
                            }}
                          >
                            <Lucide
                              icon="Trash2"
                              className="w-4 h-4 text-red-500"
                            />
                          </a>
                        </>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Lucide
                  icon="FileText"
                  className="w-8 h-8 text-gray-300 mb-3"
                />
                <p className="text-sm font-medium text-gray-500">
                  {t("no_notes_found")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor/Viewer */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4">
            {userRole === "Admin" ||
            userRole === "Faculty" ||
            userRole === "User" ||
            userRole === "Superadmin" ? (
              mode === "view" ? (
                selectedNote ? (
                  <div>
                    <div className="mb-4 border-b border-gray-200">
                      <h1 className="text-lg font-bold">
                        {selectedNote.title}
                      </h1>
                      <div className="text-xs text-gray-500">
                        By {selectedNote.author} • {selectedNote.date}
                      </div>
                    </div>
                    {/* // In the view mode section, replace the current attachments display with this: */}
                    {selectedNote?.attachments && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          {t("Attachments")}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {(() => {
                            const attachment = selectedNote.attachments;

                            // If attachment is a File object (during editing/adding)
                            if (attachment instanceof File) {
                              if (attachment.type.startsWith("image/")) {
                                return (
                                  <div className="relative group">
                                    <img
                                      src={URL.createObjectURL(attachment)}
                                      alt="Attachment"
                                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                                    />
                                    <a
                                      href={URL.createObjectURL(attachment)}
                                      download={attachment.name}
                                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all rounded-lg"
                                    >
                                      <Lucide
                                        icon="Download"
                                        className="w-5 h-5 text-white opacity-0 group-hover:opacity-100"
                                      />
                                    </a>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <Lucide
                                      icon="File"
                                      className="w-6 h-6 text-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-700 truncate">
                                        {attachment.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(
                                          attachment.size /
                                          (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB
                                      </p>
                                    </div>
                                    <a
                                      href={URL.createObjectURL(attachment)}
                                      download={attachment.name}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Lucide
                                        icon="Download"
                                        className="w-4 h-4"
                                      />
                                    </a>
                                  </div>
                                );
                              }
                            }

                            // If attachment is a URL string (from database)
                            if (typeof attachment === "string") {
                              const fileName =
                                attachment.split("/").pop() || "file";
                              const isImage =
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                  fileName,
                                );

                              if (isImage) {
                                return (
                                  <div className="relative group">
                                    <img
                                      src={attachment}
                                      alt="Attachment"
                                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                                      onError={(e) => {
                                        // If image fails to load, show file icon instead
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <a
                                      href={attachment}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all rounded-lg"
                                    >
                                      <Lucide
                                        icon="ExternalLink"
                                        className="w-5 h-5 text-white opacity-0 group-hover:opacity-100"
                                      />
                                    </a>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <Lucide
                                      icon="File"
                                      className="w-6 h-6 text-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-700 truncate">
                                        {fileName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {t("Document")}
                                      </p>
                                    </div>
                                    <a
                                      href={attachment}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Lucide
                                        icon="ExternalLink"
                                        className="w-4 h-4"
                                      />
                                    </a>
                                  </div>
                                );
                              }
                            }

                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-gray-700 text-sm">
                      {selectedNote.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Lucide
                      icon="FileText"
                      className="w-10 h-10 text-gray-300 mb-3"
                    />
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("Nonoteselected")}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("Selectnotefromthesidebartoview")}
                    </p>
                  </div>
                )
              ) : (
                // Edit/Add mode - Hidden for Superadmin
                !isSuperadmin && (
                  <>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold">
                        {mode === "add" ? t("add_new_note") : t("edit_note")}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t("NoteTitle")}
                        </label>
                        <FormInput
                          type="text"
                          placeholder="e.g. Follow-up consultation"
                          className={`w-full rounded-lg text-xs ${
                            errors.title ? "border-red-300" : "border-gray-200"
                          }`}
                          value={noteTitle}
                          onChange={(e) => {
                            setNoteTitle(e.target.value);
                            setErrors((p) => ({ ...p, title: "" }));
                          }}
                        />
                        {errors.title && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-xs">{t("document")}</label>
                      </div>

                      <div
                        className={`relative w-full mb-2 p-4 border-2 ${
                          errors.attachments
                            ? "border-dotted border-danger"
                            : "border-dotted border-gray-300"
                        } rounded flex items-center justify-center h-32 overflow-hidden bg-white cursor-pointer dropzone dark:bg-[#272a31]`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <input
                          id="crud-form-6"
                          type="file"
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                          onKeyDown={(e) => handleKeyDown(e)}
                        />

                        <label
                          htmlFor="crud-form-6"
                          className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                            fileUrl
                              ? "top-2 mb-1"
                              : "top-1/2 transform -translate-y-1/2"
                          }`}
                        >
                          {fileName
                            ? `${t("selected")} ${fileName}`
                            : t("drop")}
                        </label>

                        {fileUrl && (
                          <>
                            {selectedFile === "application/pdf" ? (
                              <img
                                src="https://inpatientsim.s3.us-east-2.amazonaws.com/image/Hi41-bGDu-image8.png"
                                alt="PDF Placeholder"
                                className="absolute inset-0 w-full h-full object-contain preview-image"
                              />
                            ) : (
                              <img
                                src={fileUrl}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-contain preview-image"
                              />
                            )}
                          </>
                        )}
                      </div>

                      {errors.attachments && (
                        <p className="text-red-500 text-sm">
                          {errors.attachments}
                        </p>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t("NoteContent")}
                        </label>
                        <FormTextarea
                          rows={8}
                          className={`w-full rounded-lg text-xs ${
                            errors.content
                              ? "border-red-300"
                              : "border-gray-200"
                          }`}
                          placeholder="Write your detailed notes here..."
                          value={noteInput}
                          onChange={(e) => {
                            setNoteInput(e.target.value);
                            setErrors((p) => ({ ...p, content: "" }));
                          }}
                        />
                        {errors.content && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.content}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline-primary"
                          onClick={() => {
                            resetForm();
                            setMode("view");
                          }}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs"
                        >
                          {t("Cancel")}
                        </Button>
                        <Button
                          variant="primary"
                          onClick={
                            mode === "add" ? handleAddNote : handleUpdateNote
                          }
                          disabled={loading}
                          className="px-3 py-1.5 text-xs"
                        >
                          {loading ? (
                            <div className="loader">
                              <div className="dot"></div>
                              <div className="dot"></div>
                              <div className="dot"></div>
                            </div>
                          ) : mode === "add" ? (
                            t("SaveNote")
                          ) : (
                            t("UpdateNote")
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Lucide
                  icon="FileText"
                  className="w-10 h-10 text-gray-300 mb-3"
                />
                <h3 className="text-sm font-medium text-gray-500">
                  {t("Nonoteselected")}
                </h3>
              </div>
            )}
          </div>
        </div>

        {/* Delete modal */}
        {deleteConfirmationModal && (
          <Dialog
            open={deleteConfirmationModal}
            onClose={() => setDeleteConfirmationModal(false)}
          >
            <Dialog.Panel>
              <div className="p-5 text-center">
                <Lucide
                  icon="Trash2"
                  className="w-16 h-16 mx-auto mt-3 text-danger"
                />
                <div className="mt-5 text-3xl">{t("Sure")}</div>
                <div className="mt-2 text-slate-500">{t("ReallyDelete")}</div>
              </div>
              <div className="px-5 pb-8 text-center">
                <Button
                  variant="outline-secondary"
                  className="w-24 mr-4"
                  onClick={() => {
                    setDeleteConfirmationModal(false);
                    setNoteIdToDelete(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="danger"
                  className="w-24"
                  onClick={handleDeleteNoteConfirm}
                >
                  {t("Delete")}
                </Button>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default PatientNote;
