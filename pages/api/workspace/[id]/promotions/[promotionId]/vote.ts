import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/database";
import { withSessionRoute } from "@/lib/withSession";

export default withSessionRoute(handler);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, promotionId } = req.query;
  const userId = req.session.userid;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!id || typeof id !== "string" || !promotionId || typeof promotionId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid parameters" });
  }

  const workspaceId = Number.parseInt(id);

  // Check if promotions feature is enabled
  const config = await prisma.config.findFirst({
    where: {
      workspaceGroupId: workspaceId,
      key: "promotions",
    },
  });

  let promotionsEnabled = false;
  if (config?.value) {
    let val = config.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        val = {};
      }
    }
    promotionsEnabled =
      typeof val === "object" && val !== null && "enabled" in val
        ? (val as { enabled?: boolean }).enabled ?? false
        : false;
  }

  if (!promotionsEnabled) {
    return res.status(404).json({ success: false, error: "Promotions feature not enabled" });
  }

  // Verify user has access to this workspace
  const user = await prisma.user.findFirst({
    where: { userid: userId },
    include: {
      roles: {
        where: { workspaceGroupId: workspaceId },
      },
    },
  });

  if (!user || user.roles.length === 0) {
    return res.status(403).json({ success: false, error: "Access denied" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { isUpvote, justification } = req.body;

  if (typeof isUpvote !== "boolean" || !justification || typeof justification !== "string") {
    return res.status(400).json({ success: false, error: "Invalid vote data" });
  }

  if (justification.trim().length === 0) {
    return res.status(400).json({ success: false, error: "Justification is required" });
  }

  // Ensure PromotionVote table exists (single statements only)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PromotionVote" (
      id SERIAL PRIMARY KEY,
      "promotionId" UUID NOT NULL REFERENCES "Promotion"(id) ON DELETE CASCADE,
      "voterId" BIGINT NOT NULL REFERENCES "user"(userid) ON DELETE CASCADE,
      "isUpvote" BOOLEAN NOT NULL,
      justification TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE ("promotionId", "voterId")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PromotionVote_promotion_idx" ON "PromotionVote"("promotionId")`
  );

  // Upsert the user's vote and justification
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PromotionVote" ("promotionId", "voterId", "isUpvote", justification)
     VALUES ($1::uuid, $2::bigint, $3::boolean, $4::text)
     ON CONFLICT ("promotionId", "voterId")
     DO UPDATE SET "isUpvote" = EXCLUDED."isUpvote", justification = EXCLUDED.justification, "updatedAt" = NOW()`,
    promotionId,
    BigInt(userId as any),
    Boolean(isUpvote),
    String(justification)
  );

  // Recompute counts to ensure idempotency
  await prisma.$executeRawUnsafe(
    `UPDATE "Promotion" p
     SET upvotes = COALESCE(v.up, 0), downvotes = COALESCE(v.down, 0), "updatedAt" = NOW()
     FROM (
       SELECT "promotionId",
              SUM(CASE WHEN "isUpvote" THEN 1 ELSE 0 END) AS up,
              SUM(CASE WHEN NOT "isUpvote" THEN 1 ELSE 0 END) AS down
       FROM "PromotionVote"
       WHERE "promotionId" = $1::uuid
       GROUP BY "promotionId"
     ) v
     WHERE p.id = v."promotionId" AND p."workspaceGroupId" = $2::int`,
    promotionId,
    workspaceId
  );

  return res.status(200).json({ success: true, message: "Vote submitted successfully" });
}
