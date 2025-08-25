import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { generateToken, sendPasswordResetEmail } from "../../../lib/auth";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email required" });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Don't reveal if user exists or not for security
			return res.status(200).json({
				message:
					"If an account with that email exists, a password reset link has been sent.",
			});
		}

		const resetToken = generateToken();
		const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

		await prisma.user.update({
			where: { id: user.id },
			data: {
				resetToken,
				resetTokenExpiry,
			} as any,
		});

		await sendPasswordResetEmail(user.email, resetToken);

		res.status(200).json({
			message:
				"If an account with that email exists, a password reset link has been sent.",
			email: user.email,
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({ error: "Failed to process password reset request" });
	}
}
