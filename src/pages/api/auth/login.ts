import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";
import {
	validatePassword,
	hashPassword,
	generateToken,
	sendVerificationEmail,
	isAccountLocked,
	recordFailedLogin,
	resetLoginAttempts,
	createSessionUser,
} from "../../../lib/auth";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	if (req.method !== "POST") return res.status(405).end();

	const { email, name, password } = req.body ?? {};
	const { affiliateCode: inviteCode } = req.body ?? {};
	if (!email) return res.status(400).json({ error: "email required" });

	try {
		let user = (await prisma.user.findUnique({ where: { email } })) as any;

		// Handle new user registration (backwards compatible)
		if (!user) {
			const hashedPassword = password ? await hashPassword(password) : null;
			const verificationToken = password ? generateToken() : null;

			// Generate affiliate code (6-char uppercase alphanumeric)
			function genAffiliateCode() {
				const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
				let code = "";
				for (let i = 0; i < 6; i++) {
					code += chars.charAt(Math.floor(Math.random() * chars.length));
				}
				return code;
			}
			let affiliateCode;
			let tries = 0;
			do {
				affiliateCode = genAffiliateCode();
				// Ensure uniqueness
				tries++;
			} while (
				(await prisma.user.findFirst({ where: { affiliateCode } })) &&
				tries < 5
			);

			// If invite code provided, look up inviter
			let invitedById = null;
			if (inviteCode) {
				const inviter = await prisma.user.findFirst({
					where: { affiliateCode: inviteCode },
				});
				if (inviter) invitedById = inviter.id;
			}

			user = await prisma.user.create({
				data: {
					email,
					name: name || null,
					password: hashedPassword,
					emailVerified: !password, // Auto-verify for passwordless
					verificationToken,
					affiliateCode,
					invitedById,
				} as any,
			});

			// Send verification email if password-based registration
			if (password && verificationToken) {
				await sendVerificationEmail(user.email, verificationToken);
				return res.status(201).json({
					message:
						"Account created! Please check your email to verify your account.",
					requiresVerification: true,
				});
			}
		} else {
			// Existing user login

			// Check if account is locked
			if (await isAccountLocked(user.id)) {
				return res.status(423).json({
					error: "Account temporarily locked. Please try again later.",
				});
			}

			// Password validation for users with passwords
			if (user.password && password) {
				const isValidPassword = await validatePassword(password, user.password);
				if (!isValidPassword) {
					await recordFailedLogin(user.id);
					return res.status(401).json({ error: "Invalid credentials" });
				}
			} else if (user.password && !password) {
				return res.status(400).json({ error: "Password required" });
			} else if (!user.password && password) {
				// Add password to passwordless account
				const hashedPassword = await hashPassword(password);
				await prisma.user.update({
					where: { id: user.id },
					data: { password: hashedPassword } as any,
				});
			}

			// Update name if provided
			if (name && name !== user.name) {
				user = await prisma.user.update({
					where: { id: user.id },
					data: { name } as any,
				});
			}
		}

		// Reset failed attempts and create session
		await resetLoginAttempts(user.id);
		await createSessionUser(session, user);

		res.status(200).json({ ok: true });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Authentication failed" });
	}
}
