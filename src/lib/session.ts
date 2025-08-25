import { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
	cookieName: "thewoob_session",
	password: process.env.SESSION_PASSWORD!,
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 7, // 7 days
		httpOnly: true,
		sameSite: "lax",
	},
};

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
	affiliateCode?: string;
}

declare module "iron-session" {
	interface IronSessionData {
		user?: SessionUser & { affiliateCode?: string };
	}
}
