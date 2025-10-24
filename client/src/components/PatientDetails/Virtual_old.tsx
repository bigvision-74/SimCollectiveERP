import React, { useState, useEffect, useRef } from "react";
import { t } from "i18next";
import clsx from "clsx";
import io, { Socket } from "socket.io-client";
import { FormSelect, FormLabel } from "@/components/Base/Form";
import { getAdminOrgAction } from "@/actions/adminActions";
import { useLocation } from "react-router-dom";

interface VirtualProps {
  patientId: number | string;
  onShowAlert?: (msg: string) => void;
}

const Virtual: React.FC<VirtualProps> = ({ patientId }) => {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ session?: string }>({});
  const [socketStatus, setSocketStatus] = useState<string>("Not connected");

  const socketRef = useRef<Socket | null>(null);
  const userEmailRef = useRef<string>("");

  const location = useLocation();
  const sessionId = location.state?.sessionId;

  console.log(sessionId,"sessionId");

  // ✅ 1️⃣ Establish socket connection once
  useEffect(() => {
    const connectSocket = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        if (!userEmail) {
          console.error("❌ No user found in localStorage");
          setSocketStatus("Error: No user found");
          return;
        }

        const userData = await getAdminOrgAction(String(userEmail));
        const finalEmail = userData?.uemail || userEmail;
        userEmailRef.current = finalEmail;

        const socket = io("http://localhost:5000", {
          transports: ["websocket"],
          auth: { userEmail: finalEmail },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("✅ Socket connected:", socket.id);
          setSocketStatus(`Connected: ${socket.id}`);
        });

        socket.on("connect_error", (err) => {
          console.error("❌ Socket connection error:", err.message);
          setSocketStatus(`Error: ${err.message}`);
        });

        socket.on("disconnect", () => {
          console.warn("🔌 Socket disconnected");
          setSocketStatus("Disconnected");
        });

        socket.on("video:selected:confirm", (data) => {
          console.log("📡 Server confirmation:", data);
        });
      } catch (error) {
        console.error("❌ Error fetching user or connecting socket:", error);
        setSocketStatus("Error: Failed to connect socket");
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [patientId]);

  // ✅ 2️⃣ Sessions and media
  const sessions = [
    { label: "ECG Machine", value: "ecg" },
    { label: "ConMed System 5000", value: "conmed" },
    { label: "Ventilator Training", value: "ventilator" },
    { label: "Diabetic Training", value: "diabetic" },
    { label: "Patient Training", value: "patient" },
  ];

  const sessionMedia: Record<
    string,
    {
      type: "image" | "video" | "button";
      src: string;
      poster?: string;
      title?: string;
    }[]
  > = {
    ecg: [
      { type: "image", src: "https://via.placeholder.com/300x180?text=ECG+1" },
      { type: "image", src: "https://via.placeholder.com/300x180?text=ECG+2" },
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        poster: "https://via.placeholder.com/300x180?text=ECG+Training",
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
    diabetic: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        poster: "https://via.placeholder.com/300x180?text=Diabetic+Training",
        title: "Diabetic Basic Training",
      },
      {
        type: "image",
        src: "https://via.placeholder.com/300x180?text=Diabetic+1",
      },
    ],
    patient: [
      {
        type: "button",
        title: "Start Patient Training",
        src: "",
      },
      {
        type: "button",
        title: "Advanced Patient Training",
        src: "",
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

  console.log(selectedSession, "selecetdsession");

  // ✅ 3️⃣ When video selected → log + emit socket
  const handleMediaSelect = (media: {
    src: string;
    type: string;
    title?: string;
  }) => {
    setActiveVideo(media.src);

    // const sessionId = sessionIdMap[selectedSession] || null;

    console.log("🎬 Video selected:", {
      patientId,
      selectedSession,
      sessionId,
      videoURL: media.src,
      title: media.title,
      userEmail: userEmailRef.current,
    });

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("video:selected", {
        patientId,
        selectedSession,
        sessionId,
        videoURL: media.src,
        title: media.title,
        userEmail: userEmailRef.current,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn("⚠️ Socket not connected. Cannot emit video:selected.");
    }
  };

  // ✅ UI
  return (
    <div className="p-5 border rounded-md shadow-sm bg-white">
      <div className="mb-3 text-sm font-semibold text-gray-700">
        🔌 Socket Status:{" "}
        <span
          className={clsx({
            "text-green-600": socketStatus.startsWith("Connected"),
            "text-red-600": socketStatus.startsWith("Error"),
            "text-gray-500": socketStatus === "Not connected",
          })}
        >
          {socketStatus}
        </span>
      </div>

      {/* Dropdown Section */}
      <div className="col-span-2 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FormLabel htmlFor="session" className="font-bold">
              {t("select_test")}
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
          {sessionMedia[selectedSession]?.map((media, index) => {
            const isActive = activeVideo === media.src;

            return (
              <div
                key={`${media.type}-${index}`}
                className={clsx(
                  "relative border rounded-lg shadow-sm overflow-hidden bg-slate-50 hover:shadow-md transition duration-200 cursor-pointer",
                  {
                    "ring-4 ring-blue-500 border-blue-500 shadow-lg scale-[1.02]":
                      isActive,
                  }
                )}
                onClick={() => handleMediaSelect(media)}
              >
                {media.type === "image" ? (
                  <img
                    src={media.src}
                    alt={`Media ${index + 1}`}
                    className="w-full h-48 object-cover"
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
                  <div className="relative group">
                    <img
                      src={
                        media.poster || "https://via.placeholder.com/300x180"
                      }
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Virtual;
