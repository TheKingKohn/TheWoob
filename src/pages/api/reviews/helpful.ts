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
	if (!user) return res.status(401).json({ error: "Authentication required" });

	const { reviewId } = req.body;
	if (!reviewId) return res.status(400).json({ error: "Review ID required" });

	try {
		// Optionally: prevent multiple votes per user per review (requires a join table)
		const review = await prisma.review.update({
			where: { id: reviewId },
			data: { helpful: { increment: 1 } },
		});
		return res.status(200).json({ helpful: review.helpful });
	} catch (error) {
		return res.status(500).json({ error: "Failed to update helpful count" });
	}
}
