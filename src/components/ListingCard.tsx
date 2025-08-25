import Link from "next/link";
import Image from "next/image";
import { currency, formatDate } from "../lib/utils";

interface Listing {
	id: string;
	title: string;
	priceCents: number;
	images?: string;
	videoUrl?: string;
	category?: string;
	createdAt: string;
	status: string;
	seller?: {
		id: string;
		name?: string;
		verifiedSeller?: boolean;
	};
}

export default function ListingCard({
	l,
	square = false,
}: {
	l: Listing;
	square?: boolean;
}) {
	// Parse images from JSON string
	const imageUrls: string[] = l.images ? JSON.parse(l.images) : [];
	const firstImage = imageUrls[0];
	const hasVideo = l.videoUrl;

	return (
		<Link href={`/listings/${l.id}`} className="block">
			<div
				className={`card card-hover group overflow-hidden ${square ? "" : "rounded-xl"} shadow-md transition-all duration-200`}
			>
				{/* Verified Seller badge */}
				{l.seller?.verifiedSeller && (
					<div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full border border-green-800 shadow">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
						Verified Seller
					</div>
				)}
				{hasVideo ? (
					<div className="relative w-full h-40 sm:h-48">
						<video
							src={l.videoUrl}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
							muted
							playsInline
							onMouseEnter={(e) => e.currentTarget.play()}
							onMouseLeave={(e) => {
								e.currentTarget.pause();
								e.currentTarget.currentTime = 0;
							}}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

						{/* Video indicator */}
						<div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full border border-white/20">
							🎬 Video
						</div>

						{/* Category badge */}
						{l.category && (
							<div className="absolute top-3 left-3 badge badge-info">
								{l.category}
							</div>
						)}
					</div>
				) : firstImage ? (
					<div
						className={`relative w-full h-40 sm:h-48 ${square ? "" : "rounded-xl"}`}
					>
						<Image
							src={firstImage}
							alt={l.title}
							fill
							className={`object-cover group-hover:scale-105 transition-transform duration-300 ${square ? "" : "rounded-xl"}`}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = "none";
							}}
						/>
						{/* Enhanced image overlay */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

						{/* Show image count if multiple images */}
						{imageUrls.length > 1 && (
							<div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full border border-white/20">
								📷 {imageUrls.length}
							</div>
						)}

						{/* Category badge */}
						{l.category && (
							<div className="absolute top-3 left-3 badge badge-info">
								{l.category}
							</div>
						)}
					</div>
				) : (
					<div className="w-full h-40 sm:h-48 bg-gradient-to-br from-woob-accent/20 to-woob-accent2/20 flex items-center justify-center relative">
						<div className="text-white/40 text-center">
							<div className="text-4xl mb-2">📷</div>
							<div className="text-sm">No Image</div>
						</div>
						{l.category && (
							<div className="absolute top-3 left-3 badge badge-info">
								{l.category}
							</div>
						)}
					</div>
				)}

				<div className="p-4 sm:p-5">
					<div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-woob-accent transition-colors duration-200">
								{l.title}
							</h3>
							<p className="text-white/60 text-xs sm:text-sm mt-1">
								Listed {formatDate(l.createdAt)}
							</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
						<div className="price-large text-base sm:text-lg">
							{currency(l.priceCents)}
						</div>
						<div className="btn-small w-full sm:w-auto group-hover:bg-purple-500 transition-colors duration-200 text-center">
							View Details
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
