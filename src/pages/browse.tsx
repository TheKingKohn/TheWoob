import { useState } from "react";
import Link from "next/link";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import ListingCard from "../components/ListingCard";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { categories } from "../lib/utils";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({
	req,
	res,
	query,
}) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	const showSold = query.showSold === "true";
	const includeHidden = query.includeHidden === "true" && user;
	const where: any = {
		status: { notIn: ["DELETED", "SOLD", "HIDDEN"] },
	};
	if (showSold) {
		where.status = { notIn: ["DELETED", "HIDDEN"] };
	}
	if (includeHidden && user) {
		where.OR = [
			{ status: { notIn: ["DELETED", "HIDDEN"] } },
			{ status: "HIDDEN", sellerId: user.id },
		];
	}
	const listings = await prisma.listing.findMany({
		where,
		orderBy: { createdAt: "desc" },
		include: { seller: { select: { name: true, email: true } } },
	});
	return {
		props: {
			listings: JSON.parse(JSON.stringify(listings)),
			authed: !!user,
			user: user
				? { role: user.role, email: user.email, name: user.name, id: user.id }
				: null,
			showSold,
			includeHidden,
		},
	};
};

import { useRouter } from "next/router";
export default function Browse({
	listings,
	authed,
	user,
	showSold,
	includeHidden,
}: any) {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [priceRange, setPriceRange] = useState("All");
	const [sortBy, setSortBy] = useState("newest");
	const [showSoldFilter, setShowSoldFilter] = useState(showSold);
	const [includeHiddenFilter, setIncludeHiddenFilter] = useState(includeHidden);

	const filteredListings = listings
		.filter((l: any) => {
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
		})
		.sort((a: any, b: any) => {
			switch (sortBy) {
				case "newest":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				case "oldest":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				case "price-low":
					return a.priceCents - b.priceCents;
				case "price-high":
					return b.priceCents - a.priceCents;
				case "title":
					return a.title.localeCompare(b.title);
				default:
					return 0;
			}
		});

	return (
		<>
			<Nav authed={authed} user={user} />
			<main className="woob-container py-8">
				<div className="mb-8">
					<div className="flex gap-4 mb-4">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={showSoldFilter}
								onChange={(e) => {
									setShowSoldFilter(e.target.checked);
									router.replace(
										{
											pathname: router.pathname,
											query: { ...router.query, showSold: e.target.checked },
										},
										undefined,
										{ shallow: true },
									);
								}}
							/>
							Show Sold
						</label>
						{user && (
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={includeHiddenFilter}
									onChange={(e) => {
										setIncludeHiddenFilter(e.target.checked);
										router.replace(
											{
												pathname: router.pathname,
												query: {
													...router.query,
													includeHidden: e.target.checked,
												},
											},
											undefined,
											{ shallow: true },
										);
									}}
								/>
								Include Hidden (yours)
							</label>
						)}
					</div>
					<h1 className="text-heading-2 mb-4">🔥 Exclusive Collection</h1>
					<p className="text-body text-white/70">
						Premium items from verified members only
					</p>
				</div>

				{/* Enhanced Search and Filters */}
				<div className="panel p-6 mb-8">
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						{/* Search - Full width on mobile, double width on desktop */}
						<div className="lg:col-span-2">
							<label className="label">Search Listings</label>
							<div className="relative">
								<input
									className="input pl-10"
									placeholder="Search by title or description..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
								<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
									<svg
										className="w-4 h-4 text-white/40"
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

						<div>
							<label className="label">Category</label>
							<select
								className="input"
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

						<div>
							<label className="label">Price Range</label>
							<select
								className="input"
								value={priceRange}
								onChange={(e) => setPriceRange(e.target.value)}
								aria-label="Filter by price range"
							>
								<option value="All">All Prices</option>
								<option value="Under $50">Under $50</option>
								<option value="$50-$200">$50 - $200</option>
								<option value="Over $200">Over $200</option>
							</select>
						</div>

						<div>
							<label className="label">Sort By</label>
							<select
								className="input"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								aria-label="Sort listings by"
							>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
								<option value="price-low">Price: Low to High</option>
								<option value="price-high">Price: High to Low</option>
								<option value="title">Title A-Z</option>
							</select>
						</div>
					</div>

					{(searchTerm ||
						selectedCategory !== "All" ||
						priceRange !== "All") && (
						<div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
							<div className="flex items-center gap-4">
								<span className="text-white/70 text-sm">
									<span className="font-semibold text-woob-accent">
										{filteredListings.length}
									</span>{" "}
									results found
								</span>
								{searchTerm && (
									<span className="badge">
										Search: &quot;{searchTerm}&quot;
									</span>
								)}
								{selectedCategory !== "All" && (
									<span className="badge badge-info">{selectedCategory}</span>
								)}
								{priceRange !== "All" && (
									<span className="badge badge-success">{priceRange}</span>
								)}
							</div>
							<button
								className="btn-outline-small"
								onClick={() => {
									setSearchTerm("");
									setSelectedCategory("All");
									setPriceRange("All");
									setSortBy("newest");
								}}
							>
								✕ Clear Filters
							</button>
						</div>
					)}
				</div>

				{/* Enhanced Results Section */}
				{filteredListings.length > 0 ? (
					<div>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-heading-4">
								{filteredListings.length} Listing
								{filteredListings.length !== 1 ? "s" : ""}
							</h2>
							<span className="text-caption">
								Sorted by{" "}
								{sortBy === "newest"
									? "newest first"
									: sortBy === "oldest"
										? "oldest first"
										: sortBy === "price-low"
											? "price low to high"
											: sortBy === "price-high"
												? "price high to low"
												: "title A-Z"}
							</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{filteredListings.map((l: any) => (
								<ListingCard key={l.id} l={l} />
							))}
						</div>
					</div>
				) : (
					<div className="panel p-12 text-center">
						<div className="text-6xl mb-6">�</div>
						<h3 className="text-heading-4 mb-4">No premium items found</h3>
						<p className="text-white/60 mb-8 max-w-md mx-auto">
							{searchTerm || selectedCategory !== "All" || priceRange !== "All"
								? "Try adjusting your search criteria or clear the filters to see all exclusive items."
								: "Be the first member to list a premium item!"}
						</p>
						{authed ? (
							<Link className="btn" href="/sell/new">
								✨ List Premium Item
							</Link>
						) : (
							<div className="space-y-3">
								<Link className="btn block" href="/signin">
									🎩 Join the Club
								</Link>
								<Link className="btn-outline" href="/">
									← Back to Homepage
								</Link>
							</div>
						)}
					</div>
				)}
			</main>
		</>
	);
}
