import React, { useEffect, useState, useRef } from "react";
import { FormInput, FormTextarea } from "@/components/Base/Form";
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

interface PatientNoteProps {
  data?: Patient;
}

interface Note {
  id: number;
  title: string;
  author: string;
  date: string;
  content: string;
  doctor_id: number;
}
interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  data?: Patient;
}

type EditorMode = "add" | "edit" | "view";

const PatientNote: React.FC<Component> = ({ data, onShowAlert }) => {
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

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);
    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);
    const currentDate = new Date();
    return currentDate > expirationDate;
  }

  useEffect(() => {
    const fetchNotes = async () => {
      if (!data?.id) return;
      try {
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));
        setCurrentUserId(userData.uid);
        setUserRole(userData.role);

        const fetchedNotes = await getPatientNotesAction(
          data.id,
          userData.orgid
        );

        if (userrole === "Admin") {
          setSubscriptionPlan(userData.planType);
          setPlanDate(userData.planDate);
        }

        const formattedNotes = fetchedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
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
      } catch (error) {
        console.error("Error loading patient notes:", error);
      }
    };

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
    const newErrors = { title: "", content: "" };
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
    setMode("view"); // This will be changed to "add" when needed
    setErrors({ title: "", content: "" });
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

  const handleAddNote = async () => {
    if (!validateForm() || !data?.id) return;
    setLoading(true);
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      const notePayload = {
        patient_id: data.id,
        sessionId: Number(sessionInfo.sessionId),
        title: noteTitle.trim(),
        content: noteInput.trim(),
        doctor_id: userData.uid,
        organisation_id: userData.orgid,
      };
      const savedNote = await addPatientNoteAction(notePayload);
      const newNote: Note = {
        id: savedNote.id,
        title: savedNote.title,
        content: savedNote.content,
        doctor_id: userData.uid,
        author: "You",
        date: new Date(savedNote.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      resetForm();
      setNotes([newNote, ...notes]);
      const socketData = {
        device_type: "App",
        notes: "update",
      };
      socket.current?.emit(
        "PlayAnimationEventEPR",
        JSON.stringify(socketData, null, 2),
        (ack: any) => {
          console.log("✅ ACK from server:", ack);
        }
      );

      const userData1 = await getAdminOrgAction(String(useremail));
      const payloadData = {
        title: `Note Added`,
        body: `A New Note (${savedNote.title}) Added by ${userData.username}`,
        created_by: userData.uid,
        patient_id: data.id,
      };
      if (sessionInfo && sessionInfo.sessionId) {
        await sendNotificationToAddNoteAction(
          payloadData,
          userData1.orgid,
          sessionInfo.sessionId
        );
      }
      resetForm();
      onShowAlert({ variant: "success", message: t("Noteaddedsuccessfully") });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to add patient note:", error);
      onShowAlert({ variant: "danger", message: t("Failedaddnote") });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    setLoading(true);
    if (!validateForm() || !selectedNote) return;
    try {
      await updatePatientNoteAction({
        id: selectedNote.id,
        title: noteTitle.trim(),
        content: noteInput.trim(),
        sessionId: Number(sessionInfo.sessionId),
      });
      const updatedNote: Note = {
        ...selectedNote,
        title: noteTitle.trim(),
        content: noteInput.trim(),
      };
      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id ? updatedNote : note
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
          sessionInfo.sessionId
        );
      }
      setNotes(updatedNotes);
      setSelectedNote(updatedNote);
      setMode("view");
      onShowAlert({
        variant: "success",
        message: t("Noteupdatedsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to update patient note:", error);
      onShowAlert({ variant: "danger", message: t("Failedupdatepatient") });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
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
      if (noteIdToDelete) {
        if (!data?.id) return;
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));
        setCurrentUserId(userData.uid);
        setUserRole(userData.role);

        await deletePatientNoteAction(
          noteIdToDelete,
          Number(sessionInfo.sessionId)
        );
        // const updatedNotes = await getPatientNotesAction(data.id,userData.orgid);

        // setNotes(updatedNotes);

        const fetchedNotes = await getPatientNotesAction(
          data.id,
          userData.orgid
        );

        // ✅ Apply same formatting as in useEffect
        const formattedNotes = fetchedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
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

        onShowAlert({
          variant: "success",
          message: t("Notedeletedsuccessfully"),
        });
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
                        setErrors({ title: "", content: "" });
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
                              setIsAdding(false);
                              setMode("edit");
                              setErrors({ title: "", content: "" });
                            }}
                          >
                            <Lucide
                              icon="CheckSquare"
                              className="w-4 h-4 text-blue-500"
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
                          {loading
                            ? "..."
                            : mode === "add"
                            ? t("SaveNote")
                            : t("UpdateNote")}
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
