import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { stripe } from "../../../lib/stripe";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	const user = (session as any).user;
	if (!user?.stripeAccountId)
		return res.status(400).json({ error: "no stripe account" });
	const acct = await stripe.accounts.retrieve(user.stripeAccountId);
	res.json({
		chargesEnabled: acct.charges_enabled,
		detailsSubmitted: acct.details_submitted,
	});
}
