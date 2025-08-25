import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "./session";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface SessionUser {
	id: string;
	email: string;
	name?: string;
	image?: string;
	role: string;
	stripeAccountId?: string;
	emailVerified: boolean;
	lastLoginAt: Date;
	createdAt: Date;
}

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export async function getUserFromSession(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	return (session as any).user || null;
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
	const user = await getUserFromSession(req, res);
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

export function withAuth(handler: Function) {
	return async (req: NextApiRequest, res: NextApiResponse) => {
		try {
			const user = await requireAuth(req, res);
			return handler(req, res, user);
		} catch (error) {
			return res.status(401).json({ error: "Authentication required" });
		}
	};
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

export function generateToken(): string {
	return crypto.randomBytes(32).toString("hex");
}

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function isValidPassword(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push("Password must be at least 8 characters long");
	}

	if (!/[A-Z]/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}

	if (!/[a-z]/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}

	if (!/\d/.test(password)) {
		errors.push("Password must contain at least one number");
	}

	return { valid: errors.length === 0, errors };
}

export function checkRateLimit(identifier: string): {
	allowed: boolean;
	resetTime?: number;
} {
	const now = Date.now();
	const attempts = loginAttempts.get(identifier);

	if (!attempts) {
		return { allowed: true };
	}

	if (now > attempts.resetTime) {
		loginAttempts.delete(identifier);
		return { allowed: true };
	}

	if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
		return { allowed: false, resetTime: attempts.resetTime };
	}

	return { allowed: true };
}

export function recordLoginAttempt(identifier: string, success: boolean): void {
	const now = Date.now();
	const attempts = loginAttempts.get(identifier);

	if (success) {
		loginAttempts.delete(identifier);
		return;
	}

	if (!attempts) {
		loginAttempts.set(identifier, { count: 1, resetTime: now + LOCKOUT_TIME });
	} else {
		attempts.count++;
		if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
			attempts.resetTime = now + LOCKOUT_TIME;
		}
	}
}

export async function updateUserSession(
	req: NextApiRequest,
	res: NextApiResponse,
	user: any,
) {
	const session = await getIronSession(req, res, sessionOptions);

	// Update user's last login time
	await prisma.user.update({
		where: { id: user.id },
		data: { lastLoginAt: new Date() } as any,
	});

	(session as any).user = {
		id: user.id,
		email: user.email,
		name: user.name,
		image: user.image,
		role: user.role,
		stripeAccountId: user.stripeAccountId,
		emailVerified: user.emailVerified,
		lastLoginAt: new Date(),
		createdAt: user.createdAt,
		affiliateCode: user.affiliateCode,
	};

	await session.save();
}

export async function clearUserSession(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);
	(session as any).user = undefined;
	await session.save();
}

export async function isAccountLocked(userId: string): Promise<boolean> {
	const user = (await prisma.user.findUnique({
		where: { id: userId },
	})) as any;

	if (!user?.lockedUntil) return false;

	if (new Date() > user.lockedUntil) {
		// Unlock the account
		await prisma.user.update({
			where: { id: userId },
			data: { lockedUntil: null, loginAttempts: 0 } as any,
		});
		return false;
	}

	return true;
}

export async function lockAccount(userId: string): Promise<void> {
	const lockUntil = new Date(Date.now() + LOCKOUT_TIME);
	await prisma.user.update({
		where: { id: userId },
		data: {
			lockedUntil: lockUntil,
			loginAttempts: MAX_LOGIN_ATTEMPTS,
		} as any,
	});
}

export async function recordFailedLogin(userId: string): Promise<boolean> {
	const user = (await prisma.user.update({
		where: { id: userId },
		data: { loginAttempts: { increment: 1 } } as any,
	})) as any;

	if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
		await lockAccount(userId);
		return true; // Account is now locked
	}

	return false; // Account not locked yet
}

export async function resetLoginAttempts(userId: string): Promise<void> {
	await prisma.user.update({
		where: { id: userId },
		data: {
			loginAttempts: 0,
			lockedUntil: null,
		} as any,
	});
}

// Email verification functions
export async function sendVerificationEmail(
	email: string,
	token: string,
): Promise<void> {
	// TODO: Implement actual email sending based on your email service
	// For now, just log the verification link
	const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify?token=${token}`;
	console.log(`Verification email for ${email}: ${verificationUrl}`);

	// In production, you would use a service like:
	// - SendGrid
	// - Mailgun
	// - AWS SES
	// - Nodemailer with SMTP
}

export async function sendPasswordResetEmail(
	email: string,
	token: string,
): Promise<void> {
	// TODO: Implement actual email sending
	const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset?token=${token}`;
	console.log(`Password reset email for ${email}: ${resetUrl}`);
}

// Password validation function
export async function validatePassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

// Create session user data
export async function createSessionUser(
	session: any,
	user: any,
): Promise<void> {
	// Update user's last login time
	await prisma.user.update({
		where: { id: user.id },
		data: { lastLoginAt: new Date() } as any,
	});

	(session as any).user = {
		id: user.id,
		email: user.email,
		name: user.name,
		image: user.image,
		role: user.role,
		stripeAccountId: user.stripeAccountId,
		emailVerified: user.emailVerified,
		lastLoginAt: new Date(),
		createdAt: user.createdAt,
		affiliateCode: user.affiliateCode,
	};

	await session.save();
}
