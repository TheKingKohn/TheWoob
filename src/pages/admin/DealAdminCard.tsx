import { useState } from "react";
import { toast } from "../../components/Toast";

export default function DealAdminCard({ deal, onUpdate, onDelete }: any) {
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState({ ...deal });
	const [loading, setLoading] = useState(false);
	if (!deal) {
		return <div className="card p-6">No deal data available.</div>;
	}

	async function saveEdit(e: any) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch(`/api/admin/deals/${deal.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			const data = await res.json();
			toast.success("Deal updated", "Changes saved");
			onUpdate(data.deal);
			setEditing(false);
		} else {
			const error = await res.json();
			toast.error("Update failed", error.error || "Please try again");
		}
		setLoading(false);
	}

	async function deleteDeal() {
		if (!confirm("Delete this deal?")) return;
		setLoading(true);
		const res = await fetch(`/api/admin/deals/${deal.id}`, {
			method: "DELETE",
		});
		if (res.ok || res.status === 204) {
			toast.success("Deal deleted", "Deal removed");
			onDelete();
		} else {
			const error = await res.json();
			toast.error("Delete failed", error.error || "Please try again");
		}
		setLoading(false);
	}

	if (editing) {
		return (
			<form className="card p-6 space-y-2" onSubmit={saveEdit}>
				<input
					className="input"
					value={form.title}
					onChange={(e) =>
						setForm((f: typeof form) => ({ ...f, title: e.target.value }))
					}
					placeholder="Title"
					required
				/>
				<input
					className="input"
					value={form.businessName}
					onChange={(e) =>
						setForm((f: typeof form) => ({
							...f,
							businessName: e.target.value,
						}))
					}
					placeholder="Business Name"
					required
				/>
				<input
					className="input"
					value={form.discountDetails}
					onChange={(e) =>
						setForm((f: typeof form) => ({
							...f,
							discountDetails: e.target.value,
						}))
					}
					placeholder="Discount Details"
				/>
				<textarea
					className="input"
					value={form.description}
					onChange={(e) =>
						setForm((f: typeof form) => ({ ...f, description: e.target.value }))
					}
					rows={2}
					placeholder="Description"
				/>
				<input
					className="input"
					type="date"
					value={form.validFrom ? form.validFrom.slice(0, 10) : ""}
					onChange={(e) =>
						setForm((f: typeof form) => ({ ...f, validFrom: e.target.value }))
					}
					placeholder="Valid From"
				/>
				<input
					className="input"
					type="date"
					value={form.validTo ? form.validTo.slice(0, 10) : ""}
					onChange={(e) =>
						setForm((f: typeof form) => ({ ...f, validTo: e.target.value }))
					}
					placeholder="Valid To"
				/>
				<input
					className="input"
					value={form.imageUrl}
					onChange={(e) =>
						setForm((f: typeof form) => ({ ...f, imageUrl: e.target.value }))
					}
					placeholder="Image URL"
				/>
				<div className="flex gap-2 mt-2">
					<button className="btn" type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</button>
					<button
						className="btn-outline"
						type="button"
						onClick={() => setEditing(false)}
						disabled={loading}
					>
						Cancel
					</button>
				</div>
			</form>
		);
	}
	return (
		<div className="card p-6">
			{deal.imageUrl && (
				<Image
					src={deal.imageUrl}
					alt={deal.title}
					width={320}
					height={128}
					className="mb-2 rounded-lg w-full h-32 object-cover"
				/>
			)}
			<h3 className="font-semibold text-lg mb-1">{deal.title}</h3>
			<div className="text-blue-400 font-bold mb-1">{deal.businessName}</div>
			<div className="mb-2">{deal.discountDetails}</div>
			<div className="text-sm text-white/60 mb-2">{deal.description}</div>
			{deal.validFrom && deal.validTo && (
				<div className="text-xs text-white/40">
					Valid: {new Date(deal.validFrom).toLocaleDateString()} -{" "}
					{new Date(deal.validTo).toLocaleDateString()}
				</div>
			)}
			<div className="flex gap-2 mt-2">
				<button
					className="btn-outline"
					type="button"
					onClick={() => setEditing(true)}
					disabled={loading}
				>
					Edit
				</button>
				<button
					className="btn-outline text-red-400"
					type="button"
					onClick={deleteDeal}
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</div>
	);
}
