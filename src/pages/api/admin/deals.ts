import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user || user.role !== "admin")
		return res.status(401).json({ error: "Admin access required" });

	if (req.method === "POST") {
		const {
			title,
			description,
			businessName,
			discountDetails,
			validFrom,
			validTo,
			imageUrl,
		} = req.body;
		if (!title || !businessName)
			return res.status(400).json({ error: "Missing required fields" });
		const deal = await prisma.deal.create({
			data: {
				title,
				description,
				businessName,
				discountDetails,
				validFrom: validFrom ? new Date(validFrom) : null,
				validTo: validTo ? new Date(validTo) : null,
				imageUrl,
				createdBy: user.id,
				isActive: true,
			},
		});
		return res.status(201).json({ deal });
	}

	if (req.method === "GET") {
		const deals = await prisma.deal.findMany({
			orderBy: { createdAt: "desc" },
		});
		return res.status(200).json({ deals });
	}

	res.setHeader("Allow", ["GET", "POST"]);
	res.status(405).json({ error: "Method Not Allowed" });
}
