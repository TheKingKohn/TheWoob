import Nav from "../components/Nav";

export default function About() {
	return (
		<>
			<Nav authed={false} />
			<main className="woob-container py-12">
				<div className="panel p-8 max-w-2xl mx-auto mb-10">
					<h1 className="text-heading-2 mb-6">How It Works</h1>
					<ul className="space-y-4 text-lg">
						<li>
							<strong>1. Join the Club:</strong> Sign up and become a verified
							member.
						</li>
						<li>
							<strong>2. List Premium Items:</strong> Sell exclusive products to
							trusted local buyers.
						</li>
						<li>
							<strong>3. Invite Friends:</strong> Share your referral code and
							grow your network.
						</li>
						<li>
							<strong>4. Earn Rewards:</strong> Get bonuses for successful
							invites and sales.
						</li>
						<li>
							<strong>5. Enjoy Protection:</strong> Safe transactions and seller
							support for all members.
						</li>
					</ul>
				</div>
				<section id="about-us" className="woob-container py-8">
					<div className="panel p-10 max-w-3xl mx-auto bg-gradient-to-br from-woob-accent/20 to-woob-accent2/20 border border-woob-accent/40 rounded-2xl shadow-xl flex flex-col items-center">
						<div className="mb-4 text-5xl">🚫</div>
						<h2 className="text-heading-3 mb-3 text-center font-extrabold tracking-tight text-woob-accent">
							What Makes Us Different
						</h2>
						<div className="mb-6 text-center">
							<span className="inline-block bg-woob-accent/20 text-woob-accent font-semibold px-4 py-2 rounded-lg text-lg shadow">
								No ads. No tracking. No spam. No endless scrolling.
							</span>
						</div>
						<p className="text-base text-white/80 text-center leading-relaxed mb-2">
							TheWoob is built for real people, not algorithms. We’re not here
							to sell your data, push sponsored junk, or flood your feed with
							noise.
						</p>
						<p className="text-base text-white/60 text-center leading-relaxed">
							We’re a local club—invite-only, private, and built on trust. Every
							member is verified, every deal is real, and your privacy actually
							matters.
							<br />
							If you want big tech, you know where to find it. If you want
							something better, welcome to TheWoob.
						</p>
					</div>
				</section>
			</main>
		</>
	);
}
