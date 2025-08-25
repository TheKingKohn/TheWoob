import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	const user = (session as any).user;
	if (!user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const form = formidable({
		uploadDir: path.join(process.cwd(), "public", "uploads"),
		keepExtensions: true,
	});
	form.parse(req, async (err: any, fields: any, files: any) => {
		if (err) {
			return res.status(500).json({ error: "Error parsing file" });
		}
		let file = files.file;
		if (Array.isArray(file)) file = file[0];
		if (!file) {
			return res.status(400).json({ error: "No file uploaded" });
		}
		const fileName = `${user.id}-listing-${Date.now()}${path.extname(file.originalFilename || file.filepath)}`;
		const destPath = path.join(process.cwd(), "public", "uploads", fileName);
		fs.renameSync(file.filepath, destPath);
		const imageUrl = `/uploads/${fileName}`;
		res.status(200).json({ success: true, image: imageUrl });
	});
}
