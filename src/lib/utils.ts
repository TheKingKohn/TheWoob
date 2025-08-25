export const currency = (cents: number): string => {
	return `$${(cents / 100).toFixed(2)}`;
};

// Server-side only - used in API routes
export const FEE_PERCENT = Number(process.env.FEE_PERCENT ?? 0.1);

export const formatDate = (date: string | Date): string => {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(date));
};

export const categories = [
	"Electronics",
	"Furniture",
	"Clothing",
	"Books",
	"Sports",
	"Tools",
	"Home & Garden",
	"Automotive",
	"General",
] as const;

export type Category = (typeof categories)[number];
