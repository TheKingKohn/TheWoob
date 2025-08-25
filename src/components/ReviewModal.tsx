import { useState } from "react";
import { StarRatingInput } from "./UserRating";
import { ButtonLoader } from "./Loading";
import { toast } from "./Toast";

interface ReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	revieweeId: string;
	revieweeName: string;
	orderId?: string;
	listingId?: string;
	listingTitle?: string;
	onReviewSubmitted?: () => void;
}

export default function ReviewModal({
	isOpen,
	onClose,
	revieweeId,
	revieweeName,
	orderId,
	listingId,
	listingTitle,
	onReviewSubmitted,
}: ReviewModalProps) {
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [loading, setLoading] = useState(false);

	if (!isOpen) return null;

	async function handleSubmit(e: any) {
		e.preventDefault();

		if (rating === 0) {
			toast.error("Rating required", "Please select a star rating");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/reviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					revieweeId,
					rating,
					comment: comment.trim() || null,
					orderId,
					listingId,
					type: "user",
				}),
			});

			if (response.ok) {
				toast.success("Review submitted!", "Thank you for your feedback");
				onReviewSubmitted?.();
				handleClose();
			} else {
				const data = await response.json();
				toast.error("Review failed", data.error);
			}
		} catch (error) {
			toast.error("Connection error", "Please try again");
		} finally {
			setLoading(false);
		}
	}

	function handleClose() {
		setRating(0);
		setComment("");
		onClose();
	}

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
			<div className="panel p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-xl font-semibold">Write a Review</h3>
					<button
						onClick={handleClose}
						className="text-white/60 hover:text-white text-xl"
					>
						×
					</button>
				</div>

				<div className="mb-4">
					<p className="text-white/80 mb-2">
						How was your experience with{" "}
						<span className="font-semibold">{revieweeName}</span>?
					</p>
					{listingTitle && (
						<p className="text-sm text-white/60">
							Regarding: <span className="italic">{listingTitle}</span>
						</p>
					)}
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="label">Rating *</label>
						<div className="flex items-center gap-4">
							<StarRatingInput
								value={rating}
								onChange={setRating}
								size="large"
							/>
							<span className="text-sm text-white/70">
								{rating === 0 && "Select a rating"}
								{rating === 1 && "Poor"}
								{rating === 2 && "Fair"}
								{rating === 3 && "Good"}
								{rating === 4 && "Very Good"}
								{rating === 5 && "Excellent"}
							</span>
						</div>
					</div>

					<div>
						<label className="label">Comment (optional)</label>
						<textarea
							className="input resize-none"
							rows={4}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Share your experience (optional)..."
							maxLength={500}
						/>
						<p className="text-xs text-white/50 mt-1">
							{comment.length}/500 characters
						</p>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={handleClose}
							className="btn-outline flex-1"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn flex-1 flex items-center justify-center gap-2"
							disabled={loading || rating === 0}
						>
							{loading ? (
								<>
									<ButtonLoader />
									Submitting...
								</>
							) : (
								"Submit Review"
							)}
						</button>
					</div>
				</form>

				<div className="mt-4 pt-4 border-t border-white/10">
					<p className="text-xs text-white/60 text-center">
						Reviews help build trust in the TheWoob community. Please be honest
						and constructive in your feedback.
					</p>
				</div>
			</div>
		</div>
	);
}

interface ReviewButtonProps {
	revieweeId: string;
	revieweeName: string;
	orderId?: string;
	listingId?: string;
	listingTitle?: string;
	className?: string;
	children?: React.ReactNode;
	onReviewSubmitted?: () => void;
}

export function ReviewButton({
	revieweeId,
	revieweeName,
	orderId,
	listingId,
	listingTitle,
	className = "btn-outline",
	children = "Leave Review",
	onReviewSubmitted,
}: ReviewButtonProps) {
	const [showModal, setShowModal] = useState(false);

	return (
		<>
			<button onClick={() => setShowModal(true)} className={className}>
				{children}
			</button>

			<ReviewModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				revieweeId={revieweeId}
				revieweeName={revieweeName}
				orderId={orderId}
				listingId={listingId}
				listingTitle={listingTitle}
				onReviewSubmitted={onReviewSubmitted}
			/>
		</>
	);
}
