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

  useEffect(() => {
    const fetchNotes = async () => {
      if (!data?.id) return;

      try {
        const useremail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(useremail));
        const fetchedNotes = await getPatientNotesAction(data.id);

        const formattedNotes = fetchedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
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
        setIsAdding(true); // Always start in "Add Note" mode
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
    } catch (error) {
      console.error("Failed to add patient note:", error);
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
    } catch (error) {
      console.error("Failed to update patient note:", error);
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
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r p-4 bg-gray-100">
        <button
          onClick={resetForm}
          className="bg-primary text-white px-4 py-2 rounded mb-4 w-full"
        >
          {t("add_note")}
        </button>

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
                setIsAdding(false);
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
          {isAdding ? t("add_new_note") : t("view/edit_note")}
        </h2>

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
      </div>
    </div>
  );
};

export default PatientNote;
