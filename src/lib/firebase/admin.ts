import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function serviceAccount() {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_KEY is not configured.");
  const parsed = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_ADMIN_KEY must contain project_id, client_email and private_key.");
  }
  if (parsed.project_id !== "theworks-f4957") throw new Error("Firebase Admin credential project does not match the configured Prospec project.");
  return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const app = getApps().find(item => item.name === "prospec-admin") || initializeApp({ credential: cert(serviceAccount()), projectId: "theworks-f4957" }, "prospec-admin");
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
