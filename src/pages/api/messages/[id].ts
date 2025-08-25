import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const { id } = req.query;

	if (req.method === "GET") {
		// Get messages for a specific conversation
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: id as string,
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
					include: {
						sender: {
							select: { id: true, name: true, email: true },
						},
					},
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Mark messages as read
		await prisma.message.updateMany({
			where: {
				conversationId: id as string,
				receiverId: user.id,
				read: false,
			},
			data: { read: true },
		});

		return res.json(conversation);
	}

	if (req.method === "POST") {
		// Send a message to this conversation
		const { content } = req.body;

		if (!content?.trim()) {
			return res.status(400).json({ error: "Message content is required" });
		}

		const conversation = await prisma.conversation.findFirst({
			where: {
				id: id as string,
				OR: [{ buyerId: user.id }, { sellerId: user.id }],
			},
		});

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		const receiverId =
			conversation.buyerId === user.id
				? conversation.sellerId
				: conversation.buyerId;

		const message = await prisma.message.create({
			data: {
				conversationId: conversation.id,
				senderId: user.id,
				receiverId: receiverId,
				content: content.trim(),
			},
			include: {
				sender: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		// Update conversation
		await prisma.conversation.update({
			where: { id: conversation.id },
			data: {
				lastMessage: content.trim(),
				lastMessageAt: new Date(),
			},
		});

		return res.json(message);
	}

	res.status(405).json({ error: "Method not allowed" });
}
