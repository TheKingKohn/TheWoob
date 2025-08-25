import { useState } from "react";
import Router from "next/router";
import Image from "next/image";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import Nav from "../../components/Nav";
import { ButtonLoader } from "../../components/Loading";
import { VideoUpload } from "../../components/VideoUpload";
import { toast } from "../../components/Toast";
import { categories } from "../../lib/utils";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	if (!(session as any).user)
		return { redirect: { destination: "/signin", permanent: false } };
	return { props: { authed: true } };
};

export default function NewListing() {
	const [title, setTitle] = useState("");
	const [price, setPrice] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("General");
	const [loading, setLoading] = useState(false);
	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const [uploadedVideo, setUploadedVideo] = useState<string>("");
	const [uploading, setUploading] = useState(false);
	const [isDigital, setIsDigital] = useState(false);
	const [digitalFile, setDigitalFile] = useState<File | null>(null);
	const [digitalFileUrl, setDigitalFileUrl] = useState("");
	const [licenseKey, setLicenseKey] = useState("");

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		if (uploadedImages.length + files.length > 5) {
			toast.error(
				"Too many images",
				"You can upload a maximum of 5 images per listing",
			);
			return;
		}

		setUploading(true);
		const formData = new FormData();

		// Add all selected files to FormData
		Array.from(files).forEach((file) => {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File too large", `${file.name} is larger than 5MB`);
				return;
			}
			formData.append("images", file);
		});

		try {
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();
				setUploadedImages((prev) => [...prev, ...result.images]);
				toast.success(
					"Images uploaded",
					`${result.count} image(s) added successfully`,
				);
			} else {
				const error = await response.json();
				toast.error("Upload failed", error.error || "Failed to upload images");
			}
		} catch (err) {
			console.error("Upload error:", err);
			toast.error("Upload failed", "Network error - please try again");
		} finally {
			setUploading(false);
			// Reset the input
			event.target.value = "";
		}
	};

	const removeImage = (index: number) => {
		setUploadedImages((prev) => prev.filter((_, i) => i !== index));
	};

	async function handleDigitalFileUpload(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 50 * 1024 * 1024) {
			toast.error("File too large", "Digital product must be under 50MB");
			return;
		}
		setUploading(true);
		const formData = new FormData();
		formData.append("digitalFile", file);
		try {
			const response = await fetch("/api/upload?type=digital", {
				method: "POST",
				body: formData,
			});
			if (response.ok) {
				const result = await response.json();
				setDigitalFileUrl(result.url);
				setDigitalFile(file);
				toast.success("Digital file uploaded", "Your file is ready for sale");
			} else {
				const error = await response.json();
				toast.error(
					"Upload failed",
					error.error || "Failed to upload digital file",
				);
			}
		} catch (err) {
			console.error("Digital file upload error:", err);
			toast.error("Upload failed", "Network error - please try again");
		} finally {
			setUploading(false);
			event.target.value = "";
		}
	}

	async function submit(e: any) {
		e.preventDefault();
		if (!title.trim() || !price || parseFloat(price) <= 0) {
			toast.error(
				"Missing information",
				"Please fill in all required fields with valid values",
			);
			return;
		}
		if (!isDigital && uploadedImages.length === 0) {
			toast.error("No images", "Please add at least one photo to your listing");
			return;
		}
		if (isDigital && !digitalFileUrl) {
			toast.error("No digital file", "Please upload your digital product file");
			return;
		}
		setLoading(true);
		try {
			const response = await fetch("/api/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					priceCents: Math.round(parseFloat(price) * 100),
					images: isDigital ? null : JSON.stringify(uploadedImages),
					videoUrl: uploadedVideo || null,
					description: description.trim() || null,
					category,
					isDigital,
					digitalFileUrl: isDigital ? digitalFileUrl : null,
					licenseKey: isDigital && licenseKey ? licenseKey : null,
				}),
			});
			if (response.ok) {
				toast.success(
					"Elite listing created!",
					"Your premium item is now available to members",
				);
				setTimeout(() => Router.push("/dashboard"), 1500);
			} else {
				const error = await response.json();
				toast.error(
					"Failed to create listing",
					error.error || "Please try again",
				);
			}
		} catch (err) {
			console.error("Create listing error:", err);
			toast.error(
				"Network error",
				"Please check your connection and try again",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Nav authed={true} />
			<main className="woob-container py-8">
				<div className="panel p-6 max-w-2xl mx-auto">
					<h2 className="text-2xl font-bold">✨ List Premium Item</h2>
					<p className="text-white/70 mt-1">
						Share exclusive items with trusted members
					</p>

					<form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6">
						<div>
							<label className="label flex items-center gap-2">
								<input
									type="checkbox"
									checked={isDigital}
									onChange={(e) => setIsDigital(e.target.checked)}
								/>
								Digital Product
							</label>
							<span className="text-sm text-white/60">
								Check if you are selling a downloadable file or license key
							</span>
						</div>
						<div>
							<label className="label">Title *</label>
							<input
								className="input"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="What are you selling?"
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="label">Price (USD) *</label>
								<input
									className="input"
									type="number"
									step="0.01"
									min="0.01"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									placeholder="0.00"
									required
								/>
							</div>

							<div>
								<label className="label">Category *</label>
								<select
									className="input"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									title="Select a category"
								>
									{categories.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</select>
							</div>
						</div>

						{!isDigital && (
							<div>
								<label className="label">Photos</label>
								<div className="space-y-4">
									{/* Image Upload Area */}
									<div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
										<input
											type="file"
											multiple
											accept="image/*"
											onChange={handleImageUpload}
											className="hidden"
											id="image-upload"
											disabled={uploading}
										/>
										<label
											htmlFor="image-upload"
											className={`cursor-pointer ${uploading ? "opacity-50" : "hover:text-woob-accent"}`}
										>
											<div className="space-y-2">
												<div className="text-4xl">📷</div>
												<div className="font-medium">
													{uploading ? "Uploading..." : "Click to add photos"}
												</div>
												<div className="text-sm text-white/60">
													PNG, JPG, WebP up to 5MB each (max 5 photos)
												</div>
											</div>
										</label>
									</div>
									{/* Uploaded Images Preview */}
									{uploadedImages.length > 0 && (
										<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
											{uploadedImages.map((image, index) => (
												<div key={index} className="relative group">
													<Image
														src={image}
														alt={`Upload ${index + 1}`}
														width={200}
														height={128}
														className="w-full h-32 object-cover rounded-lg"
													/>
													<button
														type="button"
														onClick={() => removeImage(index)}
														aria-label={`Remove image ${index + 1}`}
														className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
													>
														×
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						)}
						{isDigital && (
							<div>
								<label className="label">Digital Product File *</label>
								<input
									type="file"
									accept="application/pdf,application/zip,application/x-zip-compressed,image/*,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
									onChange={handleDigitalFileUpload}
									disabled={uploading}
									title="Upload your digital product file"
									placeholder="Select file to upload"
								/>
								{digitalFileUrl && (
									<div className="mt-2 text-green-400">
										File uploaded: {digitalFile?.name}
									</div>
								)}
								<label className="label mt-4">License Key (optional)</label>
								<input
									className="input"
									type="text"
									value={licenseKey}
									onChange={(e) => setLicenseKey(e.target.value)}
									placeholder="Enter license key or code (if applicable)"
								/>
								<div className="text-sm text-white/60 mt-1">
									Buyers will receive this key after purchase
								</div>
							</div>
						)}

						<VideoUpload
							onVideoUpload={setUploadedVideo}
							currentVideo={uploadedVideo}
							disabled={loading}
						/>

						<div>
							<label className="label">Description</label>
							<textarea
								className="input"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
								placeholder="Describe your item, its condition, any important details..."
							/>
						</div>

						<button
							className="btn flex items-center justify-center gap-2"
							disabled={loading || uploading}
							type="submit"
						>
							{loading ? (
								<>
									<ButtonLoader />
									Creating Listing...
								</>
							) : (
								<>🚀 Publish Listing</>
							)}
						</button>
					</form>
				</div>
			</main>
		</>
	);
}
