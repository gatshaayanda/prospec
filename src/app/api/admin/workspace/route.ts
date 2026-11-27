import { NextRequest, NextResponse } from "next/server";
import { hasProspecAdminSession } from "@/lib/admin-session";
import { hasProspecGrowthSession } from "@/lib/growth-session";
import { getProspecAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function authorised(request?: Request) {
  return (await hasProspecAdminSession(request)) || (await hasProspecGrowthSession(request));
}

export async function GET(request: NextRequest) {
  const owner = await hasProspecAdminSession(request);
  const growth = !owner && await hasProspecGrowthSession(request);
  if (!owner && !growth) return NextResponse.json({ error: "Authorised workspace session required." }, { status: 401 });
  try {
    const adminDb = getProspecAdminDb();
    const storefrontRef = adminDb.collection("prospecPublic").doc("storefront");
    const [storefront, enquiries] = await Promise.all([
      storefrontRef.get(),
      owner ? adminDb.collection("prospecEnquiries").orderBy("createdAt", "desc").limit(500).get() : Promise.resolve(null),
    ]);
    return NextResponse.json({
      storefront: storefront.exists ? storefront.data() : null,
      enquiries: enquiries?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [],
    });
  } catch {
    return NextResponse.json({ error: "Owner workspace data is temporarily unavailable. Check Firebase Admin configuration." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const owner = await hasProspecAdminSession(request);
  const growth = !owner && await hasProspecGrowthSession(request);
  if (!owner && !growth) return NextResponse.json({ error: "Authorised workspace session required." }, { status: 401 });
  try {
    const adminDb = getProspecAdminDb();
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "storefront" && body.storefront && typeof body.storefront === "object") {
      if (growth && typeof body.division !== "string") return NextResponse.json({ error: "Select a working division before publishing." }, { status: 400 });
      const value = body.storefront as Record<string, unknown>;
      const services = Array.isArray(value.services) ? value.services.slice(0, 200) : [];
      const existingSnapshot = growth ? await adminDb.collection("prospecPublic").doc("storefront").get() : null;
      const existingData = existingSnapshot?.data() || {};
      const existingServices = Array.isArray(existingData.services) ? existingData.services as Record<string, unknown>[] : [];
      const division = typeof body.division === "string" ? body.division : "";
      const allowedDivisions = ["Prospec AG", "Prospec Supplies", "Prospec NFC", "Prospec AG Printing"];
      if (growth && !allowedDivisions.includes(division)) return NextResponse.json({ error: "That division is not available to Growth Desk." }, { status: 403 });
      if (growth) {
        const existingOutsideDivision = existingServices.filter(item => item.industry !== division);
        const submittedOutsideDivision = services.filter(item => item.industry !== division);
        if (JSON.stringify(existingOutsideDivision) !== JSON.stringify(submittedOutsideDivision)) return NextResponse.json({ error: "Growth Desk can only change catalogue items in the selected division." }, { status: 403 });
        if (services.some(item => !item || typeof item !== "object" || typeof item.id !== "string" || typeof item.industry !== "string")) return NextResponse.json({ error: "Invalid catalogue item." }, { status: 400 });
      }
      const savedStorefront = {
        services,
        availability: growth ? (existingData.availability === "limited" || existingData.availability === "unavailable" ? existingData.availability : "available") : ["available", "limited", "unavailable"].includes(String(value.availability)) ? value.availability : "available",
        announcement: typeof value.announcement === "string" ? value.announcement.slice(0, 2000) : "",
        announcementActive: value.announcementActive === true,
        announcementImage: typeof value.announcementImage === "string" ? value.announcementImage.slice(0, 2000) : "",
        rewardActive: value.rewardActive === true,
        rewardTitle: typeof value.rewardTitle === "string" ? value.rewardTitle.slice(0, 120) : "",
        rewardDescription: typeof value.rewardDescription === "string" ? value.rewardDescription.slice(0, 500) : "",
        rewardImage: typeof value.rewardImage === "string" && /^https:\/\//i.test(value.rewardImage) ? value.rewardImage.slice(0, 2000) : "",
        discountAmount: typeof value.discountAmount === "number" && Number.isFinite(value.discountAmount) && value.discountAmount >= 0 && value.discountAmount <= 5000 ? value.discountAmount : 0,
        receiptProfile: growth ? (existingData.receiptProfile || null) : value.receiptProfile && typeof value.receiptProfile === "object" ? {
          legalName: typeof (value.receiptProfile as Record<string, unknown>).legalName === "string" ? String((value.receiptProfile as Record<string, unknown>).legalName).slice(0, 120) : "Prospec Group",
          registration: typeof (value.receiptProfile as Record<string, unknown>).registration === "string" ? String((value.receiptProfile as Record<string, unknown>).registration).slice(0, 80) : "",
          address: typeof (value.receiptProfile as Record<string, unknown>).address === "string" ? String((value.receiptProfile as Record<string, unknown>).address).slice(0, 300) : "",
          footer: typeof (value.receiptProfile as Record<string, unknown>).footer === "string" ? String((value.receiptProfile as Record<string, unknown>).footer).slice(0, 500) : "Thank you for your business.",
        } : null,
        updatedAt: new Date().toISOString(),
      };
      const storefrontRef = adminDb.collection("prospecPublic").doc("storefront");
      await storefrontRef.set(savedStorefront, { merge: true });
      // Read the document back from Firestore. The owner UI only confirms a
      // publish after the persisted record (including media URLs) is verified.
      const persistedSnapshot = await storefrontRef.get();
      if (!persistedSnapshot.exists) {
        return NextResponse.json({ error: "The Store write completed but the saved document could not be read back." }, { status: 503 });
      }
      return NextResponse.json({ ok: true, storefront: persistedSnapshot.data() });
    }
    if (body.action === "enquiry" && typeof body.id === "string" && body.patch && typeof body.patch === "object") {
      if (growth) return NextResponse.json({ error: "Growth Desk does not have permission to edit customer jobs or finance records." }, { status: 403 });
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
