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
  id: string;
  uemail: string;
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
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(
    getInitialSessionState
  );
  const [isLoading, setIsLoading] = useState(true);
  const successNotification = useRef<NotificationElement | null>(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

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
        localStorage.removeItem("user");
        localStorage.removeItem("role");
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
      localStorage.setItem("startedBy", data.startedBy);
      setSessionInfo({
        isActive: true,
        sessionId: data.sessionId,
        patientId: data.patientId,
        sessionName: data.sessionName,
        startedBy: data.startedBy,
      });
      sessionStorage.setItem("activeSession", JSON.stringify(data));

      socket.emit("joinSession", {
        sessionId: data.sessionId,
        userId: user.id,
      });
      successNotification.current?.showToast();
      if (role === "Faculty") {
        navigate(`/patients-view/${data.patientId}`);
      }
    };

    const handleSessionEnded = (data: any) => {
      localStorage.removeItem("startedBy");
      console.log("[AppContext] Received session:ended event:", data);
      setSessionInfo({
        isActive: false,
        sessionId: null,
        patientId: null,
        sessionName: null,
        startedBy: null,
      });
      sessionStorage.removeItem("activeSession");
    };

    socket.on("session:started", handleSessionStarted);
    socket.on("session:ended", handleSessionEnded);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("session:started", handleSessionStarted);
      socket.off("session:ended", handleSessionEnded);
    };
  }, [socket, user]);

  const value = useMemo(
    () => ({
      socket,
      user,
      sessionInfo,
      isLoading,
      loadUser,
    }),
    [socket, user, sessionInfo, isLoading, loadUser]
  );

  return (
    <AppContext.Provider value={value}>
      <Notification
        getRef={(el: NotificationElement | null) => {
          successNotification.current = el;
        }}
        options={{
          duration: 3000,
        }}
        className="flex"
      >
        <Lucide icon="Monitor" className="text-success" />
        <div className="ml-4 mr-4">
          <div className="font-medium">
            New session "<span>{sessionInfo.sessionName}</span>" started
          </div>
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
