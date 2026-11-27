import { NextRequest, NextResponse } from "next/server";
import { getProspecAdminAuth, getProspecAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { guestIdToken?: unknown; googleIdToken?: unknown };
    if (typeof body.guestIdToken !== "string" || typeof body.googleIdToken !== "string" || body.guestIdToken.length > 10000 || body.googleIdToken.length > 10000) {
      return NextResponse.json({ error: "A valid guest session and Google sign-in are required." }, { status: 400 });
    }

    const adminAuth = getProspecAdminAuth();
    const [guest, google] = await Promise.all([
      adminAuth.verifyIdToken(body.guestIdToken, true),
      adminAuth.verifyIdToken(body.googleIdToken, true),
    ]);
    if (guest.uid === google.uid) return NextResponse.json({ ok: true, migrated: 0 });
    if (guest.firebase?.sign_in_provider !== "anonymous") {
      return NextResponse.json({ error: "The previous session is not an anonymous Prospec guest account." }, { status: 403 });
    }
    if (google.firebase?.sign_in_provider !== "google.com" || google.email_verified !== true) {
      return NextResponse.json({ error: "Use a verified Google account to recover your Prospec customer records." }, { status: 403 });
    }

    const db = getProspecAdminDb();
    let migrated = 0;
    for (;;) {
      const batchSnapshot = await db.collection("prospecEnquiries")
        .where("customerId", "==", guest.uid)
        .limit(400)
        .get();
      if (batchSnapshot.empty) break;
      const batch = db.batch();
      for (const enquiry of batchSnapshot.docs) {
        batch.update(enquiry.ref, { customerId: google.uid });
      }
      await batch.commit();
      migrated += batchSnapshot.size;
    }

    const guestProfileRef = db.collection("prospecCustomers").doc(guest.uid);
    const googleProfileRef = db.collection("prospecCustomers").doc(google.uid);
    const [guestProfileSnapshot, googleProfileSnapshot] = await Promise.all([guestProfileRef.get(), googleProfileRef.get()]);
    const guestProfile = guestProfileSnapshot.exists ? guestProfileSnapshot.data() || {} : {};
    const googleProfile = googleProfileSnapshot.exists ? googleProfileSnapshot.data() || {} : {};
    await googleProfileRef.set({
      uid: google.uid,
      name: typeof googleProfile.name === "string" && googleProfile.name ? googleProfile.name : (typeof guestProfile.name === "string" ? guestProfile.name : (google.name || "")),
      email: typeof googleProfile.email === "string" && googleProfile.email ? googleProfile.email : (google.email || ""),
      phone: typeof googleProfile.phone === "string" && googleProfile.phone ? googleProfile.phone : (typeof guestProfile.phone === "string" ? guestProfile.phone : ""),
      createdAt: typeof googleProfile.createdAt === "string" ? googleProfile.createdAt : (typeof guestProfile.createdAt === "string" ? guestProfile.createdAt : new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    if (guestProfileSnapshot.exists) await guestProfileRef.delete();

    return NextResponse.json({ ok: true, migrated });
  } catch {
    return NextResponse.json({ error: "Prospec could not securely transfer the previous guest records. Keep the original device session and contact Prospec before retrying." }, { status: 503 });
  }
}
