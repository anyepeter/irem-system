import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAvatar(
  file: File
): Promise<{ url: string } | { error: string }> {
  try {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size exceeds 5MB limit" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "system-avatars",
      transformation: [
        { width: 256, height: 256, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      resource_type: "image",
    });

    return { url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: "Failed to upload image. Please try again." };
  }
}

export async function uploadProductImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  try {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size exceeds 5MB limit" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "system-products",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
      resource_type: "image",
    });

    return { url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary product upload error:", error);
    return { error: "Failed to upload image. Please try again." };
  }
}

export async function deleteAvatar(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}
