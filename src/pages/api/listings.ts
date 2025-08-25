import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import { categories } from "../../lib/utils";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	if (req.method === "POST") {
		const user = (session as any).user;
		if (!user)
			return res.status(401).json({ error: "Authentication required" });
		const {
			title,
			priceCents,
			images,
			videoUrl,
			description,
			category,
			isDigital,
			digitalFileUrl,
			licenseKey,
		} = req.body;
		// Validation
		if (!title?.trim()) {
			return res.status(400).json({ error: "Title is required" });
		}
		if (!priceCents || priceCents < 100) {
			return res.status(400).json({ error: "Price must be at least $1.00" });
		}
		if (category && !categories.includes(category)) {
			return res.status(400).json({ error: "Invalid category" });
		}
		if (isDigital) {
			if (!digitalFileUrl || typeof digitalFileUrl !== "string") {
				return res
					.status(400)
					.json({ error: "Digital product file is required" });
			}
			if (!isValidUrl("http://localhost" + digitalFileUrl)) {
				return res.status(400).json({ error: "Invalid digital file URL" });
			}
		} else {
			if (!images) {
				return res
					.status(400)
					.json({
						error: "At least one image is required for physical products",
					});
			}
		}
		try {
			const listing = await prisma.listing.create({
				data: {
					title: title.trim(),
					priceCents: Number(priceCents),
					images: images || null, // Store JSON string of image URLs
					videoUrl: videoUrl || null,
					description: description?.trim() || null,
					category: category || "General",
					sellerId: user.id,
					isDigital: !!isDigital,
					digitalFileUrl: isDigital ? digitalFileUrl : null,
					licenseKey: isDigital && licenseKey ? licenseKey : null,
				},
			});
			return res.status(201).json({ listing });
		} catch (error) {
			console.error("Error creating listing:", error);
			return res.status(500).json({ error: "Failed to create listing" });
		}
	}

	if (req.method === "GET") {
		try {
			const listings = await prisma.listing.findMany({
				where: { status: "active" },
				orderBy: { createdAt: "desc" },
				include: {
					seller: {
						select: { name: true, email: true },
					},
				},
			});
			return res.status(200).json({ listings });
		} catch (error) {
			console.error("Error fetching listings:", error);
			return res.status(500).json({ error: "Failed to fetch listings" });
		}
	}

	res.setHeader("Allow", ["GET", "POST"]);
	res.status(405).json({ error: "Method Not Allowed" });
}

function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}
