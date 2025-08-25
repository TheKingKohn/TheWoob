import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { generateToken, sendVerificationEmail } from "../../../lib/auth";

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
		const user = (await prisma.user.findUnique({
			where: { email },
		})) as any;

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user.emailVerified) {
			return res.status(400).json({ error: "Email already verified" });
		}

		const verificationToken = generateToken();

		await prisma.user.update({
			where: { id: user.id },
			data: { verificationToken } as any,
		});

		// Send verification email (implement this based on your email service)
		await sendVerificationEmail(user.email, verificationToken);

		res.status(200).json({
			message: "Verification email sent",
			email: user.email,
		});
	} catch (error) {
		console.error("Resend verification error:", error);
		res.status(500).json({ error: "Failed to send verification email" });
	}
}
