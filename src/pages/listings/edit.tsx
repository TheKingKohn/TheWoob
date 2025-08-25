import { useState, useEffect } from "react";
import Router, { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { prisma } from "../../lib/prisma";
import Nav from "../../components/Nav";
import { VideoUpload } from "../../components/VideoUpload";
import { toast } from "../../components/Toast";
import Image from "next/image";

import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({
	req,
	res,
	query,
}) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;
	let id = query.id;
	if (!user) return { redirect: { destination: "/signin", permanent: false } };
	if (!id) return { notFound: true };
	if (Array.isArray(id)) id = id[0];
	if (typeof id !== "string" || !id) return { notFound: true };
	const listing = await prisma.listing.findUnique({ where: { id } });
	if (!listing || (listing.sellerId !== user.id && user.role !== "admin"))
		return { notFound: true };
	return { props: { listing: JSON.parse(JSON.stringify(listing)), user } };
};

interface EditListingProps {
	listing: any;
	user: any;
}

export default function EditListing({ listing, user }: EditListingProps) {
	const isOwner = user && user.id === listing.sellerId;
	const isAdmin = user && user.role === "admin";

	async function handleDelete() {
		if (!window.confirm("Delete this listing? This cannot be undone.")) return;
		setLoading(true);
		let res;
		if (isAdmin) {
			res = await fetch(`/api/admin/listings/${listing.id}?hard=1`, {
				method: "DELETE",
			});
		} else {
			res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
		}
		if (res.status === 204) {
			toast.success("Listing deleted!", "Moved to Deleted tab.");
			router.push("/dashboard");
		} else {
			toast.error("Delete failed", "Could not delete listing.");
		}
		setLoading(false);
	}
	const [title, setTitle] = useState(listing.title);
	const [price, setPrice] = useState((listing.priceCents / 100).toString());
	const [description, setDescription] = useState(listing.description || "");
	const [category, setCategory] = useState(listing.category || "General");
	const [images, setImages] = useState(
		listing.images ? JSON.parse(listing.images) : [],
	);
	const [uploadingImage, setUploadingImage] = useState(false);

	async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingImage(true);
		const formData = new FormData();
		formData.append("file", file);
		const res = await fetch("/api/upload-listing-image", {
			method: "POST",
			body: formData,
		});
		if (res.ok) {
			const data = await res.json();
			setImages((prev) => [...prev, data.image]);
		} else {
			toast.error("Image upload failed", "Could not upload image.");
		}
		setUploadingImage(false);
	}
	const [videoUrl, setVideoUrl] = useState(listing.videoUrl || "");
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		const priceCents = Math.round(parseFloat(price) * 100);
		const body = {
			title,
			priceCents,
			description,
			category,
			images: JSON.stringify(images),
			videoUrl,
		};
		let res;
		if (isAdmin) {
			res = await fetch(`/api/admin/listings/${listing.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
		} else {
			res = await fetch(`/api/listings/${listing.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
		}
		if (res.ok) {
			toast.success("Listing updated!", "Changes saved");
			router.push(`/listings/${listing.id}`);
		} else {
			toast.error("Update failed", "Could not update listing.");
		}
		setLoading(false);
	}

	return (
		<>
			<Nav user={user} authed={!!user} />
			<main className="p-4 max-w-2xl mx-auto">
				<h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<label className="label" htmlFor="edit-title">
							Title
						</label>
						<input
							id="edit-title"
							className="input w-full"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							placeholder="Listing title"
							title="Listing title"
						/>
					</div>
					<div>
						<label className="label" htmlFor="edit-price">
							Price (USD)
						</label>
						<input
							id="edit-price"
							className="input w-full"
							type="number"
							min="0"
							step="0.01"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							required
							placeholder="Price in USD"
							title="Price in USD"
						/>
					</div>
					<div>
						<label className="label" htmlFor="edit-description">
							Description
						</label>
						<textarea
							id="edit-description"
							className="input w-full"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Describe your listing"
							title="Listing description"
						/>
					</div>
					<div>
						<label className="label" htmlFor="edit-category">
							Category
						</label>
						<input
							id="edit-category"
							className="input w-full"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							placeholder="Category"
							title="Listing category"
						/>
					</div>
					<div>
						<label className="label" htmlFor="edit-images">
							Images
						</label>
						<div className="flex gap-2 mb-2 flex-wrap">
							{images.map((img: string, idx: number) => (
								<div key={idx} className="relative">
									<Image
										src={img}
										alt="Listing"
										width={80}
										height={80}
										className="w-20 h-20 object-cover rounded-lg border"
									/>
									<button
										type="button"
										className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
										onClick={() =>
											setImages(images.filter((_, i) => i !== idx))
										}
										title="Remove image"
									>
										×
									</button>
								</div>
							))}
						</div>
						<input
							id="edit-images"
							type="file"
							accept="image/*"
							className="input"
							onChange={handleImageUpload}
							disabled={uploadingImage}
						/>
						<div className="mt-2">
							<input
								className="input w-full"
								type="text"
								value={images.join(", ")}
								onChange={(e) => setImages(e.target.value.split(/,\s*/))}
								placeholder="Or paste image URLs, comma separated"
								title="Listing images"
							/>
						</div>
					</div>
					<button className="btn" type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save Changes"}
					</button>
					{(isOwner || isAdmin) && (
						<button
							type="button"
							className="btn-outline text-red-400 ml-3"
							onClick={handleDelete}
							disabled={loading}
						>
							{loading ? "Deleting..." : "Delete Listing"}
						</button>
					)}
				</form>
			</main>
		</>
	);
}
// ...existing code...
