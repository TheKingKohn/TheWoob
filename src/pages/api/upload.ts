import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

// Configure multer for file uploads
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
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit for digital files
	},
	fileFilter: (req, file, cb) => {
		const allowedImageTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		];
		const allowedVideoTypes = [
			"video/mp4",
			"video/mov",
			"video/avi",
			"video/quicktime",
		];
		const allowedDigitalTypes = [
			"application/pdf",
			"application/zip",
			"application/x-zip-compressed",
			"image/jpeg",
			"image/png",
			"image/webp",
			"text/plain",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		if (req.query.type === "digital") {
			if (allowedDigitalTypes.includes(file.mimetype)) {
				cb(null, true);
			} else {
				cb(new Error("Invalid file type for digital product"));
			}
		} else if (
			allowedImageTypes.includes(file.mimetype) ||
			allowedVideoTypes.includes(file.mimetype)
		) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Only JPEG, PNG, WebP images and MP4, MOV, AVI videos are allowed",
				),
			);
		}
	},
});

// Disable default body parser for file uploads
export const config = {
	api: {
		bodyParser: false,
	},
};

const uploadMiddleware = upload.fields([
	{ name: "images", maxCount: 5 },
	{ name: "video", maxCount: 1 },
	{ name: "digitalFile", maxCount: 1 },
]);

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	return new Promise((resolve) => {
		uploadMiddleware(req as any, res as any, (err: any) => {
			if (err) {
				console.error("Upload error:", err);
				res.status(400).json({ error: err.message });
				resolve(undefined);
				return;
			}
			const files = (req as any).files as {
				[fieldname: string]: Express.Multer.File[];
			};
			const response: any = { success: true };
			if (req.query.type === "digital") {
				if (!files.digitalFile || files.digitalFile.length === 0) {
					res.status(400).json({ error: "No digital file uploaded" });
					resolve(undefined);
					return;
				}
				const fileUrl = `/uploads/${files.digitalFile[0].filename}`;
				response.url = fileUrl;
				response.name = files.digitalFile[0].originalname;
				res.status(200).json(response);
				resolve(undefined);
				return;
			}
			if (
				!files ||
				((!files.images || files.images.length === 0) &&
					(!files.video || files.video.length === 0))
			) {
				res.status(400).json({ error: "No files uploaded" });
				resolve(undefined);
				return;
			}
			// Handle image uploads
			if (files.images && files.images.length > 0) {
				const imageUrls = files.images.map(
					(file) => `/uploads/${file.filename}`,
				);
				response.images = imageUrls;
				response.count = files.images.length;
			}
			// Handle video upload
			if (files.video && files.video.length > 0) {
				const videoUrl = `/uploads/${files.video[0].filename}`;
				response.url = videoUrl; // For video upload component compatibility
				response.video = videoUrl;
			}
			res.status(200).json(response);
			resolve(undefined);
		});
	});
}
