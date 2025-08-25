import { GetServerSideProps } from "next";
import { loadStripe } from "@stripe/stripe-js";
import {
	Elements,
	CardElement,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { prisma } from "../../lib/prisma";
import Nav from "../../components/Nav";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { currency } from "../../lib/utils";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export const getServerSideProps: GetServerSideProps = async ({
	params,
	req,
	res,
}) => {
	const session = await getIronSession(req, res, sessionOptions);
	const id = String(params?.id);
	const l = await prisma.listing.findUnique({
		where: { id },
		include: { seller: true },
	});
	if (!l || (l.status?.toLowerCase() !== "active")) return { notFound: true };
	return {
		props: {
			l: JSON.parse(JSON.stringify(l)),
			authed: !!(session as any).user,
		},
	};
};

function CheckoutForm({ listingId, priceCents, title }: any) {
		const stripe = useStripe();
		const elements = useElements();
		const [loading, setLoading] = useState(false);
		const [message, setMessage] = useState("");
		const [paymentMethod, setPaymentMethod] = useState("card");
		const [feePreview, setFeePreview] = useState<{ subtotalCents: number; feeCents: number; totalCents: number } | null>(null);
		const [serverBreakdown, setServerBreakdown] = useState<{ subtotalCents: number; feeCents: number; totalCents: number } | null>(null);
		const [showTooltip, setShowTooltip] = useState(false);

		// Client-side fee preview (for UI only, not authoritative)
		function previewFee(method: "card" | "ach") {
			// These values should match server config, but are for preview only
			// If you want to sync with server, fetch /api/stripe/intent with method
			// For now, hardcode balanced preset
			const marginBps = 400, marginFixedCents = 99, minCents = 99, maxCents = 999;
			// Import computeFee from fees.ts
			// @ts-ignore
			const { computeFee } = require("../../lib/fees");
			const result = computeFee({ priceCents, method, marginBps, marginFixedCents, minCents, maxCents });
			setFeePreview({ subtotalCents: priceCents, feeCents: result.feeCents, totalCents: result.totalCents });
		}

		// Initial preview
		useState(() => { previewFee(paymentMethod); });

		async function handleMethodChange(e: any) {
			const method = e.target.value;
			setPaymentMethod(method);
			previewFee(method);
		}

		async function handleSubmit(e: any) {
			e.preventDefault();
			if (!stripe || !elements) return;
			setLoading(true);
			setMessage("");
			// Always use server-side fee calculation
			try {
				const r = await fetch("/api/stripe/intent", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ listingId, paymentMethod }),
				});
				const j = await r.json();
				console.log("/api/stripe/intent response:", j);
				setServerBreakdown({ subtotalCents: j.subtotalCents, feeCents: j.feeCents, totalCents: j.totalCents });
				if (!j.clientSecret) {
					setLoading(false);
					setMessage(j.error || "Failed to create payment");
					return;
				}
				const { error, paymentIntent } = await stripe.confirmCardPayment(j.clientSecret, {
					payment_method: { card: elements.getElement(CardElement)! },
				});
				console.log("stripe.confirmCardPayment result:", { error, paymentIntent });
				setLoading(false);
				if (error) setMessage(error.message || "Payment error");
				else setMessage("Payment complete! You can close this tab.");
			} catch (err) {
				setLoading(false);
				setMessage("Unexpected error: " + (err?.message || err));
				console.error("Checkout error:", err);
			}
		}

		// Use server breakdown if available, else preview
		const breakdown = serverBreakdown || feePreview || { subtotalCents: priceCents, feeCents: 0, totalCents: priceCents };

		return (
			<form onSubmit={handleSubmit} className="panel p-6 max-w-md mx-auto">
				<h2 className="text-2xl font-bold">Checkout</h2>
				<p className="text-white/60 mt-1">{title}</p>
				<div className="mt-4 p-3 rounded bg-black/40 border border-white/10">
					<CardElement options={{ hidePostalCode: true }} />
				</div>
				<div className="mt-4 flex gap-3 items-center">
					<label>
						<input type="radio" name="paymentMethod" value="card" checked={paymentMethod === "card"} onChange={handleMethodChange} /> Card
					</label>
					<label>
						<input type="radio" name="paymentMethod" value="ach" checked={paymentMethod === "ach"} onChange={handleMethodChange} /> ACH (Bank Transfer)
					</label>
				</div>
				<div className="mt-6 mb-2 text-white/90">
					<div className="flex justify-between">
						<span>Subtotal</span>
						<span>{currency(breakdown.subtotalCents)}</span>
					</div>
					<div className="flex justify-between items-center">
						<span>
							Service & Protection fee
							<span
								className="ml-2 cursor-pointer text-blue-400"
								onMouseEnter={() => setShowTooltip(true)}
								onMouseLeave={() => setShowTooltip(false)}
							>
								ⓘ
							</span>
							{showTooltip && (
								<span className="absolute bg-black/90 text-xs p-2 rounded shadow-lg mt-2 ml-2 z-50" style={{ minWidth: 220 }}>
									Fees help cover payment processing, buyer protection, and platform services. Final fee may vary by payment method and is capped per policy.
								</span>
							)}
						</span>
						<span>{currency(breakdown.feeCents)}</span>
					</div>
					<div className="flex justify-between font-bold mt-2">
						<span>Total</span>
						<span>{currency(breakdown.totalCents)}</span>
					</div>
				</div>
				<button className="btn w-full mt-4" disabled={loading || !stripe}>
					{loading ? "Processing..." : "Review order"}
				</button>
				<p className="text-sm text-white/70 mt-3">{message}</p>
				<p className="text-xs text-white/50 mt-2">
					Use Stripe test cards, e.g. 4242 4242 4242 4242
				</p>
			</form>
		);
}

export default function CheckoutPage({ l, authed }: any) {
	return (
		<>
			<Nav authed={authed} />
			<main className="woob-container py-8">
				<Elements stripe={stripePromise}>
					<CheckoutForm
						listingId={l.id}
						priceCents={l.priceCents}
						title={l.title}
					/>
				</Elements>
			</main>
		</>
	);
}
