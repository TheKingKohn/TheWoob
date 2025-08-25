import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { stripe } from "../../../lib/stripe";
import { prisma } from "../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	if (req.method !== "POST") return res.status(405).end();
	const user = (session as any).user;
	if (!user) return res.status(401).json({ error: "auth" });
	let accountId = user.stripeAccountId;
	if (!accountId) {
		const acct = await stripe.accounts.create({ type: "express" });
		accountId = acct.id;
		await prisma.user.update({
			where: { id: user.id },
			data: { stripeAccountId: accountId },
		});
		(session as any).user = { ...user, stripeAccountId: accountId };
		await session.save();
	}
	const link = await stripe.accountLinks.create({
		account: accountId,
		refresh_url: process.env.SITE_URL + "/onboard",
		return_url: process.env.SITE_URL + "/dashboard",
		type: "account_onboarding",
	});
	res.json({ url: link.url });
}
