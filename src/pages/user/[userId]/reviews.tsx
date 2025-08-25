import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";
import {
	getUserRating,
	formatRating,
	getRatingStars,
	getRatingColor,
} from "../../../lib/reviews";
import Nav from "../../../components/Nav";
import { RatingBreakdown } from "../../../components/UserRating";
import { ReviewButton } from "../../../components/ReviewModal";

interface ReviewsPageProps {
	user: any;
	profileUser: any;
	userRating: any;
	authed: boolean;
}
export const getServerSideProps: GetServerSideProps = async ({
	req,
	res,
	params,
}) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	const userId = params?.userId as string;

	if (!userId) {
		return { notFound: true };
	}

	try {
		// Get the profile user
		const profileUser = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				image: true,
				bio: true,
				createdAt: true,
				listings: {
					where: { status: { not: "DELETED" } },
					select: {
						id: true,
						title: true,
						priceCents: true,
						status: true,
						createdAt: true,
						images: true,
					},
				},
			},
		});

		if (!profileUser) {
			return { notFound: true };
		}

		// Get user rating
		const userRating = await getUserRating(userId);

		return {
			props: {
				user: user || null,
				profileUser: JSON.parse(JSON.stringify(profileUser)),
				userRating,
				authed: !!user,
			},
		};
	} catch (error) {
		console.error("Error fetching user reviews:", error);
		return { notFound: true };
	}
};

export default function UserReviewsPage({
	user,
	profileUser,
	userRating,
	authed,
}: ReviewsPageProps) {
	const router = useRouter();
	const { userId } = router.query;
	const [reviews, setReviews] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [sort, setSort] = useState<"recent" | "highest" | "lowest">("recent");

	useEffect(() => {
		if (userId) {
			fetchReviews(1, sort);
		}
	}, [userId, sort]);

	async function fetchReviews(page: number, sortType = sort) {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/reviews?userId=${userId}&page=${page}&limit=10&sort=${sortType}`,
			);
			if (response.ok) {
				const data = await response.json();
				setReviews(data.reviews);
				setCurrentPage(data.currentPage);
				setTotalPages(data.totalPages);
			}
		} catch (error) {
			console.error("Failed to fetch reviews:", error);
		} finally {
			setLoading(false);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	const canLeaveReview = user && user.id !== profileUser.id;
	// Mark review as helpful (frontend only, for now)
	async function handleHelpfulVote(reviewId: string) {
		try {
			const res = await fetch("/api/reviews/helpful", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reviewId }),
			});
			if (res.ok) {
				const data = await res.json();
				setReviews((reviews) =>
					reviews.map((r) =>
						r.id === reviewId
							? { ...r, helpful: data.helpful, helpfulVoted: true }
							: r,
					),
				);
			}
		} catch (err) {
			// Optionally show error toast
		}
	}
	return (
		<>
			<Nav authed={authed} />
			<main className="woob-container py-2 md:py-8">
				<div className="max-w-4xl mx-auto px-2 md:px-0">
					{/* Profile Header */}
					<div className="panel p-3 md:p-6 mb-3 md:mb-6 rounded-xl shadow-md bg-white/5">
						<div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
							<div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-woob-accent/20 flex items-center justify-center overflow-hidden border-2 border-woob-accent shadow-sm">
								{profileUser.image ? (
									<img
										src={profileUser.image}
										alt="Profile"
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-5xl">👤</span>
								)}
							</div>
							<div className="flex-1 w-full">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2">
									<h1 className="text-2xl md:text-3xl font-bold mb-1">
										{profileUser.name || "User"}
									</h1>
									<div className="flex gap-1 md:gap-2">
										<button className="btn-outline text-xs md:text-base">
											Follow
										</button>
									</div>
								</div>
								<p className="text-white/60 text-xs md:text-sm mb-2">
									Member since {formatDate(profileUser.createdAt)}
								</p>
								{profileUser.bio && (
									<div className="mt-2 mb-2">
										<div className="text-white/80 text-xs md:text-sm font-medium">
											{profileUser.bio}
										</div>
									</div>
								)}
								{/* Rating Overview */}
								{userRating.totalReviews > 0 ? (
									<div className="flex items-center gap-4 mt-2">
										<span
											className={`text-2xl ${getRatingColor(userRating.averageRating)}`}
										>
											{getRatingStars(userRating.averageRating)}
										</span>
										<div>
											<div
												className={`text-xl font-bold ${getRatingColor(userRating.averageRating)}`}
											>
												{formatRating(userRating.averageRating)}
											</div>
											<div className="text-sm text-white/60">
												{userRating.totalReviews} review
												{userRating.totalReviews !== 1 ? "s" : ""}
											</div>
										</div>
									</div>
								) : (
									<div className="text-white/60">No reviews yet</div>
								)}
							</div>
							<div className="flex flex-col gap-3 items-end">
								{canLeaveReview && (
									<ReviewButton
										revieweeId={profileUser.id}
										revieweeName={profileUser.name || "User"}
										className="btn"
										onReviewSubmitted={() => {
											fetchReviews(currentPage);
											window.location.reload();
										}}
									>
										⭐ Leave Review
									</ReviewButton>
								)}
								<Link href="/browse" className="btn-outline">
									← Back to Browse
								</Link>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
						{/* Reviews List */}
						<div className="lg:col-span-2">
							<div className="panel p-3 md:p-6 rounded-xl shadow-md bg-white/5">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
									<h2 className="text-lg md:text-xl font-semibold">
										Reviews ({userRating.totalReviews})
									</h2>
									<div className="flex gap-1 md:gap-2">
										<button
											className={`btn-outline-small${sort === "recent" ? " bg-woob-accent/20" : ""} text-xs md:text-sm`}
											onClick={() => setSort("recent")}
										>
											Most Recent
										</button>
										<button
											className={`btn-outline-small${sort === "highest" ? " bg-woob-accent/20" : ""} text-xs md:text-sm`}
											onClick={() => setSort("highest")}
										>
											Highest Rated
										</button>
										<button
											className={`btn-outline-small${sort === "lowest" ? " bg-woob-accent/20" : ""} text-xs md:text-sm`}
											onClick={() => setSort("lowest")}
										>
											Lowest Rated
										</button>
									</div>
								</div>
								{loading ? (
									<div className="space-y-4">
										{[1, 2, 3].map((i) => (
											<div key={i} className="animate-pulse">
												<div className="flex gap-3 mb-3">
													<div className="bg-white/20 rounded w-20 h-4"></div>
													<div className="bg-white/20 rounded w-32 h-4"></div>
												</div>
												<div className="bg-white/10 rounded w-full h-16"></div>
											</div>
										))}
									</div>
								) : reviews.length > 0 ? (
									<div className="space-y-6">
										{reviews.map((review) => (
											<div
												key={review.id}
												className="border-b border-white/10 pb-6 last:border-b-0"
											>
												<div className="flex items-start justify-between mb-3">
													<div>
														<div className="flex items-center gap-2 mb-1">
															<span className="text-yellow-400">
																{"★".repeat(review.rating)}
																{"☆".repeat(5 - review.rating)}
															</span>
															<span className="text-sm text-white/60">
																by {review.reviewer.name || "User"}
															</span>
														</div>
														<div className="text-xs text-white/50">
															{formatDate(review.createdAt)}
															{review.listing && (
																<span>
																	{" "}
																	• regarding{" "}
																	<span className="italic">
																		{review.listing.title}
																	</span>
																</span>
															)}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<button
															className={`btn-outline-small${review.helpfulVoted ? " bg-woob-accent/30" : ""}`}
															title="Mark as helpful"
															onClick={() => handleHelpfulVote(review.id)}
														>
															👍 Helpful {review.helpfulCount || 0}
														</button>
													</div>
												</div>
												{review.comment && (
													<p className="text-white/80 leading-relaxed">
														{review.comment}
													</p>
												)}
											</div>
										))}
										{totalPages > 1 && (
											<div className="flex justify-center gap-2 pt-6">
												{currentPage > 1 && (
													<button
														onClick={() => fetchReviews(currentPage - 1)}
														className="btn-outline"
													>
														Previous
													</button>
												)}
												<span className="flex items-center px-3 text-white/60">
													Page {currentPage} of {totalPages}
												</span>
												{currentPage < totalPages && (
													<button
														onClick={() => fetchReviews(currentPage + 1)}
														className="btn-outline"
													>
														Next
													</button>
												)}
											</div>
										)}
									</div>
								) : (
									<div className="text-center py-12 text-white/60">
										<p className="mb-4">No reviews yet</p>
										{canLeaveReview && (
											<ReviewButton
												revieweeId={profileUser.id}
												revieweeName={profileUser.name || "User"}
												className="btn"
												onReviewSubmitted={() => {
													fetchReviews(currentPage);
													window.location.reload();
												}}
											>
												Be the first to leave a review
											</ReviewButton>
										)}
									</div>
								)}
							</div>
						</div>
						{/* Sidebar with Newest Drop and other panels */}
						<div className="space-y-3 md:space-y-6">
							{/* Newest Drop */}
							{profileUser.listings &&
								profileUser.listings.length > 0 &&
								(() => {
									const sortedListings = [...profileUser.listings].sort(
										(a: any, b: any) =>
											new Date(b.createdAt).getTime() -
											new Date(a.createdAt).getTime(),
									);
									const newest = sortedListings[0];
									if (!newest) return null;
									// Show first image if available
									let firstImage = null;
									if (newest.images) {
										if (Array.isArray(newest.images)) {
											firstImage = newest.images[0];
										} else {
											try {
												const imagesArr = JSON.parse(newest.images);
												if (Array.isArray(imagesArr)) {
													firstImage = imagesArr[0];
												} else if (typeof imagesArr === "string") {
													firstImage = imagesArr;
												}
											} catch {
												if (typeof newest.images === "string") {
													firstImage = newest.images;
												}
											}
										}
									}
									return (
										<div className="panel p-4">
											<h3 className="font-semibold mb-4">Newest Drop</h3>
											<Link
												href={`/listings/${newest.id}`}
												className="block p-3 rounded bg-white/5 hover:bg-white/10 transition-colors"
											>
												{firstImage && (
													<img
														src={firstImage}
														alt={newest.title}
														className="w-full h-20 md:h-32 object-cover rounded-lg mb-2 shadow-sm"
													/>
												)}
												<div className="font-medium text-sm">
													{newest.title}
												</div>
												<div className="text-woob-accent text-xs">
													${(newest.priceCents / 100).toFixed(2)}{" "}
													<span className="ml-2 text-xs text-white/50">
														{newest.status}
													</span>
												</div>
											</Link>
										</div>
									);
								})()}
							{/* Rating Breakdown */}
							{userRating.totalReviews > 0 && (
								<div className="panel p-4">
									<h3 className="font-semibold mb-4">Rating Breakdown</h3>
									<RatingBreakdown
										breakdown={userRating.ratingBreakdown}
										totalReviews={userRating.totalReviews}
									/>
								</div>
							)}
						</div>
					</div>

					{/* All Listings Full Section */}
					{profileUser.listings && profileUser.listings.length > 0 && (
						<div className="panel p-3 md:p-6 mt-4 md:mt-8 rounded-xl shadow-md bg-white/5">
							<h2 className="text-xl font-bold mb-6">All Listings</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
								{profileUser.listings.map((listing: any) => {
									let firstImage = null;
									if (listing.images) {
										if (Array.isArray(listing.images)) {
											firstImage = listing.images[0];
										} else {
											try {
												const imagesArr = JSON.parse(listing.images);
												if (Array.isArray(imagesArr)) {
													firstImage = imagesArr[0];
												} else if (typeof imagesArr === "string") {
													firstImage = imagesArr;
												}
											} catch {
												if (typeof listing.images === "string") {
													firstImage = listing.images;
												}
											}
										}
									}
									return (
										<Link
											key={listing.id}
											href={`/listings/${listing.id}`}
											className="block rounded-lg bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
										>
											{firstImage ? (
												<img
													src={firstImage}
													alt={listing.title}
													className="w-full h-20 md:h-40 object-cover rounded-lg mb-2 shadow-sm"
												/>
											) : (
												<div className="w-full h-40 bg-white/10 flex items-center justify-center mb-2 text-white/40">
													No Image
												</div>
											)}
											<div className="p-3">
												<div className="font-semibold text-base mb-1 truncate">
													{listing.title}
												</div>
												<div className="text-woob-accent text-sm">
													${(listing.priceCents / 100).toFixed(2)}{" "}
													<span className="ml-2 text-xs text-white/50">
														{listing.status}
													</span>
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						</div>
					)}
					{/* Sidebar */}
					{/* Sidebar (no Newest Drop here, only Rating Breakdown) */}
					<div className="space-y-6">
						{/* Rating Breakdown */}
						{userRating.totalReviews > 0 && (
							<div className="panel p-4">
								<h3 className="font-semibold mb-4">Rating Breakdown</h3>
								<RatingBreakdown
									breakdown={userRating.ratingBreakdown}
									totalReviews={userRating.totalReviews}
								/>
							</div>
						)}
						{/* All Listings section moved below reviews, see new full-width box above */}
					</div>
				</div>
			</main>
		</>
	);
}
