import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
	images: string[];
	title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
	const [selectedImage, setSelectedImage] = useState(0);
	const [showLightbox, setShowLightbox] = useState(false);

	if (!images || images.length === 0) {
		return (
			<div className="w-full h-80 bg-gradient-to-br from-woob-accent/20 to-woob-accent2/20 flex items-center justify-center rounded-lg">
				<div className="text-center">
					<div className="text-6xl mb-4">📦</div>
					<div className="text-white/40">No images available</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{/* Main Image */}
				<div
					className="relative w-full h-80 rounded-lg overflow-hidden cursor-pointer group"
					onClick={() => setShowLightbox(true)}
				>
					<Image
						src={images[selectedImage]}
						alt={title}
						fill
						className="object-cover transition-transform group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
						<div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1 rounded">
							🔍 Click to enlarge
						</div>
					</div>
					{images.length > 1 && (
						<div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
							{selectedImage + 1} / {images.length}
						</div>
					)}
				</div>

				{/* Thumbnail Strip */}
				{images.length > 1 && (
					<div className="flex gap-2 overflow-x-auto pb-2">
						{images.map((image, index) => (
							<button
								key={index}
								onClick={() => setSelectedImage(index)}
								aria-label={`View image ${index + 1} of ${images.length}`}
								className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
									selectedImage === index
										? "border-woob-accent shadow-lg"
										: "border-white/20 hover:border-white/40"
								}`}
							>
								<Image
									src={image}
									alt={`${title} ${index + 1}`}
									fill
									className="object-cover"
								/>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Lightbox */}
			{showLightbox && (
				<div
					className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
					onClick={() => setShowLightbox(false)}
				>
					<div className="relative max-w-4xl max-h-full">
						<Image
							src={images[selectedImage]}
							alt={title}
							width={800}
							height={600}
							className="max-w-full max-h-full object-contain rounded-lg"
						/>
						<button
							onClick={() => setShowLightbox(false)}
							aria-label="Close image viewer"
							className="absolute top-4 right-4 bg-black/60 text-white w-10 h-10 rounded-full hover:bg-black/80 transition-colors"
						>
							✕
						</button>
						{images.length > 1 && (
							<>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setSelectedImage((prev) =>
											prev > 0 ? prev - 1 : images.length - 1,
										);
									}}
									aria-label="Previous image"
									className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white w-12 h-12 rounded-full hover:bg-black/80 transition-colors"
								>
									‹
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setSelectedImage((prev) =>
											prev < images.length - 1 ? prev + 1 : 0,
										);
									}}
									aria-label="Next image"
									className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white w-12 h-12 rounded-full hover:bg-black/80 transition-colors"
								>
									›
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</>
	);
}
