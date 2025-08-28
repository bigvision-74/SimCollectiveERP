import { auth } from "@firebaseConfig";
import { redirect } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";

let currentUser: User | null = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

export async function getValidToken(): Promise<string> {
  if (!currentUser) {
    throw new Error("No user logged in");
  }

  return currentUser.getIdToken(true);
}

export async function registerUser(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

interface UserWithIdToken extends User {
  idToken: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserWithIdToken> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    const loginTime = Date.now();
    localStorage.setItem("loginTime", loginTime.toString());

    return {
      ...user,
      idToken,
    } as UserWithIdToken;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await auth.signOut();
    sessionStorage.removeItem("activeSession");
    localStorage.removeItem("startedBy")
  } catch (error) {
    console.error("Error logging out user:", error);
  }
}

export async function getFreshIdToken(): Promise<string> {
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }

  const idToken = await currentUser.getIdToken();
  const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
  const exp = tokenPayload.exp;
  const currentTime = Math.floor(Date.now() / 1000);

  if (exp < currentTime) {
    console.log("Token is expired, refreshing...");
    return await currentUser.getIdToken(true);
  }

  return idToken;
}

export async function checkLoginDuration() {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const loginTime = localStorage.getItem("loginTime");

  if (loginTime) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - parseInt(loginTime, 10);

    if (elapsedTime > SIX_HOURS) {
      logoutUser();
      return redirect("/");
    }
  }
  return null;
}
