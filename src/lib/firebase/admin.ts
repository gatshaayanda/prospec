import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let prospecAdminApp: App | undefined;

function getAppInstance() {
  if (prospecAdminApp) return prospecAdminApp;
  const existing = getApps().find(item => item.name === "prospec-admin");
  if (existing) { prospecAdminApp = existing; return existing; }
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_KEY is not configured.");
  const parsed = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_ADMIN_KEY must contain project_id, client_email and private_key.");
  }
  if (parsed.project_id !== "theworks-f4957") throw new Error("Firebase Admin credential project does not match the configured Prospec project.");
  prospecAdminApp = initializeApp({
    credential: cert({ ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") }),
    projectId: "theworks-f4957",
  }, "prospec-admin");
  return prospecAdminApp;
}

export function getProspecAdminAuth() { return getAuth(getAppInstance()); }
export function getProspecAdminDb() { return getFirestore(getAppInstance()); }
