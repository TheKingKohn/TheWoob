import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { token, password } = req.body;

	if (!token || !password) {
		return res.status(400).json({ error: "Token and password required" });
	}

	if (password.length < 8) {
		return res
			.status(400)
			.json({ error: "Password must be at least 8 characters long" });
	}

	try {
		const user = await prisma.user.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: {
					gte: new Date(),
				},
			} as any,
		});

		if (!user) {
			return res.status(400).json({ error: "Invalid or expired reset token" });
		}

		const hashedPassword = await hashPassword(password);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				resetToken: null,
				resetTokenExpiry: null,
				loginAttempts: 0,
				lockedUntil: null,
			} as any,
		});

		res.status(200).json({
			message: "Password reset successfully",
			user: {
				id: user.id,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ error: "Failed to reset password" });
	}
}
