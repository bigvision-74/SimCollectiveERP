import React, { useState, useEffect, useRef } from "react";
import { t } from "i18next";
import clsx from "clsx";
import { io, Socket } from "socket.io-client";
import {
  FormSelect,
  FormInput,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import { getAdminOrgAction } from "@/actions/adminActions";
import {
  getVrSessionByIdAction,
  deleteVirtualSessionAction,
  saveVirtualSessionDataAction,
  scheduleSocketSessionAction,
  getScheduledSocketsAction,
} from "@/actions/virtualAction";
import { useLocation } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { parseJSON } from "date-fns";
import { Dialog, Menu } from "@/components/Base/Headless";
import env from "../../../env";
import { useAppContext } from "@/contexts/sessionContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

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
  // const stored = localStorage.getItem(`active-sessions-${patientId}`);
  // const sessionData: SessionData[] = JSON.parse(stored ?? "[]");
  // const latestSession = sessionData[sessionData.length - 1];
  const [playbackType, setPlaybackType] = useState<"immediate" | "delay">(
    "delay"
  );
  const [countdown, setCountdown] = useState<number>(0);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [sessionTimeData, setSessionTimeData] = useState<{
    start_time: string;
    duration_minutes: number;
  } | null>(null);

  const { scheduleData } = useAppContext();
  dayjs.extend(utc);
  // if (latestSession) {
  //   const totalSeconds = Number(latestSession.session_time) * 60;

  //   // Only save start time if not already saved
  //   const savedStart = localStorage.getItem(
  //     `session-start-${latestSession.sessionId}`
  //   );
  //   if (!savedStart) {
  //     localStorage.setItem(
  //       `session-start-${latestSession.sessionId}`,
  //       String(Date.now())
  //     );
  //   }
  //   localStorage.setItem(
  //     `session-duration-${latestSession.sessionId}`,
  //     String(totalSeconds)
  //   );
  // }

  let initialCountdown = 0;

  // if (latestSession) {
  //   const startTime = Number(
  //     localStorage.getItem(`session-start-${latestSession.sessionId}`)
  //   );
  //   const duration =
  //     Number(
  //       localStorage.getItem(`session-duration-${latestSession.sessionId}`)
  //     ) || 0;

  //   if (startTime && duration) {
  //     const elapsed = Math.floor((Date.now() - startTime) / 1000);
  //     initialCountdown = Math.max(duration - elapsed, 0);
  //   } else {
  //     initialCountdown = Number(latestSession.session_time) * 60;
  //   }
  // }

  // const [countdown, setCountdown] = useState(initialCountdown);
  // const [isSessionEnded, setIsSessionEnded] = useState(!latestSession);
  // const patientType = latestSession?.patient_type ?? "";
  // const sessionId = latestSession?.sessionId ?? "";

  const [sessionId, setSessionId] = useState<number>(0);
  const [patientType, setPatientType] = useState(null);
  const [usersPerSession, setUsersPerSession] = useState(0);
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledSockets, setScheduledSockets] = useState<any[]>([]);

  useEffect(() => {
    // console.log("Countdown:", countdown, "Ended?", isSessionEnded);
  }, [countdown, isSessionEnded]);

  // const endSession = async (sessionId: string | number) => {
  //   try {
  //     await deleteVirtualSessionAction(Number(sessionId));
  //     setIsSessionEnded(true);

  //     // Remove all localStorage items related to this session
  //     localStorage.removeItem(`session-start-${sessionId}`);
  //     localStorage.removeItem(`session-duration-${sessionId}`);
  //     localStorage.removeItem(`countdown-${sessionId}`);
  //     socket.current?.emit("JoinSessionEventEPR", {
  //       sessionId,
  //       sessionTime: 0,
  //     });
  //     // Optionally remove the active-sessions entry for this patient
  //     const activeSessionsKey = `active-sessions-${patientId}`;
  //     const storedSessions = localStorage.getItem(activeSessionsKey);
  //     if (storedSessions) {
  //       const sessions = JSON.parse(storedSessions) as SessionData[];
  //       const updatedSessions = sessions.filter(
  //         (s) => s.sessionId !== sessionId
  //       );
  //       if (updatedSessions.length) {
  //         localStorage.setItem(
  //           activeSessionsKey,
  //           JSON.stringify(updatedSessions)
  //         );
  //       } else {
  //         localStorage.removeItem(activeSessionsKey);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error ending session:", error);
  //   }
  // };

  const endSession = async (sessionId: string | number) => {
    try {
      await deleteVirtualSessionAction(Number(sessionId));
      setIsSessionEnded(true);

      socket.current?.emit("JoinSessionEventEPR", {
        sessionId,
        sessionTime: 0,
      });
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const fetchScheduledSockets = async () => {
    if (!sessionId) return;
    try {
      const res = await getScheduledSocketsAction(sessionId);
      console.log(res, "ressssssssss");
      setScheduledSockets(res || []);
    } catch (err) {
      console.error("Error fetching scheduled sockets:", err);
    }
  };

  // useEffect(() => {
  //   if (isSessionEnded || countdown <= 0) return;

  //   const timer = setInterval(() => {
  //     setCountdown((prev) => {
  //       const next = prev - 1;

  //       // Save remaining time
  //       localStorage.setItem(
  //         `countdown-${latestSession.sessionId}`,
  //         String(next)
  //       );

  //       if (next <= 0) {
  //         clearInterval(timer);
  //         setIsSessionEnded(true);
  //         endSession(sessionId);
  //         localStorage.removeItem(`countdown-${latestSession.sessionId}`);
  //         return 0;
  //       }
  //       return next;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [isSessionEnded, sessionId, countdown]);

  // useEffect(() => {
  //   const fetchSession = async () => {
  //     if (!sessionId) return;
  //     const sessionData = await getVrSessionByIdAction(sessionId);
  //     setTotalSession(sessionData.total_sessions);
  //   };

  //   fetchSession();
  // }, [sessionId]);

  useEffect(() => {
    if (!sessionTimeData || countdown <= 0 || isSessionEnded) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          setIsSessionEnded(true);
          endSession(sessionId);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionTimeData, countdown, isSessionEnded]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!patientId) return;

      try {
        const res = await getVrSessionByIdAction(patientId);
        console.log(res, "sessionData");

        // The API returns { session, total_sessions }
        const sessionData = res.session;
        setTotalSession(res.total_sessions);
        setSessionId(sessionData.id);
        setPatientType(sessionData.patient_type);
        if (sessionData.created_at && sessionData.session_time) {
          setSessionTimeData({
            start_time: sessionData.created_at,
            duration_minutes: sessionData.session_time,
          });

          // Calculate countdown
          const startTime = dayjs.utc(sessionData.created_at);
          const endTime = startTime.add(sessionData.session_time, "minute");
          const now = dayjs.utc();

          const remainingSeconds = endTime.diff(now, "second");
          if (remainingSeconds <= 0) {
            setCountdown(0);
            setIsSessionEnded(true);
            await endSession(sessionData.id);
          } else {
            setCountdown(remainingSeconds);
            setIsSessionEnded(false);
          }
          console.log(remainingSeconds, "remainingSeconds");
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    };

    fetchSession();
  }, []);

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
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/qzGx-f46V-image3.png",
        title: "Idle",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/2A3f-Sy3Z-image2.png",
        title: "Coughing",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/Kg7F-WSro-image4.png",
        title: "Breathing",
      },
    ],
    Child: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/qzGx-f46V-image3.png",
        title: "Idle",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/Kg7F-WSro-image4.png",
        title: "Coughing",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/2A3f-Sy3Z-image2.png",
        title: "Breathing",
      },
    ],
    Woman: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/QkAJ-n1eb-image5.png",
        title: "Idle",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/KZa3-udBF-image7.png",
        title: "Coughing",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/fHBd-pJIN-image6.png",
        title: "Breathing",
      },
    ],

    // 🩺 New entries below
    Pediatric_Monitor_With_Stand: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/OoYC-a3DC-Low.png",
        title: "Pediatric_1",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/iWst-NM07-Normal.png",
        title: "Pediatric_2",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/ZFve-c0GW-High.png",
        title: "Pediatric_3",
      },
    ],
    Resuscitation: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/vT8P-WmoY-1.png",
        title: "Resuscitation_1",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/cJLi-3RHJ-2.png",
        title: "Resuscitation_2",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/1eCT-znr2-3.png",
        title: "Resuscitation_3",
      },
    ],
    Ultrasound: [
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/8MKw-KXFs-Asset4.png",
        title: "Ultrasound_1",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/8Ygk-hTRl-Asset5.png",
        title: "Ultrasound_2",
      },
      {
        type: "image",
        src: "https://insightxr.s3.eu-west-2.amazonaws.com/image/hjdI-N38B-Asset6.png",
        title: "Ultrasound_3",
      },
    ],
  };

  const lastJoinEmitTime = useRef<number | null>(null);

  useEffect(() => {
    if (!socket.current) return;

    const handleJoinSessionEPR = async (data: any) => {
      console.log("Received JoinSessionEPR data:", data);

      // Throttle the response to prevent the feedback loop
      const now = Date.now();
      if (lastJoinEmitTime.current && now - lastJoinEmitTime.current < 2000) {
        // 2-second cooldown
        console.warn("Ignoring JoinSessionEPR event to prevent loop.");
        return; // Exit the function early
      }

      // 🧠 Handle both string and object cases
      let parsedData = data.dataReceived;
      if (typeof parsedData === "string") {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          console.error("❌ Failed to parse dataReceived:", e);
          return;
        }
      }

      const { sessionId, sessionTime, userId, status } = parsedData || {};
      console.log("✅ Parsed JoinSessionEPR:", {
        sessionId,
        sessionTime,
        userId,
        status,
      });

      // Guard
      if (!sessionId) {
        console.warn("⚠️ No sessionId in JoinSessionEPR payload");
        return;
      }

      const storedTime = localStorage.getItem(`countdown-${sessionId}`);
      console.log(`⏱ Sending sessionTime for ${sessionId}:`, storedTime);

      // Update the timestamp *before* emitting
      lastJoinEmitTime.current = now;

      socket.current?.emit("JoinSessionEventEPR", {
        sessionId,
        sessionTime: storedTime ?? null,
      });

      const response = await saveVirtualSessionDataAction(parsedData);

      const joinedUsers = response?.data ?? [];
      const userCount = Array.isArray(joinedUsers) ? joinedUsers.length : 0;

      console.log("User Count:", userCount);
      // Update the user count for that session
      setUsersPerSession(userCount);
    };

    socket.current.on("JoinSessionEPR", handleJoinSessionEPR);

    return () => {
      socket.current?.off("JoinSessionEPR", handleJoinSessionEPR);
    };
  }, []);

  // ✅ 3️⃣ When video selected → log + emit socket
  const handleMediaSelect = (media: {
    src: string;
    type: string;
    title?: string;
    section?: string;
  }) => {
    setActiveVideo(media.title || null);

    const characterTypes = ["Oldman", "Woman", "Child"];

    const isCharacter = characterTypes.includes(media.section ?? "");
    console.log(media.section, "patienttype");
    const data = {
      device_type: "VR",
      title: isCharacter ? media.title : null,
      patientType: patientType,
      sessionId: sessionId,
      patientId: patientId,
      machine_name: isCharacter ? null : media.title,
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

  const openSchedulePopup = (media: any, section: string) => {
    setSelectedMedia({ ...media, section });
    setScheduleOpen(true);
  };

  useEffect(() => {
    fetchScheduledSockets();
  }, [scheduleData]);

  // 🔹 Confirm scheduling
  const handleScheduleConfirm = async () => {
    if (!scheduleTime) {
      alert("Please select a schedule time");
      return;
    }

    const payload = {
      sessionId: String(sessionId),
      patientId: String(patientId),
      title: selectedMedia.title,
      src: selectedMedia.src,
      scheduleTime: dayjs(scheduleTime).utc().format("YYYY-MM-DDTHH:mm"),
    };

    try {
      const res = await scheduleSocketSessionAction(payload);

      if (res.success) {
        fetchScheduledSockets();
        setScheduleOpen(false);
        setScheduleTime("");
        setSelectedMedia(null);
      }
    } catch (err) {
      console.error("Error scheduling:", err);
    }
  };

  useEffect(() => {
    fetchScheduledSockets();
  }, [sessionId]);

  return (
    <>
      {!sessionId || isSessionEnded ? (
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
      ) : (
        <div className="shadow-sm bg-white">
          {!isSessionEnded && (
            <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <div className="text-md font-semibold text-black-600">
                This session will automatically end in{" "}
                {Math.floor(countdown / 60)}:
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

          <Dialog
            size="xl"
            open={isScheduleOpen}
            onClose={() => setScheduleOpen(false)}
          >
            <Dialog.Panel className="p-5 relative">
              {/* Close Button */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setScheduleOpen(false);
                }}
                className="absolute top-0 right-0 mt-3 mr-3"
              >
                ✕
              </a>

              <Dialog.Title className="text-lg font-semibold mb-4">
                Schedule Playback
              </Dialog.Title>

              {/* <p className="text-sm text-gray-600 mb-4">
                {selectedMedia?.title || "No media selected"}
              </p> */}

              {/* Playback Type: Immediate or Delay */}
              <div className="mb-6 ml-3">
                <label className="font-semibold text-gray-700 mb-2 block">
                  Choose playback type:
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <FormCheck.Input
                      type="radio"
                      name="playbackType"
                      value="immediate"
                      checked={playbackType === "immediate"}
                      onChange={(e) =>
                        setPlaybackType(e.target.value as "immediate" | "delay")
                      }
                      className="cursor-pointer"
                    />
                    <span>Immediately</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <FormCheck.Input
                      type="radio"
                      name="playbackType"
                      value="delay"
                      checked={playbackType === "delay"}
                      onChange={(e) =>
                        setPlaybackType(e.target.value as "immediate" | "delay")
                      }
                      className="cursor-pointer"
                    />
                    <span>Delay</span>
                  </label>
                </div>
              </div>

              {/* Delay Option — Show Datetime Picker only if Delay is selected */}
              {playbackType === "delay" && (
                <FormInput
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setScheduleOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (playbackType === "immediate") {
                      // 🔹 Call handleMediaSelect directly
                      handleMediaSelect(selectedMedia);
                      setScheduleOpen(false);
                    } else {
                      // 🔹 Continue with scheduled behavior
                      handleScheduleConfirm();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white transition"
                >
                  Confirm
                </Button>
              </div>
            </Dialog.Panel>
          </Dialog>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
            <div className="col-span-2">
              {/* Dropdown Section */}
              <div className="col-span-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FormLabel htmlFor="session" className="font-bold">
                      {t("charactor_animations")} : {patientType}
                    </FormLabel>
                    <span className="md:hidden text-red-500 ml-1">*</span>
                  </div>
                </div>
              </div>

              {/* Media Grid */}
              {patientType && sessionMedia[patientType] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {sessionMedia[patientType]?.map((media, index) => {
                    const isActive = activeVideo === media.title;

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
                        onClick={() => openSchedulePopup(media, patientType)}
                      >
                        {media.type === "image" ? (
                          <img
                            src={media.src}
                            alt={media.title}
                            className="w-full h-48"
                          />
                        ) : activeVideo === media.title ? (
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

              <div className="col-span-2 mt-10">
                {[
                  "Pediatric_Monitor_With_Stand",
                  "Resuscitation",
                  "Ultrasound",
                ].map((section) => (
                  <div key={section} className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                      <FormLabel htmlFor={section} className="font-bold">
                        {section.replaceAll("_", " ")}
                      </FormLabel>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {sessionMedia[section]?.map((media, index) => {
                        const isActive = activeVideo === media.src;
                        return (
                          <div
                            key={`${section}-${media.type}-${index}`}
                            className={clsx(
                              "relative border rounded-lg shadow-sm overflow-hidden bg-slate-50 hover:shadow-md transition duration-200 cursor-pointer",
                              {
                                "ring-4 ring-primary border-primary shadow-lg scale-[1.02]":
                                  isActive,
                              }
                            )}
                            onClick={() => openSchedulePopup(media, section)}
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
                                {t(
                                  "Your browser does not support the video tag."
                                )}
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
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
                        {usersPerSession}
                      </h5>
                    </div>
                    <div className="col-span-2 font-medium px-0 py-2 text-center border border-slate-200 rounded-lg dark:border-darkmode-300 shadow-md">
                      <Lucide
                        icon="ListPlus"
                        className="w-6 h-6 mx-auto mb-2 text-primary mt-2"
                      />
                      <div className="font-medium mt-3">
                        {t("total_sessions")}
                      </div>
                      <h5 className="mt-3 text-lg font-medium leading-none mb-2">
                        {totalSession}
                      </h5>
                    </div>
                  </div>

                  {/* 🕒 Scheduled Sockets List */}
                  <div className="mt-6 border-t border-slate-200/60 pt-4">
                    <h3 className="text-md font-semibold mb-3 text-gray-700">
                      Scheduled Sockets
                    </h3>

                    {scheduledSockets.length > 0 ? (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {scheduledSockets.map((s) => (
                          <li
                            key={s.id}
                            className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm"
                          >
                            <div>
                              <span className="font-medium text-gray-800">
                                {s.title}
                              </span>
                              <div className="text-gray-500 text-xs">
                                {new Date(s.schedule_time).toLocaleString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </div>
                            </div>
                            <Lucide
                              icon="Clock"
                              className="w-4 h-4 text-primary"
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No scheduled sockets yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Virtual;
