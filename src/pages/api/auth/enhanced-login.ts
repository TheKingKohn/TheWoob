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

// Rate limiting store (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const attempts = loginAttempts.get(ip);

	if (!attempts) {
		loginAttempts.set(ip, { count: 1, lastAttempt: now });
		return false;
	}

	if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
		loginAttempts.set(ip, { count: 1, lastAttempt: now });
		return false;
	}

	if (attempts.count >= MAX_ATTEMPTS_PER_WINDOW) {
		return true;
	}

	attempts.count++;
	attempts.lastAttempt = now;
	return false;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { email, name, password } = req.body;
	const clientIP =
		req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";

	if (!email) {
		return res.status(400).json({ error: "Email required" });
	}

	// Rate limiting
	if (isRateLimited(clientIP as string)) {
		return res.status(429).json({
			error: "Too many login attempts. Please try again later.",
		});
	}

	try {
		let user = (await prisma.user.findUnique({
			where: { email },
		})) as any;

		// Handle new user registration (backwards compatible)
		if (!user) {
			// If password is provided, hash it; otherwise use passwordless auth
			const hashedPassword = password ? await hashPassword(password) : null;
			const verificationToken = generateToken();

			user = await prisma.user.create({
				data: {
					email,
					name: name || null,
					password: hashedPassword,
					emailVerified: !password, // Auto-verify for passwordless, require verification for password
					verificationToken: password ? verificationToken : null,
				} as any,
			});

			// Send verification email if password-based registration
			if (password) {
				await sendVerificationEmail(user.email, verificationToken);
				return res.status(201).json({
					message:
						"Account created! Please check your email to verify your account.",
					requiresVerification: true,
					email: user.email,
				});
			}
		} else {
			// Existing user login

			// Check if account is locked
			if (await isAccountLocked(user.id)) {
				return res.status(423).json({
					error:
						"Account is temporarily locked due to too many failed login attempts. Please try again later.",
				});
			}

			// If user has a password, validate it
			if (user.password && password) {
				const isValidPassword = await validatePassword(password, user.password);
				if (!isValidPassword) {
					const isLocked = await recordFailedLogin(user.id);
					return res.status(401).json({
						error: isLocked
							? "Invalid credentials. Account has been temporarily locked."
							: "Invalid email or password.",
					});
				}
			} else if (user.password && !password) {
				// User has password but didn't provide one
				return res.status(400).json({
					error: "Password required for this account",
				});
			} else if (!user.password && password) {
				// User wants to add password to passwordless account
				const hashedPassword = await hashPassword(password);
				await prisma.user.update({
					where: { id: user.id },
					data: { password: hashedPassword } as any,
				});
			}

			// Check email verification
			if (!user.emailVerified) {
				return res.status(403).json({
					error: "Please verify your email address before signing in.",
					requiresVerification: true,
					email: user.email,
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

		// Reset failed login attempts on successful login
		await resetLoginAttempts(user.id);

		// Create session
		await createSessionUser(session, user);

		res.status(200).json({
			message: "Successfully signed in",
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				emailVerified: user.emailVerified,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Authentication failed. Please try again." });
	}
}
