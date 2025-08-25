import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { stripe } from "../../../lib/stripe";
import { getFeesPolicy } from "../../../lib/fees.config";
import { computeFee } from "../../../lib/fees";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
		if (req.method !== "POST") return res.status(405).end();
		const { listingId, paymentMethod: clientMethod } = req.body ?? {};
		console.log('API /stripe/intent listingId:', listingId);
		const l = await prisma.listing.findUnique({
			where: { id: String(listingId) },
			include: { seller: true },
		});
		console.log('API /stripe/intent found listing:', l);
		if (!l || l.status?.toLowerCase() !== "active")
			return res.status(400).json({ error: "Invalid listing" });
		// Self-purchase is allowed for testing. No block here.
		if (!l.seller.stripeAccountId)
			return res.status(400).json({ error: "Seller not onboarded for payouts" });

		// Detect payment method
		let method: "card" | "ach" = "card";
		if (clientMethod === "ach") method = "ach";

		// Load fee policy
		const policy = getFeesPolicy();
		// Compute fees
		const feeResult = computeFee({
			priceCents: l.priceCents,
			method,
			marginBps: policy.marginBps,
			marginFixedCents: policy.marginFixedCents,
			minCents: policy.minCents,
			maxCents: policy.maxCents,
		});

		// Create PaymentIntent for totalCents
		const intent = await stripe.paymentIntents.create({
			amount: feeResult.totalCents,
			currency: "usd",
			application_fee_amount: feeResult.platformMarginCents,
			transfer_data: { destination: l.seller.stripeAccountId },
			metadata: { listingId: l.id },
		});

		await prisma.order.create({
			data: {
				listingId: l.id,
				amountCents: l.priceCents,
				paymentIntentId: intent.id,
				status: "pending",
				platformFeeCents: feeResult.platformMarginCents,
				feePolicyVersion: process.env.FEES_MODE || "balanced",
				paymentMethod: method,
				totalCents: feeResult.totalCents,
			},
		});

		res.status(200).json({
			clientSecret: intent.client_secret,
			subtotalCents: l.priceCents,
			feeCents: feeResult.feeCents,
			totalCents: feeResult.totalCents,
		});
}
