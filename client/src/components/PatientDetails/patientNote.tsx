// import React, { useEffect, useState } from "react";
// import { FormInput, FormTextarea } from "@/components/Base/Form";
// import { t } from "i18next";
// import { Patient } from "@/types/patient";
// import {
//   addPatientNoteAction,
//   getPatientNotesAction,
//   updatePatientNoteAction,
// } from "@/actions/patientActions";
// import { getAdminOrgAction } from "@/actions/adminActions";
// import Alerts from "@/components/Alert";
// import Lucide from "../Base/Lucide";
// import Button from "../Base/Button";
// import SubscriptionModal from "../SubscriptionModal.tsx";

// interface PatientNoteProps {
//   data?: Patient;
// }

// interface Note {
//   id: number;
//   title: string;
//   author: string;
//   date: string;
//   content: string;
// }

// const PatientNote: React.FC<PatientNoteProps> = ({ data }) => {
//   const userrole = localStorage.getItem("role");
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [selectedNote, setSelectedNote] = useState<Note | null>(null);
//   const [noteInput, setNoteInput] = useState("");
//   const [noteTitle, setNoteTitle] = useState("");
//   const [isAdding, setIsAdding] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [userRole, setUserRole] = useState("");
//   const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
//   const [showUpsellModal, setShowUpsellModal] = useState(false);
//   const [showAlert, setShowAlert] = useState<{
//     variant: "success" | "danger";
//     message: string;
//   } | null>(null);
//   const [errors, setErrors] = useState({
//     title: "",
//     content: "",
//   });
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchNotes = async () => {
//       if (!data?.id) return;

//       try {
//         const useremail = localStorage.getItem("user");
//         const userData = await getAdminOrgAction(String(useremail));
//         const fetchedNotes = await getPatientNotesAction(data.id);
//         setUserRole(userData.role);
//         if (userrole === "Admin") {
//           setSubscriptionPlan(userData.planType || "Free");
//         }
//         const formattedNotes = fetchedNotes.map((note: any) => ({
//           id: note.id,
//           title: note.title,
//           content: note.content,
//           author:
//             note.doctor_id === userData.uid
//               ? "You"
//               : `${note.doctor_fname || ""} ${
//                   note.doctor_lname || ""
//                 }`.trim() || "Unknown",
//           date: new Date(note.created_at).toLocaleString("en-GB", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//         }));

//         setNotes(formattedNotes);
//         if (formattedNotes.length > 0) {
//           setSelectedNote(formattedNotes[0]);
//           setNoteTitle(formattedNotes[0].title);
//           setNoteInput(formattedNotes[0].content);
//           setIsAdding(false);
//         }
//       } catch (error) {
//         console.error("Error loading patient notes:", error);
//       }
//     };

//     fetchNotes();
//   }, [data?.id]);

//   const validateForm = () => {
//     let isValid = true;
//     const newErrors = {
//       title: "",
//       content: "",
//     };

//     if (!noteTitle.trim()) {
//       newErrors.title = "Title is required";
//       isValid = false;
//     } else if (noteTitle.trim().length < 3) {
//       newErrors.title = "Title must be at least 3 characters";
//       isValid = false;
//     }

//     if (!noteInput.trim()) {
//       newErrors.content = "Note content is required";
//       isValid = false;
//     } else if (noteInput.trim().length < 10) {
//       newErrors.content = "Note must be at least 10 characters";
//       isValid = false;
//     }

//     setErrors(newErrors);
//     return isValid;
//   };

//   const canAddNote = () => {
//     if (
//       subscriptionPlan === "Free" &&
//       notes.length >= 5 &&
//       userrole === "Admin"
//     ) {
//       setShowUpsellModal(true);
//       return false;
//     }
//     return true;
//   };

//   const closeUpsellModal = () => {
//     setShowUpsellModal(false);
//   };

//   const handleAddNote = async () => {
//     if (!canAddNote()) return;
//     if (!validateForm() || !data?.id) return;
//     setLoading(true);

//     try {
//       const useremail = localStorage.getItem("user");
//       const userData = await getAdminOrgAction(String(useremail));

//       const savedNote = await addPatientNoteAction({
//         patient_id: data.id,
//         title: noteTitle,
//         content: noteInput,
//         doctor_id: userData.uid,
//       });

//       const newNote: Note = {
//         id: savedNote.id,
//         title: savedNote.title,
//         content: savedNote.content,
//         author: "You",
//         date: new Date(savedNote.created_at).toLocaleString("en-GB", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "2-digit",
//           hour: "2-digit",
//           minute: "2-digit",
//         }),
//       };

//       setNotes([newNote, ...notes]);
//       resetForm();
//       setShowAlert({ variant: "success", message: "Note added successfully!" });
//       setTimeout(() => setShowAlert(null), 3000);
//     } catch (error) {
//       console.error("Failed to add patient note:", error);
//       setShowAlert({ variant: "danger", message: "Failed to add note." });
//       setTimeout(() => setShowAlert(null), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateNote = async () => {
//     setLoading(true);

//     if (!validateForm() || !selectedNote) return;

//     try {
//       await updatePatientNoteAction({
//         id: selectedNote.id,
//         title: noteTitle,
//         content: noteInput,
//       });

//       const updatedNote: Note = {
//         ...selectedNote,
//         title: noteTitle,
//         content: noteInput,
//       };

//       const updatedNotes = notes.map((note) =>
//         note.id === selectedNote.id ? updatedNote : note
//       );

//       setNotes(updatedNotes);
//       setSelectedNote(updatedNote);
//       setShowAlert({
//         variant: "success",
//         message: "Note updated successfully!",
//       });
//       setTimeout(() => setShowAlert(null), 3000);
//     } catch (error) {
//       console.error("Failed to update patient note:", error);
//       setShowAlert({
//         variant: "danger",
//         message: "Failed to update patient note",
//       });
//       setTimeout(() => setShowAlert(null), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setNoteInput("");
//     setNoteTitle("");
//     setSelectedNote(null);
//     setIsAdding(true);
//     setErrors({
//       title: "",
//       content: "",
//     });
//   };

//   const filteredNotes = notes.filter((note) =>
//     note.title.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <>
//       {showAlert && <Alerts data={showAlert} />}

//       <SubscriptionModal
//         isOpen={showUpsellModal}
//         onClose={closeUpsellModal}
//         currentPlan={subscriptionPlan}
//       />

//       {/* Keep the note limit section exactly as is */}
//       {subscriptionPlan === "Free" &&
//         notes.length >= 5 &&
//         userrole === "Admin" && (
//           <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-300 rounded mb-3">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="font-semibold text-indigo-900">
//                   Note limit reached
//                 </h3>
//                 <p className="text-sm text-indigo-700">
//                   Upgrade to unlock unlimited notes and premium features
//                 </p>
//               </div>
//               <Button
//                 onClick={() => setShowUpsellModal(true)}
//                 variant="primary"
//                 size="sm"
//                 className="whitespace-nowrap"
//               >
//                 View Plans
//               </Button>
//             </div>
//           </div>
//         )}

//       <div className="flex h-full bg-white rounded-xl overflow-hidden shadow-sm box">
//         {/* Left Sidebar - Notes List */}
//         <div className="w-full md:w-96 flex flex-col border-r border-gray-100">
//           <div className="p-5 space-y-4">
//             {!(subscriptionPlan === "Free" && notes.length >= 5) &&
//               (userRole === "Admin" || userRole === "Superadmin") && (
//                 <button
//                   onClick={resetForm}
//                   className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md"
//                 >
//                   <Lucide icon="Plus" className="w-5 h-5" />
//                   {t("add_note")}
//                 </button>
//               )}

//             {subscriptionPlan === "Free" &&
//               notes.length >= 3 &&
//               notes.length < 5 &&
//               userrole === "Admin" && (
//                 <div className="bg-yellow-50 rounded-lg p-3 flex items-start gap-2 border border-yellow-100">
//                   <Lucide
//                     icon="AlertTriangle"
//                     className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
//                   />
//                   <div>
//                     <p className="text-sm font-medium text-yellow-800">
//                       {notes.length}/5 notes used
//                     </p>
//                     <button
//                       onClick={() => setShowUpsellModal(true)}
//                       className="text-yellow-700 hover:text-yellow-900 text-xs font-medium underline"
//                     >
//                       Upgrade for unlimited notes
//                     </button>
//                   </div>
//                 </div>
//               )}

//             <div className="relative">
//               <FormInput
//                 type="text"
//                 className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
//                 placeholder="Search notes..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <Lucide
//                 icon="Search"
//                 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
//               />
//             </div>
//           </div>

//           <div className="flex-1 overflow-y-auto px-3 pb-5">
//             {filteredNotes.length > 0 ? (
//               <div className="space-y-2 px-2">
//                 {filteredNotes.map((note, index) => (
//                   <div
//                     key={note.id}
//                     className={`p-4 rounded-xl cursor-pointer transition-all ${
//                       selectedNote?.id === note.id
//                         ? "bg-primary-50/60 border border-primary-100 shadow-xs"
//                         : "hover:bg-gray-50/80 border border-transparent hover:border-gray-100"
//                     }`}
//                     onClick={() => {
//                       setSelectedNote(note);
//                       setNoteTitle(note.title);
//                       setNoteInput(note.content);
//                       if (userRole === "Admin" || userRole === "Superadmin") {
//                         setIsAdding(false);
//                       }
//                       setErrors({ title: "", content: "" });
//                     }}
//                   >
//                     <div className="flex justify-between items-start">
//                       <h3 className="font-medium text-gray-900 line-clamp-1 pr-2">
//                         {note.title}
//                       </h3>
//                       <span className="text-xs text-gray-500 whitespace-nowrap">
//                         {note.date}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-500 mt-1 line-clamp-2">
//                       {note.author}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full text-center p-6">
//                 <Lucide
//                   icon="FileText"
//                   className="w-10 h-10 text-gray-300 mb-3"
//                 />
//                 <p className="text-gray-500 font-medium">
//                   {t("no_notes_found")}
//                 </p>
//                 <p className="text-sm text-gray-400 mt-1">
//                   {subscriptionPlan === "Free" &&
//                   notes.length >= 5 &&
//                   userrole === "Admin"
//                     ? "Upgrade to add more notes"
//                     : "Create your first note"}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Panel - Note Editor/Viewer */}
//         <div className="flex-1 flex flex-col bg-gray-50/50">
//           <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
//             {userRole === "Admin" || userRole === "Superadmin" ? (
//               <>
//                 <div className="mb-8">
//                   <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                     {isAdding ? t("add_new_note") : t("edit_note")}
//                   </h2>
//                   <p className="text-gray-500">
//                     {isAdding
//                       ? "Create a new patient note"
//                       : "Edit existing note"}
//                   </p>
//                 </div>

//                 <div className="space-y-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Note Title
//                     </label>
//                     <FormInput
//                       type="text"
//                       placeholder="e.g. Follow-up consultation"
//                       className={`w-full rounded-lg ${
//                         errors.title ? "border-red-300" : "border-gray-200"
//                       } focus:ring-1 focus:ring-primary`}
//                       value={noteTitle}
//                       onChange={(e) => {
//                         setNoteTitle(e.target.value);
//                         setErrors((prev) => ({ ...prev, title: "" }));
//                       }}
//                     />
//                     {errors.title && (
//                       <p className="mt-2 text-sm text-red-600">
//                         {errors.title}
//                       </p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Note Content
//                     </label>
//                     <FormTextarea
//                       rows={14}
//                       placeholder="Write your detailed notes here..."
//                       className={`w-full rounded-lg ${
//                         errors.content ? "border-red-300" : "border-gray-200"
//                       } focus:ring-1 focus:ring-primary`}
//                       value={noteInput}
//                       onChange={(e) => {
//                         setNoteInput(e.target.value);
//                         setErrors((prev) => ({ ...prev, content: "" }));
//                       }}
//                     />
//                     {errors.content && (
//                       <p className="mt-2 text-sm text-red-600">
//                         {errors.content}
//                       </p>
//                     )}
//                   </div>

//                   <div className="flex justify-end gap-3 pt-4">
//                     <Button
//                       variant="outline-primary"
//                       onClick={resetForm}
//                       disabled={loading}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       variant="primary"
//                       onClick={isAdding ? handleAddNote : handleUpdateNote}
//                       disabled={loading}
//                     >
//                       {isAdding ? "Save Note" : "Update Note"}
//                     </Button>
//                   </div>
//                 </div>
//               </>
//             ) : selectedNote ? (
//               <div className="prose max-w-none">
//                 <div className="mb-8 pb-6 border-b border-gray-200">
//                   <h1 className="text-2xl font-bold text-gray-900 mb-2">
//                     {selectedNote.title}
//                   </h1>
//                   <div className="flex items-center gap-4 text-gray-500">
//                     <span>By {selectedNote.author}</span>
//                     <span>•</span>
//                     <span>{selectedNote.date}</span>
//                   </div>
//                 </div>
//                 <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
//                   {selectedNote.content}
//                 </div>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full text-center">
//                 <Lucide
//                   icon="FileText"
//                   className="w-12 h-12 text-gray-300 mb-4"
//                 />
//                 <h3 className="text-lg font-medium text-gray-500">
//                   No note selected
//                 </h3>
//                 <p className="text-gray-400 mt-2">
//                   Select a note from the sidebar to view
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default PatientNote;

import React, { useEffect, useState } from "react";
import { FormInput, FormTextarea } from "@/components/Base/Form";
import { t } from "i18next";
import { Patient } from "@/types/patient";
import {
  addPatientNoteAction,
  getPatientNotesAction,
  updatePatientNoteAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import Alerts from "@/components/Alert";
import Lucide from "../Base/Lucide";
import Button from "../Base/Button";
import SubscriptionModal from "../SubscriptionModal.tsx";

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
        const fetchedNotes = await getPatientNotesAction(data.id);
        setUserRole(userData.role);
        if (userrole === "Admin") {
          setSubscriptionPlan(userData.planType || "Free");
        }
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
          setIsAdding(false);
        }
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

  const handleAddNote = async () => {
    if (!canAddNote()) return;
    if (!validateForm() || !data?.id) return;
    setLoading(true);

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

  const resetForm = () => {
    setNoteInput("");
    setNoteTitle("");
    setSelectedNote(null);
    setIsAdding(true);
    setErrors({
      title: "",
      content: "",
    });
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  Note limit reached
                </h3>
                <p className="text-xs sm:text-sm text-indigo-700">
                  Upgrade to unlock unlimited notes and premium features
                </p>
              </div>
              <Button
                onClick={() => setShowUpsellModal(true)}
                variant="primary"
                size="sm"
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                View Plans
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
              (userRole === "Admin" || userRole === "Superadmin") && (
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
                      {notes.length}/5 notes used
                    </p>
                    <button
                      onClick={() => setShowUpsellModal(true)}
                      className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                    >
                      Upgrade for unlimited notes
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
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all ${
                      selectedNote?.id === note.id
                        ? "bg-primary-50/60 border border-primary-100 shadow-xs"
                        : "hover:bg-gray-50/80 border border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedNote(note);
                      setNoteTitle(note.title);
                      setNoteInput(note.content);
                      if (userRole === "Admin" || userRole === "Superadmin") {
                        setIsAdding(false);
                      }
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
            {userRole === "Admin" || userRole === "Superadmin" ? (
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
                      Note Title
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
                      Note Content
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
                      Cancel
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
                        "Save Note"
                      ) : (
                        "Update Note"
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
                  No note selected
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Select a note from the sidebar to view
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientNote;
