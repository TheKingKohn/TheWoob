interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	color?: string;
	text?: string;
}

export default function LoadingSpinner({
	size = "md",
	color = "text-woob-accent",
	text,
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-6 h-6",
		lg: "w-8 h-8",
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<div className={`${sizeClasses[size]} ${color} animate-spin`}>
				<svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			</div>
			{text && <p className="text-white/70 text-sm animate-pulse">{text}</p>}
		</div>
	);
}

// Enhanced Loading States
export function PageLoader({ text = "Loading..." }: { text?: string }) {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<LoadingSpinner size="lg" text={text} />
			</div>
		</div>
	);
}

export function ContentLoader({
	text = "Loading content...",
}: {
	text?: string;
}) {
	return (
		<div className="flex items-center justify-center py-12">
			<LoadingSpinner text={text} />
		</div>
	);
}

// Button Loader (inline)
export function ButtonLoader() {
	return (
		<svg
			className="animate-spin w-4 h-4 text-white"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			/>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
	);
}

// Enhanced Loading Components
export function ListingCardSkeleton() {
	return (
		<div className="card overflow-hidden">
			<div className="skeleton w-full h-48"></div>
			<div className="p-5 space-y-3">
				<div className="skeleton h-6 w-3/4"></div>
				<div className="skeleton h-4 w-1/2"></div>
				<div className="flex justify-between items-center">
					<div className="skeleton h-8 w-24"></div>
					<div className="skeleton h-8 w-20"></div>
				</div>
			</div>
		</div>
	);
}

export function PageSkeleton() {
	return (
		<div className="woob-container py-8 space-y-6">
			<div className="skeleton h-10 w-64"></div>
			<div className="skeleton h-6 w-96"></div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{Array.from({ length: 8 }).map((_, i) => (
					<ListingCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

export function DashboardSkeleton() {
	return (
		<div className="woob-container py-8 space-y-8">
			<div className="panel p-8">
				<div className="skeleton h-8 w-64 mb-4"></div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="card p-6">
							<div className="skeleton h-12 w-12 rounded-full mx-auto mb-4"></div>
							<div className="skeleton h-4 w-20 mx-auto mb-2"></div>
							<div className="skeleton h-8 w-16 mx-auto"></div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Full page loading overlay
export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
			<div className="bg-woob-dark border border-white/20 rounded-lg p-8 text-center">
				<LoadingSpinner size="lg" text={text} />
			</div>
		</div>
	);
}
