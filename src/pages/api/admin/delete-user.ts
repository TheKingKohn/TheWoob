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

	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({ error: "User ID is required" });
	}

	if (userId === user.id) {
		return res.status(400).json({ error: "Cannot delete yourself" });
	}

	try {
		// Delete user and all related data in transaction
		await prisma.$transaction(async (tx) => {
			// Delete messages sent by this user
			await tx.message.deleteMany({ where: { senderId: userId } });

			// Delete conversations as buyer
			await tx.conversation.deleteMany({ where: { buyerId: userId } });

			// Delete conversations as seller
			await tx.conversation.deleteMany({ where: { sellerId: userId } });

			// Delete orders made by this user
			await tx.order.deleteMany({ where: { buyerId: userId } });

			// Delete listings created by this user
			await tx.listing.deleteMany({ where: { sellerId: userId } });

			// Finally delete the user
			await tx.user.delete({ where: { id: userId } });
		});

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Admin delete user error:", error);
		res.status(500).json({ error: "Failed to delete user" });
	}
}
