import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import Nav from "../components/Nav";
import { useState } from "react";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	if (!(session as any).user)
		return { redirect: { destination: "/signin", permanent: false } };
	return { props: { authed: true } };
};

export default function Onboard() {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");
	async function start() {
		setLoading(true);
		const r = await fetch("/api/stripe/create-onboarding-link", {
			method: "POST",
		});
		const j = await r.json();
		setLoading(false);
		if (j.url) window.location.href = j.url;
		else alert(j.error || "Failed");
	}
	async function check() {
		const r = await fetch("/api/stripe/account-status");
		const j = await r.json();
		setStatus(JSON.stringify(j, null, 2));
	}
	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8">
				<div className="panel p-6 max-w-xl mx-auto">
					<h2 className="text-2xl font-bold">Stripe Express Onboarding</h2>
					<p className="text-white/70 mt-2">
						Connect your account to receive payouts.
					</p>
					<div className="mt-6 flex gap-3">
						<button className="btn" onClick={start} disabled={loading}>
							{loading ? "Working..." : "Start / Continue"}
						</button>
						<button className="btn-outline" onClick={check}>
							Check Status
						</button>
					</div>
					{status ? (
						<pre className="mt-4 text-xs bg-black/40 p-3 rounded border border-white/10">
							{status}
						</pre>
					) : null}
				</div>
			</main>
		</>
	);
}
