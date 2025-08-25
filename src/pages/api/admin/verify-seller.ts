import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = (session as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.method === "POST") {
    const { id, verified } = req.body;
    await prisma.user.update({
      where: { id },
      data: { verifiedSeller: !!verified },
    });
    return res.status(200).json({ ok: true });
  }
  res.status(405).json({ error: "Method not allowed" });
}
