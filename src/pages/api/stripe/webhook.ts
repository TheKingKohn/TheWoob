import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../../lib/stripe";
import { prisma } from "../../../lib/prisma";

export const config = { api: { bodyParser: false } };
function buffer(readable: any) {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: any[] = [];
		readable.on("data", (c: any) => chunks.push(Buffer.from(c)));
		readable.on("end", () => resolve(Buffer.concat(chunks)));
		readable.on("error", reject);
	});
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") return res.status(405).end();
	const sig = req.headers["stripe-signature"];
	if (!sig) return res.status(400).send("Missing signature");
	const buf = await buffer(req);
	let event;
	try {
		event = stripe.webhooks.constructEvent(
			buf,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!,
		);
	} catch (err: any) {
		console.error("Webhook error:", err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	if (event.type === "payment_intent.succeeded") {
		const pi = event.data.object as any;
		const order = await prisma.order.findUnique({
			where: { paymentIntentId: pi.id },
		});
		if (order) {
			await prisma.$transaction([
				prisma.order.update({
					where: { id: order.id },
					data: { status: "paid" },
				}),
				prisma.listing.update({
					where: { id: order.listingId },
					data: { status: "sold" },
				}),
			]);
		}
	}

	if (event.type === "charge.refunded") {
		const ch = event.data.object as any;
		if (ch.payment_intent) {
			const order = await prisma.order.findUnique({
				where: { paymentIntentId: ch.payment_intent },
			});
			if (order)
				await prisma.order.update({
					where: { id: order.id },
					data: { status: "refunded" },
				});
		}
	}

	res.json({ received: true });
}
