import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
	const session = await getIronSession(req, res, sessionOptions);
	const user = session.user;
	if (!user || user.role !== "admin") {
		return res.status(403).json({ authed: false });
	}
	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			affiliateCode: true,
			invitedById: true,
		},
	});
	return res.status(200).json({ users, authed: true });
}
