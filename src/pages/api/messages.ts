import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	if (req.method === "GET") {
		// Get conversations for the current user
		const conversations = await prisma.conversation.findMany({
			where: {
				OR: [{ buyerId: user.id }, { sellerId: user.id }],
			},
			include: {
				listing: {
					select: { id: true, title: true, images: true, priceCents: true },
				},
				buyer: {
					select: { id: true, name: true, email: true },
				},
				seller: {
					select: { id: true, name: true, email: true },
				},
				messages: {
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
			orderBy: { lastMessageAt: "desc" },
		});

		// Gracefully handle deleted users in conversations
		const mapped = conversations.map((c) => {
			const buyer = c.buyer || { id: null, name: "Deleted User", email: null };
			const seller = c.seller || { id: null, name: "Deleted User", email: null };
			const listing = c.listing || { id: null, title: "Deleted Listing", images: null, priceCents: null };
			return { ...c, buyer, seller, listing };
		});
		return res.json(mapped);
	}

	if (req.method === "POST") {
		// Start a new conversation or send a message
		const { listingId, content, receiverId } = req.body;

		if (!content?.trim()) {
			return res.status(400).json({ error: "Message content is required" });
		}

		let conversation;

		if (listingId) {
			// Starting conversation from a listing
			const listing = await prisma.listing.findUnique({
				where: { id: listingId },
				select: { id: true, sellerId: true },
			});

			if (!listing) {
				return res.status(404).json({ error: "Listing not found" });
			}

			if (listing.sellerId === user.id) {
				return res.status(400).json({ error: "Cannot message yourself" });
			}

			// Find or create conversation
			conversation = await prisma.conversation.upsert({
				where: {
					listingId_buyerId: {
						listingId: listingId,
						buyerId: user.id,
					},
				},
				update: {
					lastMessage: content,
					lastMessageAt: new Date(),
				},
				create: {
					listingId: listingId,
					buyerId: user.id,
					sellerId: listing.sellerId,
					lastMessage: content,
					lastMessageAt: new Date(),
				},
			});

			// Create the message
			const message = await prisma.message.create({
				data: {
					conversationId: conversation.id,
					senderId: user.id,
					receiverId: listing.sellerId,
					content: content.trim(),
				},
				include: {
					sender: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			return res.json({ conversation, message });
		}

		return res.status(400).json({ error: "Invalid request" });
	}

	res.status(405).json({ error: "Method not allowed" });
}
