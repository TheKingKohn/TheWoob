import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Security check - only allow this in development
	if (process.env.NODE_ENV === "production") {
		return res.status(403).json({ error: "Not available in production" });
	}

	const { email, password = "TheWoobAdmin2025!" } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	try {
		// Check if user exists
		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			// Update existing user to admin
			const updatedUser = await prisma.user.update({
				where: { email },
				data: { role: "admin" },
			});
			return res.status(200).json({
				message: "User promoted to admin",
				user: { email: updatedUser.email, role: updatedUser.role },
			});
		}

		// Create new admin user
		const hashedPassword = await bcrypt.hash(password, 12);
		const adminUser = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name: "Platform Administrator",
				role: "admin",
				emailVerified: true,
			} as any,
		});

		res.status(201).json({
			message: "Admin account created successfully",
			user: { email: adminUser.email, role: adminUser.role },
			credentials: { email, password },
		});
	} catch (error) {
		console.error("Setup admin error:", error);
		res.status(500).json({ error: "Failed to setup admin account" });
	}
}
