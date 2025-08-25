import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/getSession";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getSession(req, res);
	const user = (session as any).user;
	const { id } = req.query;
	const hard = req.query.hard === "1";

	if (!user || user.role !== "admin")
		return res.status(403).json({ error: "Admin only" });

	if (req.method === "PUT") {
		const { title, priceCents, description, category, images, videoUrl } =
			req.body;
		try {
			const listing = await prisma.listing.findUnique({
				where: { id: String(id) },
			});
			if (!listing) return res.status(404).json({ error: "Listing not found" });
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
			console.error("Admin update listing error:", error);
			return res.status(500).json({ error: "Failed to update listing" });
		}
	}

	if (req.method === "DELETE" && hard) {
		// Remove associated media (images/videos)
		const listing = await prisma.listing.findUnique({
			where: { id: String(id) },
		});
		if (!listing) return res.status(404).json({ error: "Listing not found" });
		// TODO: Remove media from storage (implement as needed)
		await prisma.listing.delete({ where: { id: String(id) } });
		await prisma.adminAudit.create({
			data: {
				adminId: user.id,
				action: "HARD_DELETE",
				targetType: "Listing",
				targetId: String(id),
				createdAt: new Date(),
				ip:
					req.headers["x-forwarded-for"]?.toString() ||
					req.socket.remoteAddress ||
					"",
			},
		});
		return res.status(204).send("");
	}

	return res.status(405).json({ error: "Method Not Allowed" });
}
