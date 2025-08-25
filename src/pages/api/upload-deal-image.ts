import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(process.cwd(), "public", "uploads");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Only JPEG, PNG, WebP images are allowed"));
		}
	},
});

export const config = { api: { bodyParser: false } };

const uploadMiddleware = upload.single("dealImage");

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user || user.role !== "admin") {
		return res.status(401).json({ error: "Admin access required" });
	}
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	return new Promise((resolve) => {
		uploadMiddleware(req as any, res as any, (err: any) => {
			if (err) {
				res.status(400).json({ error: err.message });
				resolve(undefined);
				return;
			}
			const file = (req as any).file;
			if (!file) {
				res.status(400).json({ error: "No file uploaded" });
				resolve(undefined);
				return;
			}
			const imageUrl = `/uploads/${file.filename}`;
			res.status(200).json({ imageUrl });
			resolve(undefined);
		});
	});
}
