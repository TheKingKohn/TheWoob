import Nav from "../components/Nav";
import { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { prisma } from "../lib/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	if (!user) return { redirect: { destination: "/signin", permanent: false } };
	const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
	return {
		props: { user: fullUser ? JSON.parse(JSON.stringify(fullUser)) : null },
	};
};

export default function Affiliate({ user }: any) {
	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-12">
				<div className="panel p-8 max-w-xl mx-auto">
					<h1 className="text-heading-2 mb-6">Invite Friends & Earn Rewards</h1>
					<p className="mb-4 text-lg text-white/80">
						Share your unique referral code below. When friends join and make
						their first sale, you both earn rewards!
					</p>
					<div className="mb-6 flex items-center gap-3">
						<span className="label">Your Referral Code:</span>
						<span className="font-mono bg-black/20 px-3 py-1 rounded text-lg select-all">
							{user?.affiliateCode || "N/A"}
						</span>
						<button
							className="btn-outline btn-xs"
							onClick={() =>
								navigator.clipboard.writeText(user?.affiliateCode || "")
							}
							title="Copy referral code"
						>
							Copy
						</button>
					</div>
					<ul className="space-y-2 text-white/70 text-base">
						<li>• Send your code to friends and family</li>
						<li>• They enter it when signing up</li>
						<li>• You both unlock exclusive rewards after their first sale</li>
					</ul>
				</div>
			</main>
		</>
	);
}
