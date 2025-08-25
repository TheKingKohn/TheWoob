import { useState, useRef } from "react";

interface VideoUploadProps {
	onVideoUpload: (videoUrl: string) => void;
	currentVideo?: string;
	disabled?: boolean;
}

export function VideoUpload({
	onVideoUpload,
	currentVideo,
	disabled = false,
}: VideoUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("video/")) {
			alert("Please select a video file");
			return;
		}

		// Validate file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			alert("Video file must be less than 50MB");
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("type", "video");

			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener("progress", (e) => {
				if (e.lengthComputable) {
					const progress = (e.loaded / e.total) * 100;
					setUploadProgress(progress);
				}
			});

			xhr.onload = () => {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					onVideoUpload(response.url);
				} else {
					alert("Failed to upload video");
				}
				setIsUploading(false);
				setUploadProgress(0);
			};

			xhr.onerror = () => {
				alert("Failed to upload video");
				setIsUploading(false);
				setUploadProgress(0);
			};

			xhr.open("POST", "/api/upload");
			xhr.send(formData);
		} catch (error) {
			console.error("Upload error:", error);
			alert("Failed to upload video");
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const handleRemoveVideo = () => {
		onVideoUpload("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="space-y-4">
			<label className="label">Product Video (Optional)</label>

			{currentVideo ? (
				<div className="space-y-3">
					<div className="relative bg-black rounded-lg overflow-hidden">
						<video
							src={currentVideo}
							controls
							className="w-full h-48 object-cover"
							preload="metadata"
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={disabled || isUploading}
							className="btn-outline btn-small"
						>
							Replace Video
						</button>
						<button
							type="button"
							onClick={handleRemoveVideo}
							disabled={disabled || isUploading}
							className="btn-outline btn-small text-red-400 hover:text-red-300"
						>
							Remove Video
						</button>
					</div>
				</div>
			) : (
				<div>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled || isUploading}
						className="w-full border-2 border-dashed border-white/20 rounded-lg p-8 
                       hover:border-white/30 transition-colors flex flex-col items-center gap-3
                       disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploading ? (
							<>
								<div className="w-8 h-8 border-2 border-woob-accent border-t-transparent rounded-full animate-spin"></div>
								<div className="text-sm text-white/70">
									Uploading... {Math.round(uploadProgress)}%
								</div>
								<div className="w-full max-w-xs bg-white/20 rounded-full h-2">
									<div className="bg-woob-accent h-2 rounded-full transition-all duration-300 upload-progress" />
								</div>
							</>
						) : (
							<>
								<svg
									className="w-8 h-8 text-white/40"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<div className="text-center">
									<div className="font-medium text-white/80">
										Upload a product video
									</div>
									<div className="text-sm text-white/60 mt-1">
										MP4, MOV, or AVI up to 50MB
									</div>
								</div>
							</>
						)}
					</button>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept="video/*"
				onChange={handleFileSelect}
				className="hidden"
				disabled={disabled || isUploading}
				aria-label="Upload video file"
				title="Upload video file"
			/>

			<p className="text-xs text-white/60">
				Adding a video can help buyers better understand your item. Keep it
				short and focused on the product.
			</p>
		</div>
	);
}
