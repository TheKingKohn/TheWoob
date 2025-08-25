import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../../lib/session";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user || user.role !== "admin")
		return res.status(401).json({ error: "Admin access required" });

	const { id } = req.query;
	if (typeof id !== "string")
		return res.status(400).json({ error: "Invalid deal ID" });

	if (req.method === "PATCH") {
		const {
			title,
			description,
			businessName,
			discountDetails,
			validFrom,
			validTo,
			imageUrl,
			isActive,
		} = req.body;
		const deal = await prisma.deal.update({
			where: { id },
			data: {
				title,
				description,
				businessName,
				discountDetails,
				validFrom: validFrom ? new Date(validFrom) : null,
				validTo: validTo ? new Date(validTo) : null,
				imageUrl,
				isActive: typeof isActive === "boolean" ? isActive : undefined,
			},
		});
		return res.status(200).json({ deal });
	}

	if (req.method === "DELETE") {
		await prisma.deal.delete({ where: { id } });
		return res.status(204).end();
	}

	res.setHeader("Allow", ["PATCH", "DELETE"]);
	res.status(405).json({ error: "Method Not Allowed" });
}
