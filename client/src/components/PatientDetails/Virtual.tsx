import React, { useState } from "react";
import { t } from "i18next";
import clsx from "clsx";
import { FormSelect, FormLabel } from "@/components/Base/Form";

interface VirtualProps {
  patientId: number | string;
  onShowAlert?: (msg: string) => void;
}

const Virtual: React.FC<VirtualProps> = ({ patientId }) => {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ session?: string }>({});

  const sessions = [
    { label: "ECG Machine", value: "ecg" },
    { label: "ConMed System 5000", value: "conmed" },
    { label: "Ventilator Training", value: "ventilator" },
  ];

  const sessionMedia: Record<
    string,
    { type: "image" | "video"; src: string; poster?: string; title?: string }[]
  > = {
    ecg: [
      {
        type: "image",
        src: "https://via.placeholder.com/300x180?text=ECG+Machine+1",
      },
      {
        type: "image",
        src: "https://via.placeholder.com/300x180?text=ECG+Machine+2",
      },
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        poster: "https://via.placeholder.com/300x180?text=ECG+Training+Video",
        title: "ECG Training Video",
      },
    ],
    conmed: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        poster: "https://via.placeholder.com/300x180?text=ConMed+Intro",
        title: "Intro to ConMed System",
      },
      {
        type: "video",
        src: "https://www.w3schools.com/html/movie.mp4",
        poster: "https://via.placeholder.com/300x180?text=ConMed+Demo",
        title: "ConMed Demo",
      },
      {
        type: "image",
        src: "https://via.placeholder.com/300x180?text=Procedure+Mode",
      },
    ],
    ventilator: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        poster: "https://via.placeholder.com/300x180?text=Ventilator+Training",
        title: "Ventilator Basic Training",
      },
      {
        type: "image",
        src: "https://via.placeholder.com/300x180?text=Ventilator+1",
      },
    ],
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSession(value);
    setActiveVideo(null);
    if (!value) {
      setFormErrors({ session: t("Please select a test") });
    } else {
      setFormErrors({});
    }
  };

  return (
    <div className="p-5 border rounded-md shadow-sm bg-white">
      {/* Dropdown Section */}
      <div className="col-span-2 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FormLabel htmlFor="session" className="font-bold">
              {t("Select Test")}
            </FormLabel>
            <span className="md:hidden text-red-500 ml-1">*</span>
          </div>
          <span className="hidden md:flex text-xs text-gray-500 font-bold ml-2">
            {t("required")}
          </span>
        </div>

        <FormSelect
          id="session"
          name="session"
          value={selectedSession}
          onChange={handleSessionChange}
          className={`w-full mb-2 ${clsx({
            "border-danger": formErrors.session,
          })}`}
        >
          <option value="">{t("Select a Test")}</option>
          {sessions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FormSelect>

        {formErrors.session && (
          <p className="text-red-500 text-sm">{formErrors.session}</p>
        )}
      </div>

      {/* Media Grid */}
      {selectedSession && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {sessionMedia[selectedSession]?.map((media, index) => (
            <div
              key={`${media.type}-${index}`}
              className="relative border rounded-lg shadow-sm overflow-hidden bg-slate-50 hover:shadow-md transition duration-200"
            >
              {media.type === "image" ? (
                <img
                  src={media.src}
                  alt={`Media ${index + 1}`}
                  className="w-full h-48 object-cover cursor-pointer"
                />
              ) : activeVideo === media.src ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  poster={media.poster}
                  className="w-full h-48 object-cover"
                  onEnded={() => setActiveVideo(null)}
                >
                  <source src={media.src} type="video/mp4" />
                  {t("Your browser does not support the video tag.")}
                </video>
              ) : (
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setActiveVideo(media.src)}
                >
                  <img
                    src={media.poster || "https://via.placeholder.com/300x180"}
                    alt={media.title || `Video ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="white"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="white"
                      className="w-12 h-12 opacity-90"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.25v13.5l13.5-6.75L5.25 5.25z"
                      />
                    </svg>
                  </div>
                  <p className="absolute bottom-2 left-2 text-sm text-white font-semibold bg-black bg-opacity-50 px-2 rounded">
                    {media.title}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Virtual;
