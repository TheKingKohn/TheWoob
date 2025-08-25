import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const session = await getIronSession(req, res, sessionOptions);

	const user = (session as any).user;
	if (!user) return res.status(401).json({ error: "not authenticated" });
	res.status(200).json({ user });
}
