import { NextRequest, NextResponse } from "next/server";
import { hasProspecAdminSession } from "@/lib/admin-session";
import { getProspecAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function authorised() {
  return hasProspecAdminSession();
}

export async function GET() {
  if (!(await authorised())) return NextResponse.json({ error: "Owner session required." }, { status: 401 });
  try {
    const adminDb = getProspecAdminDb();
    const [storefront, enquiries] = await Promise.all([
      adminDb.collection("prospecPublic").doc("storefront").get(),
      adminDb.collection("prospecEnquiries").orderBy("createdAt", "desc").limit(500).get(),
    ]);
    return NextResponse.json({
      storefront: storefront.exists ? storefront.data() : null,
      enquiries: enquiries.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    });
  } catch {
    return NextResponse.json({ error: "Owner workspace data is temporarily unavailable. Check Firebase Admin configuration." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await authorised())) return NextResponse.json({ error: "Owner session required." }, { status: 401 });
  try {
    const adminDb = getProspecAdminDb();
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "storefront" && body.storefront && typeof body.storefront === "object") {
      const value = body.storefront as Record<string, unknown>;
      const services = Array.isArray(value.services) ? value.services.slice(0, 200) : [];
      await adminDb.collection("prospecPublic").doc("storefront").set({
        services,
        availability: ["available", "limited", "unavailable"].includes(String(value.availability)) ? value.availability : "available",
        announcement: typeof value.announcement === "string" ? value.announcement.slice(0, 2000) : "",
        announcementActive: value.announcementActive === true,
        announcementImage: typeof value.announcementImage === "string" ? value.announcementImage.slice(0, 2000) : "",
        rewardActive: value.rewardActive === true,
        rewardTitle: typeof value.rewardTitle === "string" ? value.rewardTitle.slice(0, 120) : "",
        rewardDescription: typeof value.rewardDescription === "string" ? value.rewardDescription.slice(0, 500) : "",
        rewardImage: typeof value.rewardImage === "string" && /^https:\/\//i.test(value.rewardImage) ? value.rewardImage.slice(0, 2000) : "",
        discountAmount: typeof value.discountAmount === "number" && Number.isFinite(value.discountAmount) && value.discountAmount >= 0 && value.discountAmount <= 5000 ? value.discountAmount : 0,
        receiptProfile: value.receiptProfile && typeof value.receiptProfile === "object" ? {
          legalName: typeof (value.receiptProfile as Record<string, unknown>).legalName === "string" ? String((value.receiptProfile as Record<string, unknown>).legalName).slice(0, 120) : "Prospec Group",
          registration: typeof (value.receiptProfile as Record<string, unknown>).registration === "string" ? String((value.receiptProfile as Record<string, unknown>).registration).slice(0, 80) : "",
          address: typeof (value.receiptProfile as Record<string, unknown>).address === "string" ? String((value.receiptProfile as Record<string, unknown>).address).slice(0, 300) : "",
          footer: typeof (value.receiptProfile as Record<string, unknown>).footer === "string" ? String((value.receiptProfile as Record<string, unknown>).footer).slice(0, 500) : "Thank you for your business.",
        } : null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "enquiry" && typeof body.id === "string" && body.patch && typeof body.patch === "object") {
      const patch = body.patch as Record<string, unknown>;
      const allowed = ["status", "statusUpdatedAt", "completedAt", "price", "quotedPrice", "quoteRequired", "messages", "paymentStatus", "paidAmount", "paidAt", "receiptNo"];
      const safe = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key)));
      await adminDb.collection("prospecEnquiries").doc(body.id).update({ ...safe, updatedAt: new Date().toISOString() });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported owner action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "The owner update could not be saved." }, { status: 503 });
  }
}
