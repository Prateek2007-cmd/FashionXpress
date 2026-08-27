import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth";
import { uploadToCloudinary } from "../lib/cloudinary";

const router: IRouter = Router();

// Store file in memory, then stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max (supports HD videos)
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/mov", "video/avi", "video/webm", "video/quicktime",
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only image or video files are allowed"));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/upload
 * Accepts: multipart/form-data with field "file" (image or video)
 * Optional query: ?folder=custom-folder-name
 * Returns: { url, publicId, resourceType, format, bytes, width?, height? }
 */
router.post(
  "/upload",
  requireAuth("admin", "merchant"),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Check Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      res.status(503).json({
        error: "Image upload service not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
      return;
    }

    try {
      const folder = (req.query.folder as string) || "fashion-xpress/products";
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder);

      res.json({
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
    } catch (err: any) {
      console.error("Cloudinary upload error:", err.message);
      if (err.message?.includes("credentials missing")) {
        res.status(503).json({ error: "Upload service not configured. Add Cloudinary credentials to server environment." });
      } else {
        res.status(500).json({ error: "Upload failed. Please try again." });
      }
    }
  }
);

/**
 * POST /api/upload/multiple
 * Accepts up to 10 files at once (images or videos)
 * Returns: { files: [{ url, publicId, ... }] }
 */
router.post(
  "/upload/multiple",
  requireAuth("admin", "merchant"),
  upload.array("files", 10),
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      res.status(503).json({ error: "Upload service not configured." });
      return;
    }

    try {
      const folder = (req.query.folder as string) || "fashion-xpress/products";
      const results = await Promise.all(
        files.map(f => uploadToCloudinary(f.buffer, f.mimetype, folder))
      );
      res.json({ files: results });
    } catch (err: any) {
      console.error("Cloudinary multi-upload error:", err.message);
      res.status(500).json({ error: "One or more uploads failed. Please try again." });
    }
  }
);

export default router;
