import { useState, useEffect, useRef, useCallback } from "react";
// ...existing code...
import Image from "next/image";
import { toast } from "./Toast";

interface Message {
	id: string;
	content: string;
	senderId: string;
	createdAt: string;
	sender: {
		id: string;
		name: string;
		email: string;
	};
}

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
	messages: Message[];
}

interface ChatInterfaceProps {
	conversationId: string;
	currentUserId: string;
	onClose: () => void;
}

export default function ChatInterface({
	conversationId,
	currentUserId,
	onClose,
}: ChatInterfaceProps) {
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [loading, setLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const fetchConversation = useCallback(async () => {
		try {
			const response = await fetch(`/api/messages/${conversationId}`);
			if (response.ok) {
				const data = await response.json();
				setConversation(data);
			} else {
				toast.error("Failed to load conversation");
			}
		} catch (error) {
			toast.error("Error loading conversation");
		} finally {
			setLoading(false);
		}
	}, [conversationId]);

	useEffect(() => {
		fetchConversation();
	}, [fetchConversation]);

	useEffect(() => {
		scrollToBottom();
	}, [conversation?.messages]);

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || sending) return;

		setSending(true);
		try {
			const response = await fetch(`/api/messages/${conversationId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: newMessage }),
			});

			if (response.ok) {
				const message = await response.json();
				setConversation((prev) =>
					prev
						? {
								...prev,
								messages: [...prev.messages, message],
							}
						: null,
				);
				setNewMessage("");
			} else {
				toast.error("Failed to send message");
			}
		} catch (error) {
			toast.error("Error sending message");
		} finally {
			setSending(false);
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
				<div className="bg-woob-dark border border-white/20 rounded-lg p-6">
					<div className="flex items-center gap-3">
						<div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-woob-accent rounded-full" />
						<span>Loading conversation...</span>
					</div>
				</div>
			</div>
		);
	}

	if (!conversation) {
		return (
			<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
				<div className="bg-woob-dark border border-white/20 rounded-lg p-6">
					<p>Conversation not found</p>
					<button onClick={onClose} className="btn mt-4">
						Close
					</button>
				</div>
			</div>
		);
	}

	const otherUser =
		conversation.buyer.id === currentUserId
			? conversation.seller
			: conversation.buyer;
	const listingImages = conversation.listing && conversation.listing.images
		? JSON.parse(conversation.listing.images)
		: [];
	const firstImage = listingImages[0];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
			<div className="bg-gradient-to-br from-black via-woob-dark to-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col p-2">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-white/20">
					<div className="flex items-center gap-3">
						{firstImage && (
							<Image
								src={firstImage}
								alt={conversation.listing.title}
								width={48}
								height={48}
								className="object-cover rounded-lg"
							/>
						)}
						<div>
							<h3 className="font-semibold">{conversation.listing?.title || "Deleted Listing"}</h3>
							<p className="text-sm text-white/70">
								Chat with{" "}
								<button
									className="text-woob-accent underline hover:text-woob-accent/80 focus:outline-none"
									onClick={() => setShowProfileModal(true)}
									title={`View ${(otherUser?.name || otherUser?.email || "Deleted User") + "'s profile and reviews"}`}
								>
									{otherUser?.name || otherUser?.email || "Deleted User"}
								</button>
							</p>
						</div>
						{/* Profile Modal */}
						{showProfileModal && (
							<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
								<div className="bg-gradient-to-br from-black via-woob-dark to-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col p-6 overflow-y-auto">
									<button
										className="absolute top-4 right-6 text-white/60 hover:text-white text-2xl"
										onClick={() => setShowProfileModal(false)}
										title="Close"
									>
										×
									</button>
									{/* Embed public profile and reviews */}
									{otherUser?.id ? (
										<iframe
											src={`/user/${otherUser.id}/reviews`}
											title="User Profile and Reviews"
											className="w-full h-full border-0 rounded-xl bg-transparent"
										/>
									) : (
										<div className="text-center text-white/70 py-8">
											<p>This user has been deleted. Profile and reviews are not available.</p>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
					<button
						onClick={onClose}
						className="text-white/60 hover:text-white transition-colors text-xl"
					>
						✕
					</button>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{conversation.messages.map((message) => {
						const isFromCurrentUser = message.senderId === currentUserId;
						return (
							<div
								key={message.id}
								className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
										isFromCurrentUser
											? "bg-woob-accent text-black"
											: "bg-white/70 text-white"
									}`}
								>
									<p className="text-sm">{message.content}</p>
									<p
										className={`text-xs mt-1 ${
											isFromCurrentUser ? "text-black/60" : "text-white/60"
										}`}
									>
										{new Date(message.createdAt).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>

				{/* Message Input */}
				<form onSubmit={sendMessage} className="p-4 border-t border-white/20">
					<div className="flex gap-2">
						<input
							type="text"
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							placeholder="Type your message..."
							className="flex-1 input"
							disabled={sending}
						/>
						<button
							type="submit"
							disabled={!newMessage.trim() || sending}
							className="btn disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{sending ? "..." : "Send"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
