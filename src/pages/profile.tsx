import { getIronSession } from "iron-session";
import Link from "next/link";
import Image from "next/image";
import { sessionOptions } from "../lib/session";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import { useState } from "react";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user) return { redirect: { destination: "/signin", permanent: false } };

	const fullUser = await prisma.user.findUnique({
		where: { id: user.id },
		include: {
			listings: { orderBy: { createdAt: "desc" } },
			orders: {
				include: { listing: true },
				orderBy: { createdAt: "desc" },
			},
		},
	});

	return {
		props: {
			authed: true,
			user: JSON.parse(JSON.stringify(fullUser)),
		},
	};
};

export default function Profile({ user }: any) {
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState(user.name || "");
	const [bio, setBio] = useState(user.bio || "");
	const [loading, setLoading] = useState(false);
	const [profileImage, setProfileImage] = useState(user.image || "");

	const handleProfileImageChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setLoading(true);
		const formData = new FormData();
		formData.append("file", file);
		const res = await fetch("/api/upload-profile-image", {
			method: "POST",
			body: formData,
		});
		if (res.ok) {
			const data = await res.json();
			setProfileImage(data.image);
			window.location.reload();
		} else {
			alert("Failed to upload image");
		}
		setLoading(false);
	};

	const handleUpdateProfile = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/auth/update-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, bio }),
			});
			if (response.ok) {
				setIsEditing(false);
				window.location.reload();
			} else {
				alert("Failed to update profile");
			}
		} catch (error) {
			alert("Error updating profile");
		}
		setLoading(false);
	};

	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8">
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Profile Info */}
					<div className="panel p-6">
						{/* Referral Code Section: Only show for logged-in user */}
						{user.affiliateCode && (
							<div className="mb-6 flex items-center gap-3">
								<span className="label">Your Referral Code:</span>
								<span className="font-mono bg-black/20 px-3 py-1 rounded text-lg select-all">
									{user.affiliateCode}
								</span>
								<button
									className="btn-outline btn-xs"
									onClick={() =>
										navigator.clipboard.writeText(user.affiliateCode)
									}
									title="Copy referral code"
								>
									Copy
								</button>
							</div>
						)}
						<div className="flex items-center justify-between mb-4">
							<h1 className="text-2xl font-bold">My Profile</h1>
							<button
								className="btn-outline"
								onClick={() => setIsEditing(!isEditing)}
							>
								{isEditing ? "Cancel" : "Edit"}
							</button>
						</div>
						<div className="flex items-center gap-6 mb-6">
							<div className="relative">
								{/* Profile picture circle */}
								<div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
									{profileImage ? (
										<Image
											src={profileImage}
											alt="Profile"
											width={80}
											height={80}
											className="w-full h-full object-cover"
										/>
									) : null}
								</div>
							</div>
							<div className="flex-1">
								<label className="label">Display Name</label>
								{isEditing ? (
									<div className="flex flex-col gap-2">
										<input
											className="input flex-1"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Your display name"
										/>
										<label className="label mt-2">Bio</label>
										<textarea
											className="input flex-1 min-h-[60px]"
											value={bio}
											onChange={(e) => setBio(e.target.value)}
											placeholder="Add a short bio about yourself"
										/>
										<button
											className="btn mt-2"
											onClick={handleUpdateProfile}
											disabled={loading}
										>
											{loading ? "Saving..." : "Save"}
										</button>
									</div>
								) : (
									<>
										<div className="input bg-black/20 mb-2">
											{user.name || "No name set"}
										</div>
										{user.bio && (
											<div className="input bg-black/20 text-white/80 text-xs md:text-sm font-medium mb-2 whitespace-pre-line">
												{user.bio}
											</div>
										)}
									</>
								)}
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-6">
							<div>
								<label className="label">Email</label>
								<div className="input bg-black/20 text-white/60 cursor-not-allowed">
									{user.email}
								</div>
								<p className="text-xs text-white/40 mt-1">
									Email cannot be changed
								</p>
							</div>
							<div>
								<label className="label">Bio</label>
								<div className="input bg-black/20 text-white/80 text-xs md:text-sm font-medium min-h-[40px] whitespace-pre-line">
									{user.bio ? (
										user.bio
									) : (
										<span className="text-white/40">No bio set</span>
									)}
								</div>
							</div>
						</div>

						<div className="mt-6 grid md:grid-cols-3 gap-4">
							<div className="panel p-4">
								<div className="label">Stripe Status</div>
								<div className="text-lg font-semibold">
									{user.stripeAccountId ? (
										<span className="text-green-400">Connected</span>
									) : (
										<span className="text-orange-400">Not Connected</span>
									)}
								</div>
								{!user.stripeAccountId && (
									<Link
										href="/onboard"
										className="btn-outline mt-2 inline-block"
									>
										Connect Now
									</Link>
								)}
							</div>

							<div className="panel p-4">
								<div className="label">Total Listings</div>
								<div className="text-2xl font-bold">
									{user.listings?.length || 0}
								</div>
							</div>

							<div className="panel p-4">
								<div className="label">Total Orders</div>
								<div className="text-2xl font-bold">
									{user.orders?.length || 0}
								</div>
							</div>
						</div>
					</div>

					{/* Recent Activity */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Recent Listings */}
						<div className="panel p-6">
							<h2 className="text-xl font-semibold mb-4">My Recent Listings</h2>
							{user.listings?.length > 0 ? (
								<div className="space-y-3">
									{user.listings.slice(0, 5).map((listing: any) => (
										<div
											key={listing.id}
											className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
										>
											<div>
												<div className="font-medium">{listing.title}</div>
												<div className="text-sm text-white/60">
													${(listing.priceCents / 100).toFixed(2)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<span
													className={`badge ${
														listing.status === "active"
															? "bg-green-500/20 text-green-400"
															: listing.status === "sold"
																? "bg-blue-500/20 text-blue-400"
																: "bg-gray-500/20 text-gray-400"
													}`}
												>
													{listing.status}
												</span>
												<a
													href={`/listings/${listing.id}`}
													className="btn-outline text-sm"
												>
													View
												</a>
											</div>
										</div>
									))}
									{user.listings.length > 5 && (
										<Link
											href="/dashboard"
											className="btn-outline w-full text-center mt-3"
										>
											View All Listings
										</Link>
									)}
								</div>
							) : (
								<div className="text-center py-8">
									<p className="text-white/60 mb-4">No listings yet</p>
									<Link href="/sell/new" className="btn">
										Create Your First Listing
									</Link>
								</div>
							)}
						</div>

						{/* Recent Orders */}
						<div className="panel p-6">
							<h2 className="text-xl font-semibold mb-4">My Recent Orders</h2>
							{user.orders?.length > 0 ? (
								<div className="space-y-3">
									{user.orders.slice(0, 5).map((order: any) => (
										<div
											key={order.id}
											className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
										>
											<div>
												<div className="font-medium">
													{order.listing?.title}
												</div>
												<div className="text-sm text-white/60">
													${(order.amountCents / 100).toFixed(2)}
												</div>
											</div>
											<span
												className={`badge ${
													order.status === "paid"
														? "bg-green-500/20 text-green-400"
														: order.status === "pending"
															? "bg-yellow-500/20 text-yellow-400"
															: "bg-red-500/20 text-red-400"
												}`}
											>
												{order.status}
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<p className="text-white/60 mb-4">No orders yet</p>
									<Link href="/browse" className="btn">
										Start Shopping
									</Link>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
