import React, { useEffect, useState } from "react";
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
import { Dialog, Menu } from "@/components/Base/Headless";

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

const PatientNote: React.FC<Component> = ({ data, onShowAlert }) => {
  const userrole = localStorage.getItem("role");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!data?.id) return;

      try {
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));

        setCurrentUserId(userData.uid);
        setUserRole(userData.role);

        const fetchedNotes = await getPatientNotesAction(data.id);

        if (userrole === "Admin") {
          setSubscriptionPlan(userData.planType || "Free");
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

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: "",
      content: "",
    };

    if (!noteTitle.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    } else if (noteTitle.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      isValid = false;
    }

    if (!noteInput.trim()) {
      newErrors.content = "Note content is required";
      isValid = false;
    } else if (noteInput.trim().length < 10) {
      newErrors.content = "Note must be at least 10 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const canAddNote = () => {
    if (
      subscriptionPlan === "Free" &&
      notes.length >= 5 &&
      userrole === "Admin"
    ) {
      setShowUpsellModal(true);
      return false;
    }
    return true;
  };

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  const resetForm = () => {
    console.log("Resetting form...");
    setNoteInput("");
    setNoteTitle("");
    setSelectedNote(null);
    setIsAdding(true);
    setErrors({
      title: "",
      content: "",
    });
  };

  const handleAddNote = async () => {
    if (!canAddNote()) return;
    if (!validateForm() || !data?.id) return;
    setLoading(true);

    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const notePayload = {
        patient_id: data.id,
        title: noteTitle,
        content: noteInput,
        doctor_id: userData.uid,
      };

      const savedNote = await addPatientNoteAction(notePayload);

      

      const newNote: Note = {
        id: savedNote.id,
        title: savedNote.title,
        content: savedNote.content,
        doctor_id: savedNote.uid,
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

      const userEmail = localStorage.getItem("user");
      const userData1 = await getAdminOrgAction(String(userEmail));

      const facultiesIds = await getFacultiesByIdAction(
        Number(userData1.orgid)
      );
      await sendNotificationToAddNoteAction(facultiesIds, userData1.uid, [
        notePayload,
      ]);

      resetForm();
      onShowAlert({
        variant: "success",
        message: t("Noteaddedsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to add patient note:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedaddnote"),
      });
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
        title: noteTitle,
        content: noteInput,
      });

      const updatedNote: Note = {
        ...selectedNote,
        title: noteTitle,
        content: noteInput,
      };

      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id ? updatedNote : note
      );

      setNotes(updatedNotes);
      setSelectedNote(updatedNote);
      onShowAlert({
        variant: "success",
        message: t("Noteupdatedsuccessfully"),
      });

      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to update patient note:", error);
      onShowAlert({
        variant: "danger",
        message: t("Failedupdatepatient"),
      });

      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // note delete function

  const handleDeleteClick = (noteId: number) => {
    const noteToDelete = notes.find((note) => note.id === noteId);
    if (!noteToDelete) return;

    const isSuperadmin = userRole === "Superadmin";
    const isOwner = Number(currentUserId) === Number(noteToDelete.doctor_id);

    console.log({
      currentUserId,
      noteOwnerId: noteToDelete.doctor_id,
      userRole,
      isOwner,
    });

    if (isSuperadmin || isOwner) {
      setNoteIdToDelete(noteId);
      setDeleteConfirmationModal(true);
    } else {
      onShowAlert({
        variant: "danger",
        message: "You can only delete notes you have created.",
      });
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

        await deletePatientNoteAction(noteIdToDelete); // hard delete

        const updatedNotes = await getPatientNotesAction(data.id);
        setNotes(updatedNotes); // update state

        onShowAlert({
          variant: "success",
          message: "Note deleted successfully.",
        });
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      onShowAlert({ variant: "danger", message: "Failed to delete note." });
    } finally {
      setDeleteConfirmationModal(false);
      setNoteIdToDelete(null);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      {/* Note limit banner - responsive */}
      {subscriptionPlan === "Free" &&
        notes.length >= 5 &&
        userrole === "Admin" && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 sm:p-4 border border-indigo-300 rounded mb-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-base font-semibold text-indigo-900">
                  {t("Notelimitreached")}
                </h3>
                <p className="text-xs sm:text-sm text-indigo-700">
                  {t("Upgradetounlock")}{" "}
                </p>
              </div>
              <Button
                onClick={() => setShowUpsellModal(true)}
                variant="primary"
                size="sm"
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                {t("ViewPlans")}
              </Button>
            </div>
          </div>
        )}

      {/* Main container - responsive layout */}
      <div className="flex flex-col lg:flex-row h-full bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {/* Sidebar - responsive width and behavior */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-r border-gray-200">
          <div className="p-3 sm:p-4 space-y-3">
            {/* Add Note Button - responsive */}
            {!(subscriptionPlan === "Free" && notes.length >= 5) &&
              (userRole === "Admin" || userRole === "Faculty") && (
                <button
                  onClick={resetForm}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl transition-all bg-primary hover:bg-primary-dark text-white text-sm sm:text-base shadow-sm hover:shadow-md"
                >
                  <Lucide icon="Plus" className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("add_note")}
                </button>
              )}

            {/* Usage warning - responsive */}
            {subscriptionPlan === "Free" &&
              notes.length >= 3 &&
              notes.length < 5 &&
              userrole === "Admin" && (
                <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 flex items-start gap-2 border border-yellow-100">
                  <Lucide
                    icon="AlertTriangle"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">
                      {notes.length}
                      {t("5notesused")}
                    </p>
                    <button
                      onClick={() => setShowUpsellModal(true)}
                      className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                    >
                      {t("Upgradeunlimitednotes")}
                    </button>
                  </div>
                </div>
              )}

            {/* Search - responsive */}
            <div className="relative">
              <FormInput
                type="text"
                className="w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Lucide
                icon="Search"
                className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400"
              />
            </div>
          </div>

          {/* Notes list - responsive */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-3 sm:pb-4">
            {filteredNotes.length > 0 ? (
              <div className="space-y-2">
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
                        // if (userRole === "Admin" || userRole === "Superadmin") {
                        setIsAdding(false);
                        // }
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
                        {note.author}
                      </p>
                    </div>

                    {/* Delete Link Styled Like Archive */}
                    {(userRole === "Admin" ||
                      userRole === "Faculty" ||
                      userRole === "Superadmin") && (
                      <a
                        className="flex items-center text-danger cursor-pointer"
                        title="Delete note"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleDeleteClick(note.id);
                        }}
                      >
                        <Lucide
                          icon="Trash2"
                          className="w-4 h-4 text-red-500 cursor-pointer"
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
                <Lucide
                  icon="FileText"
                  className="w-8 sm:w-10 h-8 sm:h-10 text-gray-300 mb-3"
                />
                <p className="text-sm sm:text-base font-medium text-gray-500">
                  {t("no_notes_found")}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {subscriptionPlan === "Free" &&
                  notes.length >= 5 &&
                  userrole === "Admin"
                    ? "Upgrade to add more notes"
                    : "Create your first note"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Editor/Viewer - responsive */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-[50vh] lg:min-h-full">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {userRole === "Admin" || userRole === "Faculty" ? (
              <>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {isAdding ? t("add_new_note") : t("edit_note")}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {isAdding
                      ? "Create a new patient note"
                      : "Edit existing note"}
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("NoteTitle")}
                    </label>
                    <FormInput
                      type="text"
                      placeholder="e.g. Follow-up consultation"
                      className={`w-full rounded-lg text-xs sm:text-sm ${
                        errors.title ? "border-red-300" : "border-gray-200"
                      } focus:ring-1 focus:ring-primary`}
                      value={noteTitle}
                      onChange={(e) => {
                        setNoteTitle(e.target.value);
                        setErrors((prev) => ({ ...prev, title: "" }));
                      }}
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("NoteContent")}
                    </label>
                    <FormTextarea
                      rows={8}
                      className={`w-full rounded-lg text-xs sm:text-sm ${
                        errors.content ? "border-red-300" : "border-gray-200"
                      } focus:ring-1 focus:ring-primary`}
                      placeholder="Write your detailed notes here..."
                      value={noteInput}
                      onChange={(e) => {
                        setNoteInput(e.target.value);
                        setErrors((prev) => ({ ...prev, content: "" }));
                      }}
                    />
                    {errors.content && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.content}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-3">
                    <Button
                      variant="outline-primary"
                      onClick={resetForm}
                      disabled={loading}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={isAdding ? handleAddNote : handleUpdateNote}
                      disabled={loading}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm"
                    >
                      {loading ? (
                        <div className="loader">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      ) : isAdding ? (
                        t("SaveNote")
                      ) : (
                        t("UpdateNote")
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : selectedNote ? (
              <div>
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {selectedNote.title}
                  </h1>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs sm:text-sm text-gray-500">
                    <span>By {selectedNote.author}</span>
                    <span className="hidden xs:inline">•</span>
                    <span>{selectedNote.date}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-700 text-xs sm:text-sm leading-relaxed">
                  {selectedNote.content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Lucide
                  icon="FileText"
                  className="w-10 h-10 text-gray-300 mb-3"
                />
                <h3 className="text-sm sm:text-base font-medium text-gray-500">
                  {t("Nonoteselected")}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {t("Selectnotefromthesidebartoview")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/*start: delete model popup  */}
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
                  type="button"
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
                  type="button"
                  className="w-24"
                  onClick={handleDeleteNoteConfirm}
                >
                  {t("Delete")}
                </Button>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
        {/*end: delete model popup  */}

      </div>
    </>
  );
};

export default PatientNote;
