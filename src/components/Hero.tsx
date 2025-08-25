import Link from "next/link";

export default function Hero() {
	return (
		<section className="woob-container py-10 sm:py-16 md:py-20 px-2 sm:px-0">
			<div className="panel p-4 sm:p-8 md:p-16 relative overflow-hidden">
				{/* Enhanced background effects */}
				<div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-woob-accent/20 blur-3xl animate-pulse-glow" />
				<div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-woob-accent2/15 blur-3xl" />

				<div className="relative z-10">
					<h1 className="text-3xl sm:text-heading-1 mb-4 sm:mb-6 text-center">
						The Exclusive Local Club,
						<span className="text-woob-accent"> Members Only.</span>
					</h1>
					<p className="text-base sm:text-body-large text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto text-center">
						TheWoob is a network/marketplace for trusted local
						members—invite-only access, verified sellers, private transactions.
						No ads or pollution. Welcome to the club.
					</p>

					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 w-full items-center justify-center">
						<Link
							className="btn text-base sm:text-lg px-6 sm:px-8 py-4 w-full sm:w-auto"
							href="/sell/new"
						>
							✨ List Premium Item
						</Link>
						<Link
							className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-4 w-full sm:w-auto"
							href="/browse"
						>
							🛍️ Browse All Collections
						</Link>
						<Link
							className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-4 w-full sm:w-auto"
							href="/affiliate"
						>
							🤝 Recruit Friends
						</Link>
						<Link
							className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-4 w-full sm:w-auto"
							href="/sell/new"
						>
							💸 Earn Cash Today
						</Link>
						<Link
							className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-4 w-full sm:w-auto"
							href="/about"
						>
							📖 How It Works
						</Link>
					</div>

					{/* Stats or benefits */}
					{/* Removed placeholder and cleaned up section */}
				</div>
			</div>
		</section>
	);
}
