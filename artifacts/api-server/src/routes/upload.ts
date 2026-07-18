import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/upload",
  requireAuth("admin", "merchant"),
  upload.single("file"),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const base64 = req.file.buffer.toString("base64");
    const url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ url });
  }
);

export default router;
