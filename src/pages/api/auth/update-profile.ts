import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const user = (session as any).user;
	if (!user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const { name, bio } = req.body;

	try {
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				name: name?.trim() || null,
				bio: bio?.trim() || null,
			},
		});

		// Update session
		(session as any).user = {
			...user,
			name: updatedUser.name,
			bio: updatedUser.bio,
		};
		await session.save();

		res.status(200).json({ success: true, user: updatedUser });
	} catch (error) {
		console.error("Error updating profile:", error);
		res.status(500).json({ error: "Failed to update profile" });
	}
}
