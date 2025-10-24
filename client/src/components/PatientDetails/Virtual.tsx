import React, { useState, useEffect, useRef } from "react";
import { t } from "i18next";
import clsx from "clsx";
import io, { Socket } from "socket.io-client";
import { FormSelect, FormInput, FormLabel } from "@/components/Base/Form";
import { getAdminOrgAction } from "@/actions/adminActions";
import {
  getVrSessionByIdAction,
  deleteVirtualSessionAction,
} from "@/actions/virtualAction";
import { useLocation } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";

interface VirtualProps {
  patientId: number | string;
  onShowAlert?: (msg: string) => void;
}
interface SessionData {
  sessionId: string;
  patientId: string;
  session_time: string;
  patient_type: string;
  // add more fields as needed
}

const Virtual: React.FC<VirtualProps> = ({ patientId }) => {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [totalSession, setTotalSession] = useState<number>(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ session?: string }>({});
  const [socketStatus, setSocketStatus] = useState<string>("Not connected");

  const socketRef = useRef<Socket | null>(null);
  const userEmailRef = useRef<string>("");

  const location = useLocation();
  //   const sessionId = location.state?.sessionId;
  const stored = localStorage.getItem(`active-sessions-${patientId}`);
  const sessionData: SessionData[] = JSON.parse(stored ?? "[]");
  const latestSession = sessionData[sessionData.length - 1];
  const sessionMinutes = Number(latestSession?.session_time || 0);
  const [countdown, setCountdown] = useState(0);
  const [isSessionEnded, setIsSessionEnded] = useState(!latestSession);
  const patientType = latestSession?.patient_type ?? "";
  const sessionId = latestSession?.sessionId ?? "";
  const [vrData, setVrData] = useState(null);
  const [usersPerSession, setUsersPerSession] = useState<
    Record<string, number>
  >({});

  //   console.log(vrData, "vrDatavrDatavrDatavrData");
  // Convert session_time (minutes) to seconds
  useEffect(() => {
    if (latestSession?.session_time) {
      setCountdown(Number(latestSession.session_time) * 60);
    }
  }, [latestSession]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      const sessionData = await getVrSessionByIdAction(sessionId);
      setTotalSession(sessionData.total_sessions);
    };

    fetchSession();
  }, [sessionId]);

  // ✅ 1️⃣ Establish socket connection once
  useEffect(() => {
    const setupSocket = async () => {
      const userEmail = localStorage.getItem("user");
      if (!userEmail) {
        console.error("❌ No user found in localStorage");
        setSocketStatus("Error: No user found");
        return;
      }

      const userData = await getAdminOrgAction(String(userEmail));
      const finalEmail = userData?.uemail || userEmail;
      userEmailRef.current = finalEmail;

      const socket = io(
        // "http://localhost:5000",
        "https://backend.simvpr.com",
        {
          transports: ["websocket"],
          auth: { userEmail: finalEmail },
        }
      );

      socketRef.current = socket;

      socket.on("connect", () => setSocketStatus(`Connected: ${socket.id}`));
      socket.on("disconnect", () => setSocketStatus("Disconnected"));
      socket.on("connect_error", (err) =>
        setSocketStatus(`Error: ${err.message}`)
      );

      socket.on("vrSessionDetails", (data) => {
        setVrData(data);
        setUsersPerSession((prev) => ({
          ...prev,
          [data.sessionId]: data.users?.length ?? 0,
        }));
      });
      socket.on("video:selected:confirm", (data) =>
        console.log("📡 Server confirmation:", data)
      );
    };

    setupSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [patientId]);

  const endSession = async (sessionId: any) => {
    try {
      await deleteVirtualSessionAction(sessionId);
      setIsSessionEnded(true);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const sessionMedia: Record<
    string,
    { type: "image" | "video"; src: string; poster?: string; title?: string }[]
  > = {
    Oldman: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/C51o-ijnw-smile.png",
        title: "start_animation",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/08Hs-ZX0T-average-imoji.png",
        title: "sad_animation",
      },
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "smile_animation",
      },
    ],
    Child: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "start_animation",
      },
    ],
    Woman: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "start_animation",
      },
    ],
  };

  // ✅ 3️⃣ When video selected → log + emit socket
  const handleMediaSelect = (media: {
    src: string;
    type: string;
    title?: string;
  }) => {
    setActiveVideo(media.src);

    console.log("🎬 Video selected:", {
      patientId,
      patientType,
      sessionId,
      videoURL: media.src,
      title: media.title,
      userEmail: userEmailRef.current,
    });

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("video:selected", {
        patientId,
        patientType,
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
    <div className="shadow-sm bg-white">
      {!isSessionEnded && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
          <div className="text-md font-semibold text-black-600">
            This session will automatically end in {Math.floor(countdown / 60)}:
            {(countdown % 60).toString().padStart(2, "0")} minutes
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-32"
            onClick={() => {
              endSession(sessionId);
            }}
          >
            {t("end_session")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
        <div className="col-span-2">
          {/* Dropdown Section */}
          <div className="col-span-2 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FormLabel htmlFor="session" className="font-bold">
                  {t("patient_type")}
                </FormLabel>
                <span className="md:hidden text-red-500 ml-1">*</span>
              </div>
            </div>

            <FormInput
              id="session"
              name="session"
              value={patientType}
              disabled
              className={`w-full mb-2 ${clsx({
                "border-danger": formErrors.session,
              })}`}
            ></FormInput>

            {formErrors.session && (
              <p className="text-red-500 text-sm">{formErrors.session}</p>
            )}
          </div>

          {/* Media Grid */}
          {patientType && sessionMedia[patientType] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {sessionMedia[patientType]?.map((media, index) => {
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
                        alt={media.title}
                        className="w-full h-48"
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
                        <video
                          src={media.src}
                          className="w-full h-48 object-cover"
                          muted
                          playsInline
                          preload="metadata"
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
                        {/* <p className="absolute bottom-2 left-2 text-sm text-white font-semibold bg-black bg-opacity-50 px-2 rounded">
                          {media.title}
                        </p> */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-1 intro-y">
          <div className="mt-5 box">
            <div className="p-5">
              <div className="border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
                <div className="mr-auto text-lg font-medium mb-3">
                  {t("analytics_platform_para2")}
                </div>
              </div>
              <div className="flex mt-5 justify-center grid grid-cols-4 gap-4">
                <div className="col-span-2 font-medium px-0 py-2 text-center border border-slate-200 rounded-lg dark:border-darkmode-300 shadow-md">
                  <Lucide
                    icon="Users"
                    className="w-6 h-6 mx-auto mb-2 text-primary mt-2"
                  />
                  <div className="font-medium mt-3">{t("User_Online")}</div>
                  <h5 className="mt-3 text-lg font-medium leading-none mb-2">
                    {usersPerSession[sessionId] ?? 0}
                  </h5>
                </div>
                <div className="col-span-2 font-medium px-0 py-2 text-center border border-slate-200 rounded-lg dark:border-darkmode-300 shadow-md">
                  <Lucide
                    icon="ListPlus"
                    className="w-6 h-6 mx-auto mb-2 text-primary mt-2"
                  />
                  <div className="font-medium mt-3">{t("total_sessions")}</div>
                  <h5 className="mt-3 text-lg font-medium leading-none mb-2">
                    {totalSession}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Virtual;
