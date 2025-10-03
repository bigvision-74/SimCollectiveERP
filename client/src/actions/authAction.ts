import { redirect } from "react-router-dom";

import { auth } from "@firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  User,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import axios from "axios";
import env from "../../env";

const SAVED_ACCOUNTS_KEY = "savedFirebaseAccounts";
const RE_AUTH_TOKENS_KEY = "firebaseReAuthTokens";
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;


interface SavedAccount {
  email: string;
  displayName: string | null;
}

interface ReAuthData {
  token: string;
  timestamp: number;
}

export function saveReAuthToken(email: string, token: string) {
  const tokensStr = localStorage.getItem(RE_AUTH_TOKENS_KEY);
  const tokens = tokensStr ? JSON.parse(tokensStr) : {};

  const data: ReAuthData = {
    token: token,
    timestamp: Date.now(),
  };

  tokens[email] = data;
  localStorage.setItem(RE_AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

export function getReAuthToken(email: string): string | null {
  const tokensStr = localStorage.getItem(RE_AUTH_TOKENS_KEY);
  const tokens = tokensStr ? JSON.parse(tokensStr) : {};

  const data: ReAuthData | undefined = tokens[email];

  if (!data) {
    return null;
  }

  const isExpired = Date.now() - data.timestamp > TWENTY_FOUR_HOURS_IN_MS;

  if (isExpired) {
    console.log(`Re-auth token for ${email} has expired. Removing.`);
    removeReAuthToken(email);
    return null;
  }

  return data.token;
}

export function removeReAuthToken(email: string) {
  const tokensStr = localStorage.getItem(RE_AUTH_TOKENS_KEY);
  let tokens = tokensStr ? JSON.parse(tokensStr) : {};
  delete tokens[email];
  localStorage.setItem(RE_AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

function addAccountToList(user: User) {
  if (!user.email) return;

  const newAccount: SavedAccount = {
    email: user.email,
    displayName: user.displayName || user.email,
  };

  const savedAccountsStr = localStorage.getItem(SAVED_ACCOUNTS_KEY);
  let accounts: SavedAccount[] = savedAccountsStr
    ? JSON.parse(savedAccountsStr)
    : [];

  accounts = accounts.filter((acc) => acc.email !== newAccount.email);
  accounts.unshift(newAccount);

  const MAX_ACCOUNTS = 5;
  accounts = accounts.slice(0, MAX_ACCOUNTS);

  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSavedAccounts(): SavedAccount[] {
  const savedAccountsStr = localStorage.getItem(SAVED_ACCOUNTS_KEY);
  return savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
}

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
  password: string,
  rememberMe: boolean
): Promise<UserWithIdToken> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    addAccountToList(user);
    const idToken = await user.getIdToken();

    if (rememberMe) {
      const response = await axios.post(
        `${env.REACT_APP_BACKEND_URL}/generate-reauth-token`,
        {},
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      if (response.data.reAuthToken) {
        saveReAuthToken(user.email!, response.data.reAuthToken);
      }
    }

    return { ...user, idToken } as UserWithIdToken;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

export async function reauthenticateWithToken(
  email: string
): Promise<User | null> {
  try {
    const reAuthToken = getReAuthToken(email);
    if (!reAuthToken) {
      console.log("No re-auth token found in Local Storage for this user.");
      return null;
    }

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/re-authenticate`,
      { email, reAuthToken }
    );

    if (response.data.customToken) {
      const userCredential = await signInWithCustomToken(
        auth,
        response.data.customToken
      );

      addAccountToList(userCredential.user);
      return userCredential.user;
    }
    return null;
  } catch (error) {
    console.log("Re-authentication failed, proceeding to manual login.", error);
    removeReAuthToken(email);
    return null;
  }
}

export async function logoutUser() {
  try {
    await auth.signOut();
    localStorage.removeItem("activeSession");
    localStorage.removeItem("startedBy");
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
