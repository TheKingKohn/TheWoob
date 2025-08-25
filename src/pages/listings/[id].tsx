import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { prisma } from "../../lib/prisma";
import Nav from "../../components/Nav";
import ImageGallery from "../../components/ImageGallery";
import ContactSeller from "../../components/ContactSeller";
import ChatInterface from "../../components/ChatInterface";
import UserRatingDisplay from "../../components/UserRating";
import { currency, formatDate } from "../../lib/utils";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";

export const getServerSideProps: GetServerSideProps = async ({
	params,
	req,
	res,
}) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	const id = String(params?.id);
	const l = await prisma.listing.findUnique({
		where: { id },
		include: { seller: true, order: true },
	});
	if (!l) return { notFound: true };
	const isOwner = user && user.id === l.sellerId;
	const isAdmin = user && user.role === "admin";
	const allowedStatuses = ["ACTIVE"];
	if (!(isOwner || isAdmin) && !allowedStatuses.includes(l.status))
		return { notFound: true };
	return {
		props: {
			l: JSON.parse(JSON.stringify(l)),
			authed: !!user,
			user: user || null,
		},
	};
};

export default function Listing({ l, authed, user }: any) {
	const [selectedConversation, setSelectedConversation] = useState<
		string | null
	>(null);
	const [showSellerProfile, setShowSellerProfile] = useState(false);
	const images = l.images ? JSON.parse(l.images) : [];

	const isOwnListing = user && user.id === l.sellerId;

	return (
		<>
			<Nav authed={authed} />
			<main className="woob-container py-8">
				<div className="grid lg:grid-cols-2 gap-8">
					{/* Image Gallery */}
					<div>
						<ImageGallery images={images} title={l.title} />
					</div>

					{/* Product Details */}
					<div className="space-y-6">
						<div className="panel p-6">
							<div className="flex items-start justify-between gap-4 mb-4">
								<h1 className="text-3xl font-bold flex-1">{l.title}</h1>
							</div>

							<div className="text-4xl font-extrabold text-woob-accent mb-4">
								{currency(l.priceCents)}
							</div>

							{l.description && (
								<div className="space-y-2">
									<h3 className="font-semibold text-lg">Description</h3>
									<p className="text-white/80 leading-relaxed">
										{l.description}
									</p>
								</div>
							)}
						</div>

						{/* Purchase Panel */}
						<div className="panel p-6">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-woob-accent/20 flex items-center justify-center overflow-hidden">
										{l.seller?.image ? (
											<img
												src={l.seller.image}
												alt="Seller profile"
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-2xl">👤</span>
										)}
									</div>
									<div className="flex-1">
										<p className="font-medium">Seller</p>
										<div className="flex items-center gap-2">
											<Link
												href={`/user/${l.sellerId}/reviews`}
												className="text-woob-accent underline hover:text-woob-accent/80 text-sm transition-colors"
												title={`View ${l.seller?.name || l.seller?.email}'s profile and reviews`}
											>
												{l.seller?.name || l.seller?.email}
											</Link>
										</div>
										<UserRatingDisplay
											userId={l.sellerId}
											userName={l.seller?.name || l.seller?.email}
											size="small"
										/>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-woob-accent/20 rounded-full flex items-center justify-center">
										📅
									</div>
									<div>
										<p className="font-medium">Listed</p>
										<p className="text-white/60 text-sm">
											{formatDate(l.createdAt)}
										</p>
									</div>
								</div>

								<div className="border-t border-white/10 pt-4">
									<div className="grid grid-cols-1 gap-3">
										{!isOwnListing && (
											<ContactSeller
												listingId={l.id}
												listingTitle={l.title}
												currentUserId={user?.id}
												onConversationStart={setSelectedConversation}
											/>
										)}
										<div className="grid grid-cols-2 gap-3">
											<Link
												className="btn text-center font-semibold"
												href={`/checkout/${l.id}`}
											>
												💳 Buy Now
											</Link>
											<Link className="btn-outline text-center" href="/browse">
												← Back to Browse
											</Link>
											{isOwnListing && (
												<Link
													className="btn text-center font-semibold bg-woob-accent/80 hover:bg-woob-accent"
													href={`/listings/edit?id=${l.id}`}
												>
													✏️ Edit Listing
												</Link>
											)}
										</div>
									</div>
									<p className="text-white/50 text-xs mt-3 text-center">
										Secure checkout via Stripe • TheWoob keeps a small service
										fee
									</p>
								</div>
							</div>
						</div>

						{/* Safety Notice */}
						<div className="panel p-4 bg-woob-accent/10 border-woob-accent/30">
							<div className="flex items-center gap-3">
								<span className="text-2xl">🛡️</span>
								<div>
									<h4 className="font-medium text-woob-accent">
										Safe Trading Tips
									</h4>
									<p className="text-white/70 text-sm">
										Meet in public places. Check items before purchasing. Report
										suspicious activity.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			{selectedConversation && user && (
				<ChatInterface
					conversationId={selectedConversation}
					currentUserId={user.id}
					onClose={() => setSelectedConversation(null)}
				/>
			)}
		</>
	);
}
