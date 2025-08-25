import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
	const seller = await prisma.user.upsert({
		where: { email: "seller@thewoob.app" },
		update: {},
		create: { email: "seller@thewoob.app", name: "Woob Seller" },
	});
	await prisma.listing.createMany({
		data: [
			{
				title: "PS5 with Controller",
				description: "Clean, barely used.",
				priceCents: 35000,
				images: JSON.stringify([
					"https://images.unsplash.com/photo-1606813907291-76f6f9e80b1b",
				]),
				sellerId: seller.id,
				category: "Electronics",
			},
			{
				title: "Cordless Drill Kit",
				description: "Includes battery + charger",
				priceCents: 7500,
				images: JSON.stringify([
					"https://images.unsplash.com/photo-1566423894473-5f34b73e31f2",
				]),
				sellerId: seller.id,
				category: "Tools",
			},
			{
				title: "Kitchen Table + 4 Chairs",
				description: "Solid wood",
				priceCents: 12000,
				images: JSON.stringify([
					"https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
				]),
				sellerId: seller.id,
				category: "Furniture",
			},
		],
	});
	console.log("Seeded: demo seller + listings");
}
main().finally(() => prisma.$disconnect());
