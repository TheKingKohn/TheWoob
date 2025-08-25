import { useState, useEffect } from "react";

export interface Toast {
	id: string;
	type: "success" | "error" | "info" | "warning";
	title: string;
	message?: string;
	duration?: number;
}

let toastCallbacks: ((toast: Toast) => void)[] = [];

export const toast = {
	success: (title: string, message?: string) => {
		const newToast: Toast = {
			id: Date.now().toString(),
			type: "success",
			title,
			message,
			duration: 4000,
		};
		toastCallbacks.forEach((callback) => callback(newToast));
	},
	error: (title: string, message?: string) => {
		const newToast: Toast = {
			id: Date.now().toString(),
			type: "error",
			title,
			message,
			duration: 6000,
		};
		toastCallbacks.forEach((callback) => callback(newToast));
	},
	info: (title: string, message?: string) => {
		const newToast: Toast = {
			id: Date.now().toString(),
			type: "info",
			title,
			message,
			duration: 4000,
		};
		toastCallbacks.forEach((callback) => callback(newToast));
	},
};

export default function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	useEffect(() => {
		const callback = (toast: Toast) => {
			setToasts((prev) => [...prev, toast]);

			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== toast.id));
			}, toast.duration || 4000);
		};

		toastCallbacks.push(callback);

		return () => {
			toastCallbacks = toastCallbacks.filter((cb) => cb !== callback);
		};
	}, []);

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	const getIcon = (type: string) => {
		switch (type) {
			case "success":
				return "✅";
			case "error":
				return "❌";
			case "warning":
				return "⚠️";
			case "info":
				return "ℹ️";
			default:
				return "ℹ️";
		}
	};

	const getColors = (type: string) => {
		switch (type) {
			case "success":
				return "border-green-500 bg-green-500/20";
			case "error":
				return "border-red-500 bg-red-500/20";
			case "warning":
				return "border-yellow-500 bg-yellow-500/20";
			case "info":
				return "border-blue-500 bg-blue-500/20";
			default:
				return "border-gray-500 bg-gray-500/20";
		}
	};

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`
            border rounded-lg p-4 text-white backdrop-blur-sm
            animate-in slide-in-from-right duration-300
            ${getColors(toast.type)}
          `}
				>
					<div className="flex items-start gap-3">
						<span className="text-lg">{getIcon(toast.type)}</span>
						<div className="flex-1 min-w-0">
							<h4 className="font-medium">{toast.title}</h4>
							{toast.message && (
								<p className="text-sm text-white/80 mt-1">{toast.message}</p>
							)}
						</div>
						<button
							onClick={() => removeToast(toast.id)}
							className="text-white/60 hover:text-white transition-colors"
						>
							✕
						</button>
					</div>
				</div>
			))}
		</div>
	);
}
