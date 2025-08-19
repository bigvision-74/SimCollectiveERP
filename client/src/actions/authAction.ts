
import { auth } from "@firebaseConfig";
import { redirect } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
setPersistence(auth, browserSessionPersistence);

let currentUser: User | null = null;
let cleanupInProgress = false;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

async function cleanupFirebaseStorage() {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  
  try {
    const databases = await window.indexedDB.databases();
    for (const db of databases) {
      if (db.name?.includes('firebase') || db.name?.includes('fcm')) {
        window.indexedDB.deleteDatabase(db.name!);
      }
    }
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:authUser:') || key.startsWith('fcm:')) {
        localStorage.removeItem(key);
      }
    });
    
  } catch (error) {
    console.error('Error cleaning up Firebase storage:', error);
  } finally {
    cleanupInProgress = false;
  }
}


function handleActualBrowserClose() {
  if (document.visibilityState === 'visible') {
    try {
      auth.signOut().catch(() => {});
      cleanupFirebaseStorage().catch(() => {});
      localStorage.removeItem('loginTime');
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            if (registration.scope.includes('firebase')) {
              registration.unregister().catch(() => {});
            }
          });
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error during browser close cleanup:', error);
    }
  }
}

function handleBrowserClose() {
  try {
    auth.signOut().catch(() => {});
    
    cleanupFirebaseStorage().catch(() => {});
    
    localStorage.removeItem('loginTime');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.scope.includes('firebase')) {
            registration.unregister().catch(() => {});
          }
        });
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Error during browser close cleanup:', error);
  }
}

// setupBrowserCloseHandler();

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


// export function checkLoginDuration() {
//   const navigate = useNavigate();
//   const SIX_HOURS = 6 * 60 * 60 * 1000;

//   const loginTime = localStorage.getItem("loginTime");

//   if (loginTime) {
//     const currentTime = Date.now();
//     const elapsedTime = currentTime - parseInt(loginTime, 10);

//     if (elapsedTime > SIX_HOURS) {
//       logoutUser();
//       navigate("/");
//     }
//   }

//   return null;
// }


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
