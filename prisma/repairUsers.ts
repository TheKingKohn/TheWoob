import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Set default values for missing fields in User table
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: user.bio || "",
        image: user.image || null,
        name: user.name || user.email.split("@")[0],
        affiliateCode: user.affiliateCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
        invitedById: user.invitedById || null,
        emailVerified: typeof user.emailVerified === "boolean" ? user.emailVerified : false,
        role: user.role || "user",
        stripeAccountId: user.stripeAccountId || null,
        verifiedSeller: typeof user.verifiedSeller === "boolean" ? user.verifiedSeller : false,
      },
    });
    console.log(`Repaired user: ${user.email}`);
  }
  console.log("All users repaired.");
}

main().finally(() => prisma.$disconnect());
