import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import { currency } from "../lib/utils";
import { toast } from "../components/Toast";
import DealAdminCard from "./admin/DealAdminCard";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return { redirect: { destination: "/signin", permanent: false } };
	}

	if (user.role !== "admin") {
		return { redirect: { destination: "/dashboard", permanent: false } };
	}

	// Get admin statistics
	const [
		totalUsers,
		totalListings,
		totalOrders,
		totalRevenue,
		recentUsers,
		recentListings,
		flaggedContent,
	] = await Promise.all([
		prisma.user.count(),
		prisma.listing.count({ where: { status: { not: "DELETED" } } }),
		prisma.order.count(),
		prisma.order.aggregate({ _sum: { amountCents: true } }),
		prisma.user.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				createdAt: true,
				_count: { select: { listings: true } },
			},
		}),
		prisma.listing.findMany({
			where: { status: { not: "DELETED" } },
			orderBy: { createdAt: "desc" },
			take: 10,
			include: { seller: { select: { email: true, name: true } } },
		}),
		prisma.listing.findMany({
			where: {
				AND: [
					{ status: { not: "DELETED" } },
					{
						OR: [
							{ title: { contains: "test" } },
							{ description: { contains: "fake" } },
						],
					},
				],
			},
			include: { seller: { select: { email: true, name: true } } },
			take: 5,
		}),
	]);

	const currentYear = new Date().getFullYear();
	return {
		props: {
			authed: true,
			user,
			stats: {
				totalUsers,
				totalListings,
				totalOrders,
				totalRevenue: totalRevenue._sum.amountCents || 0,
			},
			recentUsers: JSON.parse(JSON.stringify(recentUsers)),
			recentListings: JSON.parse(JSON.stringify(recentListings)),
			flaggedContent: JSON.parse(JSON.stringify(flaggedContent)),
			currentYear,
		},
	};
};

export default function AdminDashboard({
	user,
	stats,
	recentUsers,
	recentListings,
	flaggedContent,
	currentYear,
}: any) {
	const [editUserLoading, setEditUserLoading] = useState(false);
	const [editUserForm, setEditUserForm] = useState<any>(null);
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [showUserModal, setShowUserModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [deals, setDeals] = useState<any[]>([]);
	const [dealForm, setDealForm] = useState({
		title: "",
		businessName: "",
		discountDetails: "",
		description: "",
		validFrom: "",
		validTo: "",
		imageUrl: "",
	});
	const [dealImageUploading, setDealImageUploading] = useState(false);
	const [dealLoading, setDealLoading] = useState(false);

	useEffect(() => {
		async function fetchDeals() {
			const res = await fetch("/api/admin/deals");
			if (res.ok) {
				const data = await res.json();
				setDeals(data.deals || []);
			}
		}
		fetchDeals();
	}, []);

	async function createDeal(e: any) {
		e.preventDefault();
		setDealLoading(true);
		const res = await fetch("/api/admin/deals", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(dealForm),
		});
		if (res.ok) {
			toast.success("Deal created!", "Your local deal is now live");
			setDealForm({
				title: "",
				businessName: "",
				discountDetails: "",
				description: "",
				validFrom: "",
				validTo: "",
				imageUrl: "",
			});
			const data = await res.json();
			setDeals([data.deal, ...deals]);
		} else {
			const error = await res.json();
			toast.error("Failed to create deal", error.error || "Please try again");
		}
		setDealLoading(false);
	}

	const updateUserRole = async (userId: string, newRole: string) => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/update-user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, role: newRole }),
			});

			if (response.ok) {
				toast.success("User Updated", `Role changed to ${newRole}`);
				window.location.reload();
			} else {
				const error = await response.json();
				toast.error("Update Failed", error.error || "Failed to update user");
			}
		} catch (error) {
			toast.error("Error", "Network error occurred");
		}
		setLoading(false);
	};

	const deleteUser = async (userId: string) => {
		if (
			!confirm(
				"Are you sure you want to delete this user? This action cannot be undone.",
			)
		) {
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/admin/delete-user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});

			if (response.ok) {
				toast.success("User Deleted", "User has been permanently removed");
				window.location.reload();
			} else {
				const error = await response.json();
				toast.error("Delete Failed", error.error || "Failed to delete user");
			}
		} catch (error) {
			toast.error("Error", "Network error occurred");
		}
		setLoading(false);
	};

	const deleteListing = async (listingId: string) => {
		if (!confirm("Are you sure you want to delete this listing?")) {
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/admin/delete-listing", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ listingId }),
			});

			if (response.ok) {
				toast.success("Listing Deleted", "Listing has been removed");
				window.location.reload();
			} else {
				const error = await response.json();
				toast.error("Delete Failed", error.error || "Failed to delete listing");
			}
		} catch (error) {
			toast.error("Error", "Network error occurred");
		}
		setLoading(false);
	};

	// Only one return statement inside the function
	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8 space-y-8">
				{/* Local Deals Admin */}
				<div className="panel p-8">
					<h2 className="text-heading-4 mb-6 text-blue-400">🌟 Local Deals</h2>
					<form
						onSubmit={createDeal}
						className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
					>
						<div>
							<label className="label">Title *</label>
							<input
								className="input"
								value={dealForm.title}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, title: e.target.value }))
								}
								required
								placeholder="Deal Title"
							/>
						</div>
						<div>
							<label className="label">Business Name *</label>
							<input
								className="input"
								value={dealForm.businessName}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, businessName: e.target.value }))
								}
								required
								placeholder="Business Name"
							/>
						</div>
						<div>
							<label className="label">Discount Details</label>
							<input
								className="input"
								value={dealForm.discountDetails}
								onChange={(e) =>
									setDealForm((f) => ({
										...f,
										discountDetails: e.target.value,
									}))
								}
								placeholder="Discount Details"
							/>
						</div>
						<div>
							<label className="label">Description</label>
							<textarea
								className="input"
								value={dealForm.description}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, description: e.target.value }))
								}
								rows={2}
								placeholder="Description"
							/>
						</div>
						<div>
							<label className="label">Valid From</label>
							<input
								className="input"
								type="date"
								value={dealForm.validFrom}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, validFrom: e.target.value }))
								}
								placeholder="Valid From"
							/>
						</div>
						<div>
							<label className="label">Valid To</label>
							<input
								className="input"
								type="date"
								value={dealForm.validTo}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, validTo: e.target.value }))
								}
								placeholder="Valid To"
							/>
						</div>
						<div className="md:col-span-2">
							<label className="label">Deal Image</label>
							<div className="flex gap-2 items-center">
								<input
									type="file"
									accept="image/*"
									disabled={dealImageUploading}
									onChange={async (e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										if (file.size > 5 * 1024 * 1024) {
											toast.error("File too large", "Image must be under 5MB");
											return;
										}
										setDealImageUploading(true);
										const formData = new FormData();
										formData.append("dealImage", file);
										const res = await fetch("/api/upload-deal-image", {
											method: "POST",
											body: formData,
										});
										if (res.ok) {
											const data = await res.json();
											setDealForm((f) => ({ ...f, imageUrl: data.imageUrl }));
											toast.success("Image uploaded", "Deal image added");
										} else {
											const error = await res.json();
											toast.error(
												"Upload failed",
												error.error || "Failed to upload image",
											);
										}
										setDealImageUploading(false);
									}}
									title="Upload deal image"
									placeholder="Select image to upload"
								/>
								<span className="text-sm text-white/40">
									or paste image URL below
								</span>
							</div>
							<input
								className="input mt-2"
								value={dealForm.imageUrl}
								onChange={(e) =>
									setDealForm((f) => ({ ...f, imageUrl: e.target.value }))
								}
								title="Paste image URL"
								placeholder="Paste image URL (optional)"
							/>
							{dealForm.imageUrl && (
								<Image
									src={dealForm.imageUrl}
									alt="Deal preview"
									width={320}
									height={128}
									className="mt-2 rounded-lg w-full h-32 object-cover border border-blue-400/30"
								/>
							)}
						</div>
						<div className="md:col-span-2 flex justify-end">
							<button className="btn" type="submit" disabled={dealLoading}>
								{dealLoading ? "Creating..." : "Create Deal"}
							</button>
						</div>
					</form>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{deals.length === 0 ? (
							<div className="text-white/60">No deals yet.</div>
						) : (
							deals.map((deal) => (
								<DealAdminCard
									key={deal.id}
									deal={deal}
									onUpdate={(updated: typeof deal) =>
										setDeals((ds) =>
											ds.map((d) => (d.id === updated.id ? updated : d)),
										)
									}
									onDelete={() =>
										setDeals((ds) => ds.filter((d) => d.id !== deal.id))
									}
								/>
							))
						)}
					</div>
				</div>
				{/* Admin Header */}
				<div className="panel p-8">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-heading-3 mb-2">🛡️ Admin Control Center</h1>
							<p className="text-white/70">Platform management and oversight</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="badge badge-success">Admin Access</span>
							<span className="text-sm text-white/60">{user.email}</span>
							{user.affiliateCode && (
								<span
									className="font-mono bg-black/20 px-2 py-1 rounded text-xs ml-2"
									title="Your affiliate code"
								>
									{user.affiliateCode}
								</span>
							)}
							<Link
								href="/admin/invite-graph"
								className="btn ml-4"
								title="View Invite Network Graph"
							>
								🕸️ View Invite Graph
							</Link>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">👥</div>
							<div className="label">Total Users</div>
							<div className="text-2xl font-bold text-woob-accent">
								{stats.totalUsers}
							</div>
						</div>
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">📦</div>
							<div className="label">Total Listings</div>
							<div className="text-2xl font-bold text-purple-400">
								{stats.totalListings}
							</div>
						</div>
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">🛒</div>
							<div className="label">Total Orders</div>
							<div className="text-2xl font-bold text-yellow-400">
								{stats.totalOrders}
							</div>
						</div>
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">💰</div>
							<div className="label">Total Revenue</div>
							<div className="text-2xl font-bold text-green-400">
								{currency(stats.totalRevenue)}
							</div>
						</div>
						<div className="card p-6 text-center">
							<div className="text-3xl mb-2">📊</div>
							<div className="label">Platform Fees</div>
							<div className="text-2xl font-bold text-yellow-400">
								{currency(
									Math.round(
										stats.totalRevenue * Number(process.env.FEE_PERCENT ?? 0.1),
									),
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Recent Users */}
				<div className="panel p-8">
					<h2 className="text-heading-4 mb-6">Recent Users</h2>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-white/10">
									<th className="text-left p-3">Email</th>
									<th className="text-left p-3">Name</th>
									<th className="text-left p-3">Role</th>
									<th className="text-left p-3">Listings</th>
									<th className="text-left p-3">Joined</th>
									<th className="text-left p-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{recentUsers.map((u: any) => (
									<tr
										key={u.id}
										className="border-b border-white/5 hover:bg-white/5"
									>
										<td className="p-3">{u.email}</td>
										<td className="p-3">{u.name || "No name"}</td>
										<td className="p-3">
											<span
												className={`badge ${u.role === "admin" ? "badge-success" : ""}`}
											>
												{u.role}
											</span>
										</td>
										<td className="p-3">{u._count.listings}</td>
										<td className="p-3">
											{new Date(u.createdAt).toLocaleDateString()}
										</td>
										<td className="p-3">
											<select
												className="input text-xs mr-2"
												value={u.role}
												onChange={(e) => updateUserRole(u.id, e.target.value)}
												disabled={u.id === user.id}
												title="Change user role"
											>
												<option value="user">User</option>
												<option value="admin">Admin</option>
												<option value="blocked">Blocked</option>
											</select>
											<button
												className="btn-outline-small text-red-400 mr-2"
												onClick={() => deleteUser(u.id)}
												disabled={u.id === user.id}
												title="Delete user"
											>
												🗑️
											</button>
											<button
												className="btn-outline-small text-yellow-400"
												onClick={() => {
													setSelectedUser(u);
													setEditUserForm({
														name: u.name || "",
														email: u.email || "",
														role: u.role,
													});
													setShowUserModal(true);
												}}
												title="Edit user"
											>
												✏️
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Recent Listings */}
				<div className="panel p-8">
					<h2 className="text-heading-4 mb-6">Recent Listings</h2>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{recentListings.map((listing: any) => (
							<div key={listing.id} className="card p-6">
								<div className="flex justify-between items-start mb-4">
									<div className="flex-1">
										<h3 className="font-semibold text-lg mb-2">
											{listing.title}
										</h3>
										<p className="text-white/60 text-sm mb-2">
											By: {listing.seller.name || listing.seller.email}
										</p>
										<div className="flex items-center gap-2">
											<span className="price-medium">
												{currency(listing.priceCents)}
											</span>
											<span className="badge">{listing.status}</span>
										</div>
									</div>
									<div className="flex gap-2">
										<Link
											href={`/listings/${listing.id}`}
											className="btn-outline-small"
										>
											👁️
										</Link>
										<button
											onClick={() => deleteListing(listing.id)}
											className="btn-outline-small text-red-400 hover:bg-red-400/10"
											disabled={loading}
										>
											🗑️
										</button>
										{user.role === "admin" && listing.status === "DELETED" && (
											<button
												onClick={async () => {
													if (
														confirm(
															"Permanently delete this listing? This cannot be undone.",
														)
													) {
														setLoading(true);
														await fetch(
															`/api/admin/listings/${listing.id}?hard=1`,
															{ method: "DELETE" },
														);
														window.location.reload();
														setLoading(false);
													}
												}}
												className="btn-outline-small text-red-600 border-red-600 ml-2"
												title="Hard delete permanently"
												disabled={loading}
											>
												💀 Hard Delete
											</button>
										)}
									</div>
								</div>
								<p className="text-white/70 text-sm line-clamp-2">
									{listing.description || "No description"}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Flagged Content */}
				{flaggedContent.length > 0 && (
					<div className="panel p-8">
						<h2 className="text-heading-4 mb-6 text-yellow-400">
							⚠️ Flagged Content
						</h2>
						<div className="space-y-4">
							{flaggedContent.map((listing: any) => (
								<div
									key={listing.id}
									className="card p-4 border-l-4 border-yellow-400"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold">{listing.title}</h3>
											<p className="text-white/60 text-sm">
												By: {listing.seller.name || listing.seller.email}
											</p>
											<p className="text-white/70 text-sm mt-2">
												{listing.description}
											</p>
										</div>
										<div className="flex gap-2">
											<Link
												href={`/listings/${listing.id}`}
												className="btn-outline-small"
											>
												Review
											</Link>
											<button
												onClick={() => deleteListing(listing.id)}
												className="btn-outline-small text-red-400"
												disabled={loading}
											>
												Remove
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</main>
			{/* User Edit Modal */}
			{showUserModal && selectedUser && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
						<button
							className="absolute top-2 right-2 text-xl text-gray-500 hover:text-gray-800"
							onClick={() => setShowUserModal(false)}
							title="Close"
						>
							×
						</button>
						<h2 className="text-lg font-bold mb-4">Edit User</h2>
						<form
							className="space-y-4"
							onSubmit={async (e) => {
								e.preventDefault();
								setEditUserLoading(true);
								try {
									const res = await fetch("/api/admin/update-user", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											userId: selectedUser.id,
											name: editUserForm.name,
											email: editUserForm.email,
											role: editUserForm.role,
										}),
									});
									if (res.ok) {
										toast.success("User updated", "Changes saved");
										setShowUserModal(false);
										setEditUserLoading(false);
										window.location.reload();
									} else {
										const error = await res.json();
										toast.error(
											"Update failed",
											error.error || "Please try again",
										);
										setEditUserLoading(false);
									}
								} catch (err) {
									toast.error("Network error", "Could not update user");
									setEditUserLoading(false);
								}
							}}
						>
							<div>
								<label className="label">Name</label>
								<input
									className="input w-full"
									value={editUserForm?.name || ""}
									onChange={(e) =>
										setEditUserForm((f: any) => ({
											...f,
											name: e.target.value,
										}))
									}
									placeholder="User name"
								/>
							</div>
							<div>
								<label className="label">Email</label>
								<input
									className="input w-full"
									value={editUserForm?.email || ""}
									onChange={(e) =>
										setEditUserForm((f: any) => ({
											...f,
											email: e.target.value,
										}))
									}
									placeholder="User email"
									type="email"
								/>
							</div>
							<div>
								<label className="label">Role</label>
								<select
									className="input w-full"
									value={editUserForm?.role || "user"}
									onChange={(e) =>
										setEditUserForm((f: any) => ({
											...f,
											role: e.target.value,
										}))
									}
									disabled={selectedUser.id === user.id}
									title="Change user role"
								>
									<option value="user">User</option>
									<option value="admin">Admin</option>
									<option value="blocked">Blocked</option>
								</select>
							</div>
							<div className="flex gap-2 justify-end mt-6">
								<button
									type="button"
									className="btn-outline"
									onClick={() => setShowUserModal(false)}
									disabled={editUserLoading}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn"
									disabled={editUserLoading}
								>
									{editUserLoading ? "Saving..." : "Save"}
								</button>
							</div>
							{editUserLoading && (
								<div className="text-xs text-blue-400 mt-2">
									Saving changes...
								</div>
							)}
						</form>
						<div className="text-xs text-gray-400 mt-4">
							User ID: {selectedUser.id}
						</div>
					</div>
				</div>
			)}
			<footer className="woob-container py-10 text-white/60 text-sm">
				© {currentYear} TheWoob — Exclusive Members Club
			</footer>
		</>
	);
}
