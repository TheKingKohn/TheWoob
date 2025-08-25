import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Nav from "../components/Nav";

export default function DealsPage() {
	const [deals, setDeals] = useState([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function fetchDeals() {
			const res = await fetch("/api/deals");
			if (res.status === 401) {
				router.push("/signin");
				return;
			}
			const data = await res.json();
			setDeals(data.deals || []);
			setLoading(false);
		}
		fetchDeals();
	}, [router]);

	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8">
				<h2 className="text-2xl font-bold mb-4 text-blue-400">
					🌟 Local Deals for Members
				</h2>
				{loading ? (
					<div>Loading deals...</div>
				) : deals.length === 0 ? (
					<div>No deals available right now. Check back soon!</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{deals.map((deal: any) => (
							<div
								key={deal.id}
								className="card p-6 shadow-lg rounded-xl bg-gradient-to-br from-blue-900/60 to-purple-900/60 border border-blue-400/20"
							>
								<div className="mb-3">
									<div className="flex items-center gap-2">
										<span className="badge badge-accent text-lg font-bold px-3 py-1 bg-blue-400/80 text-white rounded-full">
											{deal.discountDetails || "Special Offer"}
										</span>
										{deal.validFrom && deal.validTo && (
											<span className="badge bg-purple-400/80 text-white px-2 py-1 rounded-full text-xs">
												Valid: {new Date(deal.validFrom).toLocaleDateString()} -{" "}
												{new Date(deal.validTo).toLocaleDateString()}
											</span>
										)}
									</div>
								</div>
								<div className="mb-3">
									{deal.imageUrl ? (
										<Image
											src={deal.imageUrl}
											alt={deal.title}
											width={320}
											height={160}
											className="rounded-lg w-full h-40 object-cover border border-blue-400/30"
										/>
									) : (
										<div className="w-full h-40 flex items-center justify-center bg-blue-950/40 rounded-lg text-white/40 text-3xl">
											🏪
										</div>
									)}
											<Image
												src={deal.imageUrl}
												alt={deal.title}
												width={320}
												height={160}
												className="rounded-lg w-full h-40 object-cover border border-blue-400/30"
											/>
									{deal.businessName}
								</div>
								<div className="text-sm text-white/70 mb-2">
									{deal.description}
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</>
	);
}
