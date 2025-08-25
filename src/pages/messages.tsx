import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import Nav from "../components/Nav";
import ChatInterface from "../components/ChatInterface";
import UserRatingDisplay from "../components/UserRating";
import { toast } from "../components/Toast";

interface Conversation {
	id: string;
	listing: {
		id: string;
		title: string;
		images: string;
		priceCents: number;
	};
	buyer: {
		id: string;
		name: string;
		email: string;
	};
	seller: {
		id: string;
		name: string;
		email: string;
	};
	lastMessage: string;
	lastMessageAt: string;
	messages: Array<{
		id: string;
		content: string;
		createdAt: string;
		senderId: string;
	}>;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return { redirect: { destination: "/signin", permanent: false } };
	}

	return { props: { user } };
};

export default function Messages({ user }: any) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<
		string | null
	>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchConversations();
	}, []);

	const fetchConversations = async () => {
		try {
			const response = await fetch("/api/messages");
			if (response.ok) {
				const data = await response.json();
				setConversations(data);
			} else {
				toast.error("Failed to load conversations");
			}
		} catch (error) {
			toast.error("Error loading conversations");
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (diffDays === 1) {
			return "Yesterday";
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: "short" });
		} else {
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
		}
	};

	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Messages</h1>
					<p className="text-white/70">
						Your conversations with buyers and sellers
					</p>
				</div>

				{loading ? (
					<div className="panel p-8 text-center">
						<div className="flex items-center justify-center gap-3">
							<div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-woob-accent rounded-full" />
							<span>Loading conversations...</span>
						</div>
					</div>
				) : conversations.length === 0 ? (
					<div className="panel p-8 text-center">
						<div className="text-6xl mb-4">💬</div>
						<h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
						<p className="text-white/70 mb-6">
							Start conversations by contacting sellers on their listings
						</p>
						<Link href="/browse" className="btn">
							Browse Listings
						</Link>
					</div>
				) : (
					<div className="grid gap-4">
						{conversations.map((conversation) => {
							const otherUser =
								conversation.buyer?.id === user.id
									? conversation.seller
									: conversation.buyer;
							const listingImages = conversation.listing.images
								? JSON.parse(conversation.listing.images)
								: [];
							const firstImage = listingImages[0];
							const isFromCurrentUser =
								conversation.messages[0]?.senderId === user.id;

							// Handle deleted user
							const isDeleted = !otherUser || !otherUser.id;
							const deletedName =
								otherUser?.name || otherUser?.email || "Unknown";

							return (
								<div
									key={conversation.id}
									onClick={() => setSelectedConversation(conversation.id)}
									className="panel p-4 hover:bg-white/5 cursor-pointer transition-colors"
								>
									<div className="flex items-center gap-4">
										{firstImage && (
											<Image
												src={firstImage}
												alt={conversation.listing.title}
												width={64}
												height={64}
												className="object-cover rounded-lg"
											/>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold truncate">
														{conversation.listing.title}
													</h3>
													<p className="text-sm text-white/70">
														with{" "}
														{isDeleted
															? `Deleted User - ${deletedName}`
															: otherUser.name || otherUser.email}
													</p>
													{!isDeleted && (
														<UserRatingDisplay
															userId={otherUser.id}
															userName={otherUser.name || otherUser.email}
															size="small"
														/>
													)}
												</div>
												<div className="text-right ml-4">
													<p className="text-sm font-semibold">
														$
														{(conversation.listing.priceCents / 100).toFixed(2)}
													</p>
													{conversation.lastMessageAt && (
														<p className="text-xs text-white/60">
															{formatTime(conversation.lastMessageAt)}
														</p>
													)}
												</div>
											</div>
											{conversation.lastMessage && (
												<p className="text-sm text-white/80 mt-2 truncate">
													{isFromCurrentUser ? "You: " : ""}
													{conversation.lastMessage}
												</p>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>

			{selectedConversation && (
				<ChatInterface
					conversationId={selectedConversation}
					currentUserId={user.id}
					onClose={() => setSelectedConversation(null)}
				/>
			)}
		</>
	);
}
