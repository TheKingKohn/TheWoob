import { useState } from "react";
import Link from "next/link";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import ListingCard from "../components/ListingCard";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { categories } from "../lib/utils";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const listings = await prisma.listing.findMany({
		where: { status: { notIn: ["DELETED", "SOLD", "HIDDEN"] } },
		orderBy: { createdAt: "desc" },
		include: { seller: { select: { name: true, email: true } } },
	});
	const userCount = await prisma.user.count();
	return {
		props: {
			listings: JSON.parse(JSON.stringify(listings)),
			authed: !!(session as any)?.user,
			userCount,
		},
	};
};

interface HomeProps {
	listings: any[];
	authed: boolean;
	userCount: number;
}

export default function Home({ listings, authed, userCount }: HomeProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [priceRange, setPriceRange] = useState("All");

	const filteredListings = listings.filter((l: any) => {
		const matchesSearch =
			l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(l.description &&
				l.description.toLowerCase().includes(searchTerm.toLowerCase()));
		const matchesCategory =
			selectedCategory === "All" || l.category === selectedCategory;
		const matchesPrice =
			priceRange === "All" ||
			(priceRange === "Under $50" && l.priceCents < 5000) ||
			(priceRange === "$50-$200" &&
				l.priceCents >= 5000 &&
				l.priceCents <= 20000) ||
			(priceRange === "Over $200" && l.priceCents > 20000);
		return matchesSearch && matchesCategory && matchesPrice;
	});

	return (
		<>
			<Nav authed={authed} />
			<Hero />
			{/* Social Proof Section - VIP Style */}
			<div className="woob-container py-6 flex justify-center px-2 sm:px-0">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
					<div className="panel flex flex-col items-center justify-center px-4 py-4 sm:px-6 rounded-xl text-center bg-gradient-to-br from-woob-accent/10 to-woob-accent2/10 border border-woob-accent/20 shadow">
						<div className="text-3xl mb-2">👑</div>
						<div className="text-lg font-bold text-woob-accent">
							{typeof userCount === "number" ? userCount : "N/A"} Members
						</div>
						<div className="text-xs text-white/60">Verified Members</div>
					</div>
					<div className="panel flex flex-col items-center justify-center px-4 py-4 sm:px-6 rounded-xl text-center bg-gradient-to-br from-woob-accent2/10 to-woob-accent/10 border border-woob-accent2/20 shadow">
						<div className="text-3xl mb-2">🔒</div>
						<div className="text-lg font-bold text-woob-accent2">
							Invite Only
						</div>
						<div className="text-xs text-white/60">Exclusive Access</div>
					</div>
					<div className="panel flex flex-col items-center justify-center px-4 py-4 sm:px-6 rounded-xl text-center bg-gradient-to-br from-woob-accent/10 to-woob-accent2/10 border border-woob-accent/20 shadow">
						<div className="text-3xl mb-2">🌐</div>
						<div className="text-lg font-bold text-woob-accent">
							Local Community
						</div>
						<div className="text-xs text-white/60">Private Deals</div>
					</div>
				</div>
			</div>
			{/* Removed anti-ad section from homepage. Now lives only on About page. */}

			{/* Removed anti-ad section from homepage. Now lives only on About page. */}

			{/* Latest Listings Section */}
			<section id="listings" className="woob-container py-10 px-2 sm:px-0">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
					<div>
						<h2 className="text-heading-3 mb-2">👑 Featured Products</h2>
						<p className="text-white/60">
							Exclusive items from verified sellers
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
						<Link className="btn-outline w-full sm:w-auto" href="/browse">
							View Collection ({listings.length})
						</Link>
						{authed && (
							<Link className="btn w-full sm:w-auto" href="/sell/new">
								✨ List Item
							</Link>
						)}
					</div>
				</div>
				{/* Quick Search - Modern, less boxy */}
				<div className="mb-6 sm:mb-8">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
						<div className="flex flex-col gap-1">
							<label className="label text-xs sm:text-sm font-semibold"></label>
							<div className="relative">
								<input
									className="input pl-10 text-base sm:text-lg py-3 sm:py-2 rounded-full border border-woob-accent/30 bg-white/5 focus:ring-woob-accent/40 transition-all shadow-sm"
									placeholder="Search items..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
								<div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
									<svg
										className="w-5 h-5 sm:w-4 sm:h-4 text-white/40"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<label className="label text-xs sm:text-sm font-semibold"></label>
							<select
								className="input text-base sm:text-lg py-3 sm:py-2 rounded-full border border-woob-accent/30 bg-white/5 focus:ring-woob-accent/40 transition-all shadow-sm"
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								aria-label="Filter by category"
							>
								<option value="All">All Categories</option>
								{categories.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="label text-xs sm:text-sm font-semibold"></label>
							<select
								className="input text-base sm:text-lg py-3 sm:py-2 rounded-full border border-woob-accent/30 bg-white/5 focus:ring-woob-accent/40 transition-all shadow-sm"
								value={priceRange}
								onChange={(e) => setPriceRange(e.target.value)}
								aria-label="Price range filter"
							>
								<option value="All">All Prices</option>
								<option value="Under $50">Under $50</option>
								<option value="$50-$200">$50 - $200</option>
								<option value="Over $200">Over $200</option>
							</select>
						</div>
					</div>
				</div>

				{/* Results */}
				<div className="flex items-center justify-between mb-4">
					<span className="text-white/70">
						{filteredListings.length}{" "}
						{filteredListings.length === 1 ? "listing" : "listings"} found
					</span>
					{(searchTerm ||
						selectedCategory !== "All" ||
						priceRange !== "All") && (
						<button
							className="btn-outline text-sm"
							onClick={() => {
								setSearchTerm("");
								setSelectedCategory("All");
								setPriceRange("All");
							}}
						>
							Clear Filters
						</button>
					)}
				</div>

				{filteredListings.length > 0 ? (
					<div>
						<div className="flex items-center justify-between mb-6">
							<span className="text-white/70">
								Showing{" "}
								<span className="font-semibold text-woob-accent">
									{Math.min(filteredListings.length, 8)}
								</span>{" "}
								of {filteredListings.length} listings
							</span>
							{(searchTerm ||
								selectedCategory !== "All" ||
								priceRange !== "All") && (
								<button
									className="btn-outline-small"
									onClick={() => {
										setSearchTerm("");
										setSelectedCategory("All");
										setPriceRange("All");
									}}
								>
									✕ Clear Filters
								</button>
							)}
						</div>
						<div className="grid grid-cols-2 gap-5">
							{filteredListings.slice(0, 8).map((l: any) => (
								<ListingCard key={l.id} l={l} square />
							))}
						</div>
						{filteredListings.length > 8 && (
							<div className="text-center mt-8">
								<Link className="btn" href="/browse">
									View All {filteredListings.length} Listings →
								</Link>
							</div>
						)}
					</div>
				) : (
					<div className="panel p-12 text-center">
						<div className="text-6xl mb-6">🕵️‍♂️</div>
						<h3 className="text-heading-4 mb-4">No premium items found</h3>
						<p className="text-white/60 mb-8">
							{searchTerm || selectedCategory !== "All" || priceRange !== "All"
								? "Try adjusting your search criteria or clear the filters."
								: "Be the first member to list an exclusive item!"}
						</p>
						{authed ? (
							<Link className="btn" href="/sell/new">
								✨ List Premium Item
							</Link>
						) : (
							<Link className="btn" href="/signin">
								🎩 Join the Club
							</Link>
						)}
					</div>
				)}
			</section>
			<footer className="woob-container py-10 text-white/60 text-sm">
				© {new Date().getFullYear()} TheWoob — Exclusive Members Club
			</footer>
		</>
	);
}
