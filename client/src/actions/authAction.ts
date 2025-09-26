import { auth } from "@firebaseConfig";
import { redirect } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { removeLoginTimeAction } from "@/actions/userActions";

// import { setPersistence, browserLocalPersistence } from "firebase/auth";
// setPersistence(auth, browserLocalPersistence);

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
   if (!currentUser) {
      console.warn("No user is currently logged in.");
      return;
    }

    const email = currentUser.email;

    await removeLoginTimeAction(String(email));
    await auth.signOut();
    localStorage.removeItem("activeSession");
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
    return await currentUser.getIdToken(true);
  }

  return idToken;
}

export async function checkLoginDuration() {
  // const SIX_HOURS = 6 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const loginTime = localStorage.getItem("loginTime");

  if (loginTime) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - parseInt(loginTime, 10);

    if (elapsedTime > TWENTY_FOUR_HOURS) {
      logoutUser();
      return redirect("/");
    }
  }
  return null;
}
