import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { getAdminOrgAction } from "@/actions/adminActions";
import env from "../../env";
import Lucide from "@/components/Base/Lucide";
import Notification from "@/components/Base/Notification";
import { NotificationElement } from "@/components/Base/Notification";

interface User {
  inRoom: any;
  id: string;
  uemail: string;
  name: string;
  role: string;
  organisation_id: string;
}

interface SessionInfo {
  isActive: boolean;
  sessionId: string | null;
  patientId: string | null;
  sessionName: string | null;
  startedBy: string | null;
}

interface AppContextType {
  socket: Socket | null;
  user: User | null;
  sessionInfo: SessionInfo;
  isLoading: boolean;
  loadUser: () => Promise<void>;
  participants: User[];
  fetchParticipants: (sessionId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialSessionState = (): SessionInfo => {
  try {
    const activeSession = sessionStorage.getItem("activeSession");
    if (activeSession) {
      const parsedSession = JSON.parse(activeSession);
      return {
        isActive: true,
        sessionId: parsedSession.sessionId,
        patientId: parsedSession.patientId,
        sessionName: parsedSession.sessionName,
        startedBy: parsedSession.startedBy,
      };
    }
  } catch (error) {
    console.error("Failed to parse session from sessionStorage", error);
  }
  return {
    isActive: false,
    sessionId: null,
    patientId: null,
    sessionName: null,
    startedBy: null,
  };
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notificationType, setNotificationType] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [participants, setParticipants] = useState<User[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(
    getInitialSessionState
  );
  const [isLoading, setIsLoading] = useState(true);

  const notificationRef = useRef<NotificationElement | null>(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const fetchParticipants = useCallback(
    (sessionId: string) => {
      if (socket && sessionId) {
        socket.emit("getParticipantList", { sessionId });
      }
    },
    [socket]
  );

  const loadUser = useCallback(async () => {
    const useremail = localStorage.getItem("user");
    if (useremail) {
      setIsLoading(true);
      try {
        const userData = await getAdminOrgAction(useremail);
        setUser(userData);
      } catch (error) {
        console.error("[AppContext] User Fetch Error:", error);
        setUser(null);
        // localStorage.removeItem("user");
        // localStorage.removeItem("role");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    const newSocket = io(env.REACT_APP_BACKEND_URL || "http://localhost:5000", {
      withCredentials: true,
      auth: {
        userEmail: user.uemail,
      },
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      console.log("[AppContext] Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("[AppContext] Socket connection error:", error.message);
    });

    const handleSessionStarted = (data: any) => {
      socket.emit("joinSession", {
        sessionId: data.sessionId,
        userId: user.id,
        sessionData: data,
      });
    };

    const handleSessionJoined = (data: any) => {
      console.log(
        `[AppContext] Successfully joined session: ${data.sessionId}`
      );
      setNotificationType("Start");
      setNotificationMessage(`Joined session "${data.sessionName}"`);
      notificationRef.current?.showToast();
      localStorage.setItem("startedBy", data.startedBy);
      setSessionInfo({
        isActive: true,
        sessionId: data.sessionId,
        patientId: data.patientId,
        sessionName: data.sessionName,
        startedBy: data.startedBy,
      });
      sessionStorage.setItem("activeSession", JSON.stringify(data));

      if (role === "Faculty") {
        navigate(`/patients-view/${data.patientId}`);
      }
    };

    const handleParticipantListUpdate = ({
      participants,
    }: {
      participants: User[];
    }) => {
      console.log(participants,"participantsparticipantsparticipantsparticipants")
      setParticipants(participants);
    };

    const handleSessionEnded = (data: any) => {
      setNotificationType("End");
      setNotificationMessage("Session Ended");
      notificationRef.current?.showToast();

      localStorage.removeItem("startedBy");
      setSessionInfo({
        isActive: false,
        sessionId: null,
        patientId: null,
        sessionName: null,
        startedBy: null,
      });
      sessionStorage.removeItem("activeSession");
    };

    const handleSessionRemoveUser = (data: any) => {
      console.log("[Socket] removeUser event:", data);
      // const participants = fetchParticipants(String(data.sessionId));
      if (String(data.userid) === String(user?.id)) {
        setNotificationType("End");
        setNotificationMessage("You have been removed from this session");
        notificationRef.current?.showToast();

        setSessionInfo({
          isActive: false,
          sessionId: null,
          patientId: null,
          sessionName: null,
          startedBy: null,
        });
        sessionStorage.removeItem("activeSession");
        localStorage.removeItem("startedBy");
      }
    };

    const handleSessionAddParticipant = (data: any) => {
      console.log("[Socket] Participant added:", data);
      if (String(data.userId) === String(user?.id)) {
        setNotificationType("Start");
        setNotificationMessage(
          `Joined session "${data.sessionData?.sessionName}"`
        );
        notificationRef.current?.showToast();

        setSessionInfo({
          isActive: true,
          sessionId: data.sessionData?.sessionId,
          patientId: data.sessionData?.patientId,
          sessionName: data.sessionData?.sessionName,
          startedBy: data.sessionData?.startedBy,
        });

        sessionStorage.setItem(
          "activeSession",
          JSON.stringify(data.sessionData)
        );

        if (role === "Faculty") {
          navigate(`/patients-view/${data.sessionData?.patientId}`);
        }
      }

      // Refresh participant list
      if (sessionInfo.sessionId) {
        fetchParticipants(sessionInfo.sessionId);
      }
    };

    const handleJoinError = (error: { message: string }) => {
      console.error(`[AppContext] Join denied by server: ${error.message}`);
    };

    socket.on("session:started", handleSessionStarted);
    socket.on("session:joined", handleSessionJoined);
    socket.on("removeUser", handleSessionRemoveUser);
    socket.on("paticipantAdd", handleSessionAddParticipant);
    socket.on("participantListUpdate", handleParticipantListUpdate);
    socket.on("session:ended", handleSessionEnded);
    socket.on("joinError", handleJoinError);

    return () => {
      socket.off("session:started", handleSessionStarted);
      socket.off("session:joined", handleSessionJoined);
      socket.off("removeUser", handleSessionRemoveUser);
      socket.off("paticipantAdd", handleSessionAddParticipant);
      socket.off("participantListUpdate", handleParticipantListUpdate);
      socket.off("session:ended", handleSessionEnded);
      socket.off("joinError", handleJoinError);
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket, user, navigate, role]);

  const value = useMemo(
    () => ({
      socket,
      user,
      sessionInfo,
      isLoading,
      loadUser,
      participants,
      fetchParticipants,
    }),
    [
      socket,
      user,
      sessionInfo,
      isLoading,
      loadUser,
      participants,
      fetchParticipants,
    ]
  );

  const getNotificationAppearance = () => {
    switch (notificationType) {
      case "Start":
        return { icon: "LogIn", color: "text-success" };
      case "End":
        return { icon: "LogOut", color: "text-danger" };
      case "Error":
        return { icon: "AlertCircle", color: "text-danger" };
      default:
        return { icon: "Monitor", color: "" };
    }
  };

  return (
    <AppContext.Provider value={value}>
      <Notification
        getRef={(el: NotificationElement | null) => {
          notificationRef.current = el;
        }}
        options={{
          duration: 3000,
        }}
        className="flex"
      >
        <Lucide
          icon="Monitor"
          className={`${getNotificationAppearance().color} w-6 h-6`}
        />
        <div className="ml-4 mr-4">
          <div className="font-medium">{notificationMessage}</div>
        </div>
      </Notification>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
