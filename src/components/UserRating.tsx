import { useState, useEffect } from "react";
import Link from "next/link";
import {
	UserRating,
	formatRating,
	getRatingStars,
	getRatingColor,
} from "../lib/reviews";

interface UserRatingDisplayProps {
	userId: string;
	userName?: string;
	size?: "small" | "medium" | "large";
	showText?: boolean;
	clickable?: boolean;
}

export default function UserRatingDisplay({
	userId,
	userName,
	size = "medium",
	showText = true,
	clickable = true,
}: UserRatingDisplayProps) {
	const [rating, setRating] = useState<UserRating | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchRating();
	}, [userId]);

	async function fetchRating() {
		try {
			const response = await fetch(`/api/rating/${userId}`);
			if (response.ok) {
				const data = await response.json();
				setRating(data);
			}
		} catch (error) {
			console.error("Failed to fetch rating:", error);
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div
				className={`flex items-center gap-1 ${size === "small" ? "text-xs" : size === "large" ? "text-lg" : "text-sm"}`}
			>
				<div className="animate-pulse bg-white/20 rounded w-12 h-4"></div>
			</div>
		);
	}

	if (!rating || rating.totalReviews === 0) {
		return (
			<div
				className={`flex items-center gap-1 text-white/50 ${size === "small" ? "text-xs" : size === "large" ? "text-lg" : "text-sm"}`}
			>
				<span>☆☆☆☆☆</span>
				{showText && <span>No reviews</span>}
			</div>
		);
	}

	const content = (
		<div
			className={`flex items-center gap-1 ${size === "small" ? "text-xs" : size === "large" ? "text-lg" : "text-sm"}`}
		>
			<span className={`${getRatingColor(rating.averageRating)} font-semibold`}>
				{getRatingStars(rating.averageRating)}
			</span>
			<span
				className={`ml-1 text-white/60 ${size === "small" ? "text-[10px]" : "text-xs"}`}
			>
				({rating.totalReviews})
			</span>
			{showText && (
				<span className="text-white/80">
					{formatRating(rating.averageRating)}
					{` (${rating.totalReviews} review${rating.totalReviews !== 1 ? "s" : ""})`}
				</span>
			)}
		</div>
	);

	if (clickable) {
		return (
			<Link
				href={`/user/${userId}/reviews`}
				className="hover:opacity-80 transition-opacity"
				title={`View reviews for ${userName || "this user"}`}
			>
				{content}
			</Link>
		);
	}

	return content;
}

interface StarRatingInputProps {
	value: number;
	onChange: (rating: number) => void;
	size?: "small" | "medium" | "large";
	readonly?: boolean;
}

export function StarRatingInput({
	value,
	onChange,
	size = "medium",
	readonly = false,
}: StarRatingInputProps) {
	const [hoverRating, setHoverRating] = useState(0);

	const sizeClasses = {
		small: "text-lg",
		medium: "text-2xl",
		large: "text-3xl",
	};

	return (
		<div className={`flex gap-1 ${sizeClasses[size]}`}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					disabled={readonly}
					className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
						star <= (hoverRating || value) ? "text-yellow-400" : "text-white/20"
					}`}
					onClick={() => !readonly && onChange(star)}
					onMouseEnter={() => !readonly && setHoverRating(star)}
					onMouseLeave={() => !readonly && setHoverRating(0)}
					title={`${star} star${star !== 1 ? "s" : ""}`}
				>
					★
				</button>
			))}
		</div>
	);
}

interface RatingBreakdownProps {
	breakdown: { [key: number]: number };
	totalReviews: number;
}

export function RatingBreakdown({
	breakdown,
	totalReviews,
}: RatingBreakdownProps) {
	return (
		<div className="space-y-2">
			{[5, 4, 3, 2, 1].map((star) => {
				const count = breakdown[star] || 0;
				const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

				return (
					<div key={star} className="flex items-center gap-3 text-sm">
						<span className="w-6 text-right">{star}★</span>
						<div className="flex-1 bg-white/10 rounded-full h-2 relative overflow-hidden">
							<div
								className="bg-yellow-400 h-2 rounded-full transition-all duration-300 absolute left-0 top-0"
								style={
									{
										width: `${Math.min(percentage, 100)}%`,
									} as React.CSSProperties
								}
							></div>
						</div>
						<span className="w-8 text-white/60 text-xs">{count}</span>
					</div>
				);
			})}
		</div>
	);
}
