import { useState } from "react";
import Link from "next/link";
import { toast } from "./Toast";

interface ContactSellerProps {
	listingId: string;
	listingTitle: string;
	currentUserId?: string;
	onConversationStart: (conversationId: string) => void;
}

export default function ContactSeller({
	listingId,
	listingTitle,
	currentUserId,
	onConversationStart,
}: ContactSellerProps) {
	const [showModal, setShowModal] = useState(false);
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);

	if (!currentUserId) {
		return (
			<Link href="/signin" className="btn w-full">
				Sign in to Contact Seller
			</Link>
		);
	}

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim() || sending) return;

		setSending(true);
		try {
			const response = await fetch("/api/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listingId,
					content: message,
				}),
			});

			if (response.ok) {
				const { conversation } = await response.json();
				toast.success("Message sent! Opening conversation...");
				setShowModal(false);
				setMessage("");
				onConversationStart(conversation.id);
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to send message");
			}
		} catch (error) {
			toast.error("Error sending message");
		} finally {
			setSending(false);
		}
	};

	return (
		<>
			<button onClick={() => setShowModal(true)} className="btn w-full">
				💬 Contact Seller
			</button>

			{showModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					style={{
						background: "rgba(20, 20, 30, 0.85)",
						backdropFilter: "blur(8px)",
					}}
				>
					<div className="bg-gradient-to-br from-black via-woob-dark to-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md">
						<div className="p-6">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">Contact Seller</h3>
								<button
									onClick={() => setShowModal(false)}
									className="text-white/60 hover:text-white transition-colors text-xl"
								>
									✕
								</button>
							</div>

							<p className="text-white/70 text-sm mb-4">
								Send a message about: <strong>{listingTitle}</strong>
							</p>

							<form onSubmit={sendMessage}>
								<div className="mb-4">
									<label className="label">Your message</label>
									<textarea
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										placeholder="Hi! I'm interested in this item. Is it still available?"
										className="input w-full h-24 resize-none"
										disabled={sending}
										required
									/>
								</div>

								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => setShowModal(false)}
										className="btn-outline flex-1"
										disabled={sending}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={!message.trim() || sending}
										className="btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{sending ? "Sending..." : "Send Message"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
