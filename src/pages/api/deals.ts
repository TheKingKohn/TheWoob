import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user) return res.status(401).json({ error: "Authentication required" });

	if (req.method === "GET") {
		const deals = await prisma.deal.findMany({
			where: { isActive: true },
			orderBy: { createdAt: "desc" },
		});
		return res.status(200).json({ deals });
	}

	res.setHeader("Allow", ["GET"]);
	res.status(405).json({ error: "Method Not Allowed" });
}
