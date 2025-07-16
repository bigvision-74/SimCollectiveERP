import React, { useEffect, useState } from "react";
import { FormInput, FormTextarea } from "@/components/Base/Form";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import {
  addPatientNoteAction,
  getPatientNotesAction,
  updatePatientNoteAction, // You must define this in your actions
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import Alerts from "@/components/Alert";

interface PatientNoteProps {
  data?: Patient;
}

interface Note {
  id: number;
  title: string;
  author: string;
  date: string;
  content: string;
}

const PatientNote: React.FC<PatientNoteProps> = ({ data }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!data?.id) return;

      try {
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));
        const fetchedNotes = await getPatientNotesAction(data.id);
        setUserRole(userData.role);

        const formattedNotes = fetchedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
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
        if (formattedNotes.length > 0) {
          setSelectedNote(formattedNotes[0]);
          setNoteTitle(formattedNotes[0].title);
          setNoteInput(formattedNotes[0].content);
          setIsAdding(false); // disable 'Add' mode
        }
      } catch (error) {
        console.error("Error loading patient notes:", error);
      }
    };

    fetchNotes();
  }, [data?.id]);

  const handleAddNote = async () => {
    if (!noteTitle || !noteInput || !data?.id) return;

    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));

      const savedNote = await addPatientNoteAction({
        patient_id: data.id,
        title: noteTitle,
        content: noteInput,
        doctor_id: userData.uid,
      });

      const newNote: Note = {
        id: savedNote.id,
        title: savedNote.title,
        content: savedNote.content,
        author: "You",
        date: new Date(savedNote.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setNotes([newNote, ...notes]);
      resetForm();
      setShowAlert({ variant: "success", message: "Note added successfully!" });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to add patient note:", error);
      setShowAlert({ variant: "danger", message: "Failed to add note." });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !noteTitle || !noteInput) return;

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
      setShowAlert({
        variant: "success",
        message: "Note update successfully!",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Failed to update patient note:", error);
      setShowAlert({
        variant: "danger",
        message: "Failed to update patient note",
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setNoteInput("");
    setNoteTitle("");
    setSelectedNote(null);
    setIsAdding(true);
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r p-4 bg-gray-100">
          {(userRole === "admin" || userRole === "Superadmin") && (
            <button
              onClick={resetForm}
              className="bg-primary text-white px-4 py-2 rounded mb-4 w-full"
            >
              {t("add_note")}
            </button>
          )}

          <input
            type="text"
            placeholder="Search"
            className="w-full mb-4 p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="space-y-2 overflow-y-auto max-h-[70vh]">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedNote?.id === note.id
                    ? "bg-white border border-blue-500"
                    : "bg-white"
                }`}
                onClick={() => {
                  setSelectedNote(note);
                  setNoteTitle(note.title);
                  setNoteInput(note.content);
                  if (userRole === "admin" || userRole === "Superadmin") {
                    setIsAdding(false); // Only set edit mode for admins
                  }
                }}
              >
                <p className="font-semibold">{note.title}</p>
                <p className="text-sm italic">{note.author}</p>
                <p className="text-xs text-gray-500">{note.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {isAdding ? t("add_new_note") : t("view_note")}
          </h2>

          {(userRole === "admin" || userRole === "Superadmin") && (
            <>
              <FormInput
                type="text"
                placeholder="Note title"
                className="w-full border p-2 mb-4 rounded"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />

              <FormTextarea
                rows={8}
                placeholder="Write your note here..."
                className="w-full border p-3 rounded"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
              />

              <button
                onClick={isAdding ? handleAddNote : handleUpdateNote}
                className="mt-4 bg-primary text-white px-4 py-2 rounded"
              >
                {isAdding ? "Save Note" : "Update Note"}
              </button>
            </>
          )}

          {userRole === "User" && selectedNote && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">{selectedNote.title}</h3>
              <p className="text-sm italic text-gray-600">
                By: {selectedNote.author}
              </p>
              <p className="text-xs text-gray-500">{selectedNote.date}</p>
              <p className="mt-2">{selectedNote.content}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientNote;
