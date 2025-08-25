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

	const { listingId } = req.body;

	if (!listingId) {
		return res.status(400).json({ error: "Listing ID is required" });
	}

	try {
		// Delete listing and related data in transaction
		await prisma.$transaction(async (tx) => {
			// Delete conversations for this listing
			await tx.conversation.deleteMany({ where: { listingId } });

			// Delete orders for this listing
			await tx.order.deleteMany({ where: { listingId } });

			// Delete the listing
			await tx.listing.delete({ where: { id: listingId } });
		});

		res.status(200).json({ message: "Listing deleted successfully" });
	} catch (error) {
		console.error("Admin delete listing error:", error);
		res.status(500).json({ error: "Failed to delete listing" });
	}
}
