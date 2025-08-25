import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import { createReview, canUserReview } from "../../lib/reviews";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return res.status(401).json({ error: "Authentication required" });
	}

	if (req.method === "POST") {
		const { revieweeId, rating, comment, orderId, listingId, type } = req.body;

		if (!revieweeId || !rating) {
			return res
				.status(400)
				.json({ error: "Reviewee ID and rating are required" });
		}

		if (rating < 1 || rating > 5) {
			return res.status(400).json({ error: "Rating must be between 1 and 5" });
		}

		try {
			const review = await createReview({
				reviewerId: user.id,
				revieweeId,
				rating: parseInt(rating),
				comment,
				orderId,
				listingId,
				type,
			});

			res.status(201).json({ review });
		} catch (error: any) {
			console.error("Create review error:", error);
			res
				.status(400)
				.json({ error: error.message || "Failed to create review" });
		}
	} else if (req.method === "GET") {
		const { userId, page = 1, limit = 10, sort = "recent" } = req.query;

		if (!userId) {
			return res.status(400).json({ error: "User ID required" });
		}

		try {
			const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

			let orderBy;
			if (sort === "highest") orderBy = { rating: "desc" };
			else if (sort === "lowest") orderBy = { rating: "asc" };
			else orderBy = { createdAt: "desc" };
			const reviews = await (prisma as any).review.findMany({
				where: { revieweeId: userId as string },
				include: {
					reviewer: {
						select: { id: true, name: true, email: true },
					},
					listing: {
						select: { id: true, title: true },
					},
				},
				orderBy,
				skip,
				take: parseInt(limit as string),
			});

			const totalReviews = await (prisma as any).review.count({
				where: { revieweeId: userId as string },
			});

			res.status(200).json({
				reviews,
				totalReviews,
				totalPages: Math.ceil(totalReviews / parseInt(limit as string)),
				currentPage: parseInt(page as string),
			});
		} catch (error) {
			console.error("Get reviews error:", error);
			res.status(500).json({ error: "Failed to fetch reviews" });
		}
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
