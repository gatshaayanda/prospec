import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

async function customerUid(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.prospecAdmin === true) throw new Error("CUSTOMER_SESSION_REQUIRED");
  return decoded.uid;
}

export async function GET(request: NextRequest) {
  try {
    const uid = await customerUid(request);
    const [profile, enquiries] = await Promise.all([
      adminDb.collection("prospecCustomers").doc(uid).get(),
      adminDb.collection("prospecEnquiries").where("customerId", "==", uid).orderBy("createdAt", "desc").get(),
    ]);
    return NextResponse.json({
      profile: profile.exists ? profile.data() : null,
      enquiries: enquiries.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "AUTH_REQUIRED" || message === "CUSTOMER_SESSION_REQUIRED" ? 401 : 503;
    return NextResponse.json({ error: status === 401 ? "A customer session is required." : "Customer records are temporarily unavailable." }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await customerUid(request);
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    if (action === "profile") {
      const profile = {
        uid,
        name: typeof body.name === "string" ? body.name.trim().slice(0, 100) : "",
        email: typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "",
        phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "",
        updatedAt: new Date().toISOString(),
      };
      if (!profile.name || !profile.email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
      const ref = adminDb.collection("prospecCustomers").doc(uid);
      await ref.set({ ...profile, createdAt: FieldValue.serverTimestamp() }, { merge: true });
      return NextResponse.json({ ok: true, profile });
    }
    if (action === "enquiry") {
      const items = Array.isArray(body.serviceItems) ? body.serviceItems.slice(0, 40) : [];
      if (!items.length || !items.every(item => item && typeof item.name === "string" && typeof item.price === "number" && item.price >= 0)) {
        return NextResponse.json({ error: "Choose at least one valid catalogue item." }, { status: 400 });
      }
      const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
      if (!customerName || !email) return NextResponse.json({ error: "Your name and email are required." }, { status: 400 });
      const id = typeof body.id === "string" && /^[a-zA-Z0-9_-]{6,100}$/.test(body.id) ? body.id : undefined;
      const ref = id ? adminDb.collection("prospecEnquiries").doc(id) : adminDb.collection("prospecEnquiries").doc();
      const createdAt = new Date().toISOString();
      const price = items.reduce((sum, item) => sum + Number(item.price), 0);
      const enquiry = {
        customerId: uid,
        customerName,
        email,
        whatsapp: typeof body.whatsapp === "string" ? body.whatsapp.slice(0, 40) : "",
        notificationOptIn: body.notificationOptIn === true,
        serviceId: String(body.serviceId || "").slice(0, 100),
        serviceName: items.map(item => String(item.name).slice(0, 100)).join(" + "),
        serviceItems: items.map(item => ({ id: String(item.id || "").slice(0, 100), name: String(item.name).slice(0, 100), price: Number(item.price), custom: item.custom === true })),
        quoteRequired: items.some(item => item.custom === true || Number(item.price) <= 0),
        price,
        dueDate: typeof body.dueDate === "string" ? body.dueDate.slice(0, 40) : "",
        brief: typeof body.brief === "string" ? body.brief.trim().slice(0, 5000) : "",
        status: "New request",
        createdAt,
        statusUpdatedAt: createdAt,
        messages: [],
      };
      await ref.create(enquiry);
      return NextResponse.json({ ok: true, enquiry: { id: ref.id, ...enquiry } }, { status: 201 });
    }
    if (action === "message") {
      const enquiryId = typeof body.enquiryId === "string" ? body.enquiryId : "";
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
      if (!enquiryId || !text) return NextResponse.json({ error: "A request and message are required." }, { status: 400 });
      const ref = adminDb.collection("prospecEnquiries").doc(enquiryId);
      const snap = await ref.get();
      if (!snap.exists || snap.data()?.customerId !== uid) return NextResponse.json({ error: "Request not found." }, { status: 404 });
      const message = { id: "MSG-" + Date.now().toString(36), from: "customer", text, createdAt: new Date().toISOString() };
      await ref.update({ messages: FieldValue.arrayUnion(message), updatedAt: new Date().toISOString() });
      return NextResponse.json({ ok: true, message });
    }
    return NextResponse.json({ error: "Unsupported customer action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "AUTH_REQUIRED" || message === "CUSTOMER_SESSION_REQUIRED" ? 401 : 503;
    return NextResponse.json({ error: status === 401 ? "A customer session is required." : "The customer update could not be saved." }, { status });
  }
}
