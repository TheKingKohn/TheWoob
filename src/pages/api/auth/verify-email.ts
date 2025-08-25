import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { generateToken } from "../../../lib/auth";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { token } = req.body;

	if (!token) {
		return res.status(400).json({ error: "Verification token required" });
	}

	try {
		const user = await prisma.user.findFirst({
			where: { verificationToken: token } as any,
		});

		if (!user) {
			return res.status(400).json({ error: "Invalid verification token" });
		}

		await prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerified: true,
				verificationToken: null,
			} as any,
		});

		res.status(200).json({
			message: "Email verified successfully",
			user: {
				id: user.id,
				email: user.email,
				emailVerified: true,
			},
		});
	} catch (error) {
		console.error("Email verification error:", error);
		res.status(500).json({ error: "Failed to verify email" });
	}
}
