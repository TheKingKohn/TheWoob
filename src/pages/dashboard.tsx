import { getIronSession } from "iron-session";
import Link from "next/link";
import { sessionOptions } from "../lib/session";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import { currency } from "../lib/utils";
import { GetServerSideProps } from "next";
import { ReviewButton } from "../components/ReviewModal";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const sessionUser = (session as any).user;
	if (!sessionUser) return { redirect: { destination: "/signin", permanent: false } };
	const user = await prisma.user.findUnique({
		where: { id: sessionUser.id },
	});
	if (!user) return { redirect: { destination: "/signin", permanent: false } };
	const listings = await prisma.listing.findMany({
		where: { AND: [{ sellerId: user.id }, { status: { not: "DELETED" } }] },
		orderBy: { createdAt: "desc" },
	});
	const sold = listings.filter((l) => l.status === "sold");
	const gross = sold.reduce((s, l) => s + l.priceCents, 0);
	const fee = Math.round(gross * Number(process.env.FEE_PERCENT ?? 0.1));
	const net = gross - fee;
	return {
		props: {
			authed: true,
			user: JSON.parse(JSON.stringify(user)),
			stats: { gross, fee, net, count: sold.length },
			listings: JSON.parse(JSON.stringify(listings)),
		},
	};
};
export default function Dashboard({ user, stats, listings }: any) {
	const activeListings = listings.filter((l: any) => l.status === "active");
	const soldListings = listings.filter((l: any) => l.status === "sold");
	const archivedListings = listings.filter((l: any) => l.status === "archived");
	const soldAsBuyer = soldListings.filter((l: any) => l.buyerId === user.id);
	return (
		<>
			<Nav authed={true} user={user} />
			<main className="woob-container py-8 space-y-8">
				{/* Welcome Section */}
				<div className="panel p-8">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
						<div>
							<h1 className="text-heading-3 mb-2">
								👑 VIP Dashboard, {user.name ?? user.email}
							</h1>
							<div className="flex items-center gap-2">
								<span className="text-white/70 text-sm">Member Status:</span>
								{user.stripeAccountId ? (
									<span className="badge badge-success">✨ Elite Member</span>
								) : (
									<span className="badge badge-warning">⚠ Setup Required</span>
								)}
								<Link
									className="text-woob-accent underline text-sm hover:text-purple-400 transition-colors"
									href="/onboard"
								>
									Upgrade
								</Link>
							</div>
						</div>
						<Link className="btn" href="/sell/new">
							✨ List Premium Item
						</Link>
					</div>

					{/* Enhanced Stats Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">💰</div>
							<div className="label">Gross Sales</div>
							<div className="price-large">{currency(stats.gross)}</div>
						</div>
						{user.isAdmin && (
							<div className="card p-6 text-center">
								<div className="text-3xl mb-2">📊</div>
								<div className="label">Platform Fees</div>
								<div className="text-2xl font-bold text-yellow-400">
									{currency(stats.fee)}
								</div>
							</div>
						)}
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">🎯</div>
							<div className="label">Your Earnings</div>
							<div className="price-large text-green-400">
								{currency(stats.net)}
							</div>
						</div>
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">📦</div>
							<div className="label">Items Sold</div>
							<div className="text-2xl font-bold text-woob-accent2">
								{stats.count}
							</div>
						</div>
					</div>
					<div className="card p-6 text-center">
						<div className="text-2xl font-semibold mb-2 text-purple-300">Your Invite Code</div>
						<div className="flex items-center justify-center gap-2 mb-3">
							<span className="text-2xl font-mono font-bold text-purple-400 select-all bg-black/10 px-5 py-2 rounded-lg border border-purple-700">
								{user.affiliateCode || "Not assigned"}
							</span>
							{user.affiliateCode && (
								<button
									className="inline-flex items-center px-2 py-1 rounded bg-purple-700 text-white hover:bg-purple-800 transition border border-purple-900"
									onClick={() => {
										navigator.clipboard.writeText(user.affiliateCode);
										const toast = document.createElement('div');
										toast.textContent = 'Copied!';
										toast.style.position = 'fixed';
										toast.style.bottom = '32px';
										toast.style.left = '50%';
										toast.style.transform = 'translateX(-50%)';
										toast.style.background = '#7c3aed';
										toast.style.color = '#fff';
										toast.style.padding = '8px 20px';
										toast.style.borderRadius = '8px';
										toast.style.fontWeight = 'bold';
										toast.style.zIndex = '9999';
										document.body.appendChild(toast);
										setTimeout(() => toast.remove(), 1200);
									}}
									title="Copy code"
								>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
									Copy
								</button>
							)}
						</div>
						<div className="text-xs text-white/70 mt-3 font-medium">Invite friends and earn rewards. Sharing is easy!</div>
					</div>
				</div>

				{/* Listings Section */}
				<div className="panel p-8">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-heading-4">Your Listings</h2>
						<div className="flex items-center gap-2 text-sm text-white/60">
							<span className="badge">{activeListings.length} Active</span>
							<span className="badge badge-success">
								{soldListings.length} Sold
							</span>
							<span className="badge badge-warning">
								{archivedListings.length} Archived
							</span>
						</div>
					</div>

					{listings.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
							{listings.map((l: any) => (
								<div key={l.id} className="card p-6 group">
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg truncate group-hover:text-woob-accent transition-colors">
												{l.title}
											</h3>
											<div className="flex items-center gap-2 mt-2">
												<span className="price-medium">
													{currency(l.priceCents)}
												</span>
												<span
													className={`badge ${
														l.status === "active"
															? ""
															: l.status === "sold"
																? "badge-success"
																: "badge-warning"
													}`}
												>
													{l.status}
												</span>
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Link
											href={`/listings/${l.id}`}
											className="btn-outline flex-1 text-center"
										>
											View Details
										</Link>
										{l.status === "active" && (
											<Link
												href={`/listings/edit?id=${l.id}`}
												className="btn-outline-small"
											>
												✏️
											</Link>
										)}
										{l.status !== "DELETED" && (
											<button
												className="btn-outline-small text-red-400 hover:bg-red-400/10"
												title="Delete listing"
												onClick={async () => {
													if (
														confirm(
															"Delete this listing? You can restore it from the Deleted tab.",
														)
													) {
														await fetch(`/api/listings/${l.id}`, {
															method: "DELETE",
														});
														window.location.reload();
													}
												}}
											>
												🗑️
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="text-6xl mb-6">📦</div>
							<h3 className="text-heading-4 mb-4">No listings yet</h3>
							<p className="text-white/60 mb-8">
								Start selling items in the Warren marketplace!
							</p>
							<Link className="btn" href="/sell/new">
								🚀 Create Your First Listing
							</Link>
						</div>
					)}
				</div>

				{/* Buyer Review Prompt Section */}
				{soldAsBuyer.length > 0 && (
					<div className="panel p-6 mb-8">
						<h2 className="text-lg font-bold mb-4">
							Leave a Review for Your Seller
						</h2>
						<div className="space-y-4">
							{soldAsBuyer.map((l: any) => {
								return (
									<ReviewButton
										key={l.id}
										revieweeId={l.sellerId}
										revieweeName={l.seller?.name || "Seller"}
										orderId={l.orderId}
										listingId={l.id}
										listingTitle={l.title}
										className="btn"
										onReviewSubmitted={() => window.location.reload()}
									>
										Review {l.seller?.name || "Seller"} for &quot;{l.title}&quot;
									</ReviewButton>
								);
							})}
						</div>
					</div>
				)}
			</main>
		</>
	);
}
