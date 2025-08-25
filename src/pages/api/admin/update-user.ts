import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user || user.role !== "admin") {
		return res.status(403).json({ error: "Admin access required" });
	}

	const { userId, role, name } = req.body;

	if (!userId) {
		return res.status(400).json({ error: "User ID is required" });
	}

	const updateData: any = {};
	if (role) {
		const validRoles = ["user", "admin", "moderator", "banned"];
		if (!validRoles.includes(role)) {
			return res.status(400).json({ error: "Invalid role" });
		}
		updateData.role = role;
	}
	if (typeof name === "string") {
		updateData.name = name.trim();
	}
	if (Object.keys(updateData).length === 0) {
		return res.status(400).json({ error: "No valid fields to update" });
	}

	try {
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: { id: true, email: true, name: true, role: true },
		});

		res.status(200).json({
			message: "User updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Admin update user error:", error);
		res.status(500).json({ error: "Failed to update user" });
	}
}
