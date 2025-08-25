import type { NextApiRequest, NextApiResponse } from "next";
import { getUserRating } from "../../../lib/reviews";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { userId } = req.query;

	if (!userId || typeof userId !== "string") {
		return res.status(400).json({ error: "Valid user ID required" });
	}

	try {
		const rating = await getUserRating(userId);
		res.status(200).json(rating);
	} catch (error) {
		console.error("Get rating error:", error);
		res.status(500).json({ error: "Failed to fetch rating" });
	}
}
