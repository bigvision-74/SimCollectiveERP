import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { getAdminOrgAction } from "@/actions/adminActions";
import env from "../../env"; // Adjust path if needed

// --- TYPE DEFINITIONS ---
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
}

interface AppContextType {
  socket: Socket | null;
  user: User | null;
  sessionInfo: SessionInfo;
  isLoading: boolean;
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
      };
    }
  } catch (error) {
    console.error("Failed to parse session from sessionStorage", error);
  }
  return { isActive: false, sessionId: null, patientId: null };
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(
    getInitialSessionState
  );
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(env.REACT_APP_BACKEND_URL || "http://localhost:5000", {
      withCredentials: true,
      autoConnect: false,
    });
    setSocket(newSocket);
    newSocket.connect();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("[AppContext] Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("[AppContext] Socket connection error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket]);

  useEffect(() => {
    const useremail = localStorage.getItem("user");
    if (useremail) {
      getAdminOrgAction(useremail)
        .then((userData) => {
          setUser(userData);
          if (socket) {
            socket.emit("authenticate", useremail);
          }
        })
        .catch((error) => {
          console.error("[AppContext] User Fetch Error:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [socket]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("joinOrg", { orgId: user.organisation_id });

    const handleSessionStarted = (data: any) => {
      setSessionInfo({
        isActive: true,
        sessionId: data.sessionId,
        patientId: data.patientId,
      });
      sessionStorage.setItem("activeSession", JSON.stringify(data));
      socket.emit("joinSession", {
        sessionId: data.sessionId,
        userId: user.id,
      });
    };

    const handleSessionEnded = (data: any) => {
      console.log("[AppContext] Received session:ended event:", data);
      setSessionInfo({ isActive: false, sessionId: null, patientId: null });
      sessionStorage.removeItem("activeSession");
    };

    socket.on("session:started", handleSessionStarted);
    socket.on("session:ended", handleSessionEnded);

    return () => {
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
    }),
    [socket, user, sessionInfo, isLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
