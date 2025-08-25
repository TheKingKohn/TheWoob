import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Simple security check - only in development
	if (process.env.NODE_ENV === "production") {
		return res.status(403).json({ error: "Not available in production" });
	}

	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	try {
		const user = await prisma.user.findUnique({ where: { email } });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const updatedUser = await prisma.user.update({
			where: { email },
			data: { role: "admin" },
		});

		res.status(200).json({
			message: "User promoted to admin successfully",
			user: { email: updatedUser.email, role: updatedUser.role },
		});
	} catch (error) {
		console.error("Promote admin error:", error);
		res.status(500).json({ error: "Failed to promote user to admin" });
	}
}
