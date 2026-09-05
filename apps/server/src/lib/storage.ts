import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { env } from "@DealFlow360/env/server";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadFile(
  file: string,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> {
  return cloudinary.uploader.upload(file, options);
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(publicId: string, options: Record<string, unknown> = {}): string {
  return cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
    secure: true,
    ...options,
  });
}

export { cloudinary };
