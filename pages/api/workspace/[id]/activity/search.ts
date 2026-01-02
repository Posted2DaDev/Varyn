import type { NextApiRequest, NextApiResponse } from "next";

// Activity search endpoint was removed; return 404 to disable the feature.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(404).json({ success: false, error: "Not found" });
}
