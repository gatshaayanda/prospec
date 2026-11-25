import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, signInAnonymously, type User } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export { app };

/**
 * Gives each customer a persistent Firebase identity without forcing a password
 * sign-up. Firebase Auth persists this identity across reloads; Firestore queues
 * writes made while offline and synchronises them when connectivity returns.
 */
let customerAuthPromise: Promise<User> | null = null;
export function ensureCustomerAuth(): Promise<User> {
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
