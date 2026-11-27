import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { hasProspecAdminSession } from "@/lib/admin-session";
import { hasProspecGrowthSession } from "@/lib/growth-session";

const f = createUploadthing();

export const ourFileRouter = {
  // Customer enquiry attachments and the pre-owner business setup flow.
  // This route remains available to customers; it does not grant database access.
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.info("[Prospec] customer/setup attachment uploaded", {
      name: file.name,
      size: file.size,
      type: file.type,
      urlAvailable: Boolean(file.url || file.ufsUrl),
    });
  }),

  // Owner catalogue, announcement and special-offering media.
  // UploadThing calls this middleware before issuing upload credentials.
  adminMediaUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const owner = await hasProspecAdminSession(req);
      const growth = !owner && await hasProspecGrowthSession(req);
      if (!owner && !growth) {
        throw new UploadThingError("Open the Owner Briefcase or Growth Desk before uploading business media.");
      }
      return { workspace: growth ? "prospec-growth" as const : "prospec-owner" as const };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.info("[Prospec] owner media uploaded", {
        workspace: metadata.workspace,
        name: file.name,
        size: file.size,
        type: file.type,
        urlAvailable: Boolean(file.url || file.ufsUrl),
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
