import React, { useState, useEffect, useRef } from "react";
import { t } from "i18next";
import clsx from "clsx";
import { io, Socket } from "socket.io-client";
import { FormSelect, FormInput, FormLabel } from "@/components/Base/Form";
import { getAdminOrgAction } from "@/actions/adminActions";
import {
  getVrSessionByIdAction,
  deleteVirtualSessionAction,
  saveVirtualSessionDataAction,
} from "@/actions/virtualAction";
import { useLocation } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { parseJSON } from "date-fns";

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
  const [totalSession, setTotalSession] = useState<number>(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ session?: string }>({});
  const socket = useRef<Socket | null>(null);
  const stored = localStorage.getItem(`active-sessions-${patientId}`);
  const sessionData: SessionData[] = JSON.parse(stored ?? "[]");
  const latestSession = sessionData[sessionData.length - 1];
  if (latestSession) {
    const totalSeconds = Number(latestSession.session_time) * 60;

    // Only save start time if not already saved
    const savedStart = localStorage.getItem(
      `session-start-${latestSession.sessionId}`
    );
    if (!savedStart) {
      localStorage.setItem(
        `session-start-${latestSession.sessionId}`,
        String(Date.now())
      );
    }
    localStorage.setItem(
      `session-duration-${latestSession.sessionId}`,
      String(totalSeconds)
    );
  }

  let initialCountdown = 0;

  if (latestSession) {
    const startTime = Number(
      localStorage.getItem(`session-start-${latestSession.sessionId}`)
    );
    const duration =
      Number(
        localStorage.getItem(`session-duration-${latestSession.sessionId}`)
      ) || 0;

    if (startTime && duration) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      initialCountdown = Math.max(duration - elapsed, 0);
    } else {
      initialCountdown = Number(latestSession.session_time) * 60;
    }
  }

  const [countdown, setCountdown] = useState(initialCountdown);
  const [isSessionEnded, setIsSessionEnded] = useState(!latestSession);
  const patientType = latestSession?.patient_type ?? "";
  const sessionId = latestSession?.sessionId ?? "";
  const [vrData, setVrData] = useState(null);
  const [usersPerSession, setUsersPerSession] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    // console.log("Countdown:", countdown, "Ended?", isSessionEnded);
  }, [countdown, isSessionEnded]);

  const endSession = async (sessionId: string | number) => {
    try {
      await deleteVirtualSessionAction(Number(sessionId));
      setIsSessionEnded(true);

      // Remove all localStorage items related to this session
      localStorage.removeItem(`session-start-${sessionId}`);
      localStorage.removeItem(`session-duration-${sessionId}`);
      localStorage.removeItem(`countdown-${sessionId}`);

      // Optionally remove the active-sessions entry for this patient
      const activeSessionsKey = `active-sessions-${patientId}`;
      const storedSessions = localStorage.getItem(activeSessionsKey);
      if (storedSessions) {
        const sessions = JSON.parse(storedSessions) as SessionData[];
        const updatedSessions = sessions.filter(
          (s) => s.sessionId !== sessionId
        );
        if (updatedSessions.length) {
          localStorage.setItem(
            activeSessionsKey,
            JSON.stringify(updatedSessions)
          );
        } else {
          localStorage.removeItem(activeSessionsKey);
        }
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  useEffect(() => {
    if (isSessionEnded || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;

        // Save remaining time
        localStorage.setItem(
          `countdown-${latestSession.sessionId}`,
          String(next)
        );

        if (next <= 0) {
          clearInterval(timer);
          setIsSessionEnded(true);
          endSession(sessionId);
          localStorage.removeItem(`countdown-${latestSession.sessionId}`);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionEnded, sessionId, countdown]);

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
      {
        type: "video",
        src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        title: "start_animation_02",
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

  useEffect(() => {
    if (!socket.current) return;

    // Listen for JoinSessionEPR event from server
    socket.current.on("JoinSessionEPR", async (data: any) => {
      console.log("Received JoinSessionEPR data:", data);

      try {
        // Hit your API to save the data
        const response = await saveVirtualSessionDataAction(data.dataReceived);

        console.log("Saved to backend:", response);

        const { sessionId } = data.dataReceived;
        const joinedUsers = response?.data?.data ?? [];

        // Update the user count for that session
        setUsersPerSession((prev) => ({
          ...prev,
          [sessionId]: joinedUsers.length,
        }));
      } catch (error) {
        console.error("Error saving JoinSessionEPR data:", error);
      }
    });

    // Clean up on unmount
    return () => {
      socket.current?.off("JoinSessionEPR");
    };
  }, [socket]);

  // ✅ 3️⃣ When video selected → log + emit socket
  const handleMediaSelect = (media: {
    src: string;
    type: string;
    title?: string;
  }) => {
    setActiveVideo(media.src);

    const data = {
      title: media.title,
      patientType: patientType,
      sessionId: sessionId,
      patientId: patientId,
    };
    socket.current?.emit(
      "PlayAnimationEventEPR",
      JSON.stringify(data, null, 2),
      (ack: any) => {
        console.log("✅ ACK from server:", ack);
      }
    );
    console.log(JSON.stringify(data, null, 2));
  };

  if (!sessionId || !latestSession) {
    return (
      <div className="shadow-sm bg-white p-10 flex items-center justify-center text-center min-h-[200px]">
        <div>
          <Lucide
            icon="Info"
            className="w-10 h-10 mx-auto text-yellow-500 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t("no_active_session")}
          </h2>
          <p className="text-gray-500">{t("please_start_session_first")}</p>
        </div>
      </div>
    );
  }

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
              setIsSessionEnded(true);
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
                        "ring-4 ring-primary border-primary shadow-lg scale-[1.02]":
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
