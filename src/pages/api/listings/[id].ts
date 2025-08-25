import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "../../../lib/getSession";
import { prisma } from "../../../lib/prisma";
import { sessionOptions } from "../../../lib/session";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getSession(req, res);
	const user = (session as any).user;
	const { id } = req.query;

	if (!user) return res.status(401).json({ error: "Authentication required" });

	if (req.method === "PUT") {
		const { title, priceCents, description, category, images, videoUrl } =
			req.body;
		try {
			const listing = await prisma.listing.findUnique({
				where: { id: String(id) },
			});
			if (!listing) return res.status(404).json({ error: "Listing not found" });
			if (listing.sellerId !== user.id)
				return res.status(403).json({ error: "Not authorized" });
			const updated = await prisma.listing.update({
				where: { id: String(id) },
				data: {
					title,
					priceCents,
					description,
					category,
					images,
					videoUrl,
				},
			});
			return res.status(200).json({ listing: updated });
		} catch (error) {
			console.error("Update listing error:", error);
			return res.status(500).json({ error: "Failed to update listing" });
		}
	}

	if (req.method === "DELETE") {
		try {
			const listing = await prisma.listing.findUnique({
				where: { id: String(id) },
			});
			if (!listing) return res.status(404).json({ error: "Listing not found" });
			if (listing.sellerId !== user.id)
				return res.status(403).json({ error: "Not authorized" });
			await prisma.listing.update({
				where: { id: String(id) },
				data: { status: "DELETED", deletedAt: new Date() },
			});
			return res.status(204).send("");
		} catch (error) {
			console.error("Delete listing error:", error);
			return res.status(500).json({ error: "Failed to delete listing" });
		}
	}

	res.setHeader("Allow", ["PUT", "DELETE"]);
	res.status(405).json({ error: "Method Not Allowed" });
}
