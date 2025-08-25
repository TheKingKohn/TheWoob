import { prisma } from "./prisma";

export interface UserRating {
	averageRating: number;
	totalReviews: number;
	ratingBreakdown: { [key: number]: number }; // 1-5 star counts
}

export async function getUserRating(userId: string): Promise<UserRating> {
	const reviews = await (prisma as any).review.findMany({
		where: { revieweeId: userId },
		select: { rating: true },
	});

	if (reviews.length === 0) {
		return {
			averageRating: 0,
			totalReviews: 0,
			ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
		};
	}

	const totalReviews = reviews.length;
	const totalRating = reviews.reduce(
		(sum: number, review: any) => sum + review.rating,
		0,
	);
	const averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Round to 1 decimal

	// Count ratings by star level
	const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	reviews.forEach((review: any) => {
		ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++;
	});

	return {
		averageRating,
		totalReviews,
		ratingBreakdown,
	};
}

export async function canUserReview(
	reviewerId: string,
	revieweeId: string,
	orderId?: string,
): Promise<boolean> {
	// Users can't review themselves
	if (reviewerId === revieweeId) return false;

	// If orderId is provided, check if review already exists for this transaction
	if (orderId) {
		const existingReview = await (prisma as any).review.findUnique({
			where: {
				reviewerId_revieweeId_orderId: {
					reviewerId,
					revieweeId,
					orderId,
				},
			},
		});
		return !existingReview;
	}

	// For general user reviews (not transaction-specific), allow multiple reviews
	// but limit to one per 30 days to prevent spam
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const recentReview = await (prisma as any).review.findFirst({
		where: {
			reviewerId,
			revieweeId,
			orderId: null,
			createdAt: { gte: thirtyDaysAgo },
		},
	});

	return !recentReview;
}

export async function createReview(data: {
	reviewerId: string;
	revieweeId: string;
	rating: number;
	comment?: string;
	orderId?: string;
	listingId?: string;
	type?: string;
}) {
	// Validate rating
	if (data.rating < 1 || data.rating > 5) {
		throw new Error("Rating must be between 1 and 5");
	}

	// Check if user can review
	const canReview = await canUserReview(
		data.reviewerId,
		data.revieweeId,
		data.orderId,
	);
	if (!canReview) {
		throw new Error("You cannot review this user at this time");
	}

	return (prisma as any).review.create({
		data: {
			reviewerId: data.reviewerId,
			revieweeId: data.revieweeId,
			rating: data.rating,
			comment: data.comment || null,
			orderId: data.orderId || null,
			listingId: data.listingId || null,
			type: data.type || "user",
		},
		include: {
			reviewer: { select: { id: true, name: true, email: true } },
			listing: { select: { id: true, title: true } },
		},
	});
}

export function formatRating(rating: number): string {
	return rating.toFixed(1);
}

export function getRatingStars(rating: number): string {
	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 >= 0.5;
	const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

	return (
		"★".repeat(fullStars) + (hasHalfStar ? "☆" : "") + "☆".repeat(emptyStars)
	);
}

export function getRatingColor(rating: number): string {
	if (rating >= 4.5) return "text-green-400";
	if (rating >= 3.5) return "text-yellow-400";
	if (rating >= 2.5) return "text-orange-400";
	return "text-red-400";
}
