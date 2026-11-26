import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { hasProspecAdminSession } from "@/lib/admin-session";

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
      if (!(await hasProspecAdminSession(req))) {
        throw new UploadThingError("Open the owner Briefcase and sign in before uploading business media.");
      }
      return { workspace: "prospec-owner" as const };
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
