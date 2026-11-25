import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, signInAnonymously, type User, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAr3rsLaFmEikskq1PEezvuPVtd5_S3yw",
  authDomain: "theworks-f4957.firebaseapp.com",
  projectId: "theworks-f4957",
  storageBucket: "theworks-f4957.firebasestorage.app",
  messagingSenderId: "529404632321",
  appId: "1:529404632321:web:9c10dedab931e2733e8f00",
  measurementId: "G-QX3W86BM93",
};

export const hasFirebaseWebConfig = true;
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function getProspecAuth() {
  if (typeof window === "undefined") throw new Error("Firebase Auth is available in the browser only.");
  authInstance ||= getAuth(app);
  return authInstance;
}

export function getProspecDb() {
  if (typeof window === "undefined") throw new Error("Firestore is available in the browser only.");
  firestoreInstance ||= initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return firestoreInstance;
}

/**
 * A persistent anonymous Firebase identity keeps the customer experience
 * passwordless. Firestore caches reads and queues supported writes offline.
 */
let customerAuthPromise: Promise<User> | null = null;
export function ensureCustomerAuth(): Promise<User> {
  const auth = getProspecAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!customerAuthPromise) {
    customerAuthPromise = (async () => {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInAnonymously(auth);
      return result.user;
    })().catch(error => {
      customerAuthPromise = null;
      throw error;
    });
  }
  return customerAuthPromise;
}
