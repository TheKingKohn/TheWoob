import { getIronSession } from "iron-session";
import { sessionOptions } from "./session";
import type { NextApiRequest, NextApiResponse } from "next";

export async function getSession(req: NextApiRequest, res: NextApiResponse) {
	return getIronSession(req, res, sessionOptions);
}
