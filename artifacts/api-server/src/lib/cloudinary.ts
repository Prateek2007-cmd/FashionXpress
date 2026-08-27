import { v2 as cloudinary } from "cloudinary";

// Configured lazily so missing env vars don't crash at startup
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

export interface CloudinaryUploadResult {
  url: string;        // HTTPS optimized URL
  publicId: string;   // For future deletions/transformations
  resourceType: "image" | "video" | "raw";
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer  Raw file bytes
 * @param mimeType e.g. "image/jpeg", "video/mp4"
 * @param folder  Cloudinary folder, e.g. "fashion-xpress/products"
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  folder = "fashion-xpress/products"
): Promise<CloudinaryUploadResult> {
  const cld = getCloudinary();

  const isVideo = mimeType.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Auto-quality and format optimization
        transformation: isVideo
          ? [{ quality: "auto", fetch_format: "auto" }]
          : [{ quality: "auto", fetch_format: "auto" }],
        // Generate a secure HTTPS URL
        secure: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type as "image" | "video" | "raw",
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId, { resource_type: resourceType });
}
