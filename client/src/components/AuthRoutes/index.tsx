import { useState, useEffect } from "react";
import { auth } from "@firebaseConfig";
import { getUserAction } from "@/actions/userActions";
import { logoutUser } from "@/actions/authAction";

export interface UserData {
  id: string;
  uemail: string;
  uname?: string;
  lastLogin: string | null;
  verification_code: string | null;
}

export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const getUserData = async (email: string): Promise<UserData | null> => {
    try {
      const user = await getUserAction(email);
      return user ? (user as UserData) : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const rememberMeTimestampStr = localStorage.getItem(`rememberMeTimestamp_${firebaseUser.uid}`);

        if (rememberMeTimestampStr) {
          const loginTime = parseInt(rememberMeTimestampStr, 10);
          const currentTime = Date.now();
          const elapsedTime = currentTime - loginTime;
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

          if (elapsedTime > TWENTY_FOUR_HOURS) {
            console.log("Remember Me session expired. Forcing logout.");
            await logoutUser();
            setAuthenticated(false);
            setRole(null);
            return; 
          }
        }

        const email = firebaseUser.email ?? localStorage.getItem("user");
        if (email) {
          const userData = await getUserData(email);
          if (userData && userData.verification_code == null) {
            setAuthenticated(true);
            const storedRole = localStorage.getItem("role");
            setRole(storedRole);
          } else {
            setAuthenticated(false);
            setRole(null);
          }
        }
      } else {
        setAuthenticated(false);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return { authenticated, role };
};
