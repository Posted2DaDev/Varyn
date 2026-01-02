import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/database";
import { getRobloxUsername, getRobloxThumbnail } from "@/utils/roblox";
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

  if (Number.isNaN(workspaceId)) {
    return res.status(400).json({ success: false, error: "Invalid workspace ID" });
  }
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

  if (req.method === "GET") {
    return handleGetPromotion(req, res, workspaceId, promotionId);
  } else if (req.method === "DELETE") {
    return handleDeletePromotion(req, res, workspaceId, promotionId, userId, user);
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}

async function handleGetPromotion(
  req: NextApiRequest,
  res: NextApiResponse,
  workspaceId: number,
  promotionId: string
) {
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT p.*, cr.name AS "currentRoleName", rr.name AS "recommendedRoleName"
     FROM "Promotion" p
     LEFT JOIN "role" cr ON cr.id = p."currentRoleId"
     LEFT JOIN "role" rr ON rr.id = p."recommendedRoleId"
     WHERE p.id = $1::uuid AND p."workspaceGroupId" = $2::int
     LIMIT 1`,
    promotionId,
    workspaceId
  );
  const row = rows?.[0];
  if (!row) {
    return res.status(404).json({ success: false, error: "Promotion not found" });
  }
  // Load votes for comments/voters display
  const voteRows: any[] = (await prisma.$queryRawUnsafe(
    `SELECT id, "voterId", "isUpvote", justification, "createdAt"
     FROM "PromotionVote"
     WHERE "promotionId" = $1::uuid
     ORDER BY "createdAt" DESC`,
    promotionId
  ).catch(() => [])) as any[];

  // Enrich voter identities
  const voterIds = Array.from(new Set(voteRows.map(v => String(v.voterId))));
  const voterInfo = await Promise.all(
    voterIds.map(async (vid) => {
      const [username, avatar] = await Promise.all([
        getRobloxUsername(BigInt(vid)).catch(() => "Unknown User"),
        getRobloxThumbnail(BigInt(vid)).catch(() => ""),
      ]);
      return { userId: vid, username, avatar };
    })
  );
  const voterInfoMap = new Map(voterInfo.map(v => [v.userId, v]));
  const [recommenderName, recommenderAvatar, targetUsername, targetAvatar] = await Promise.all([
    getRobloxUsername(BigInt(row.recommenderId)).catch(() => "Unknown User"),
    getRobloxThumbnail(BigInt(row.recommenderId)).catch(() => ""),
    getRobloxUsername(BigInt(row.targetUserId)).catch(() => "Unknown User"),
    getRobloxThumbnail(BigInt(row.targetUserId)).catch(() => ""),
  ]);
  const promotion = {
    id: row.id,
    recommenderId: String(row.recommenderId),
    recommenderName,
    recommenderAvatar,
    targetUserId: String(row.targetUserId),
    targetUsername,
    targetAvatar,
    currentRole: row.currentRoleName || row.currentRoleId,
    currentRoleId: row.currentRoleId,
    recommendedRole: row.recommendedRoleName || row.recommendedRoleId,
    recommendedRoleId: row.recommendedRoleId,
    reason: row.reason,
    upvotes: Number(row.upvotes || 0),
    downvotes: Number(row.downvotes || 0),
    createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
    status: "pending" as const,
    voters: voterInfo,
    comments: voteRows.map((vr) => ({
      id: Number(vr.id),
      userId: String(vr.voterId),
      username: voterInfoMap.get(String(vr.voterId))?.username || "Unknown User",
      avatar: voterInfoMap.get(String(vr.voterId))?.avatar || "",
      content: String(vr.justification || ""),
      createdAt: vr.createdAt?.toISOString?.() || new Date().toISOString(),
      isUpvote: Boolean(vr.isUpvote),
    })),
    targetJoinDate: undefined as string | undefined,
  };

  return res.status(200).json({ success: true, promotion });
}

async function handleDeletePromotion(
  req: NextApiRequest,
  res: NextApiResponse,
  workspaceId: number,
  promotionId: string,
  userId: string,
  user: any
) {
  // Check if user has permission to delete
  const hasPermission =
    user.roles[0].isOwnerRole ||
    user.roles[0].permissions.includes("manage_promotions") ||
    user.roles[0].permissions.includes("admin");

  if (!hasPermission) {
    return res.status(403).json({ success: false, error: "Insufficient permissions" });
  }
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Promotion" WHERE id = $1::uuid AND "workspaceGroupId" = $2::int`,
    promotionId,
    workspaceId
  );
  return res.status(200).json({ success: true, message: "Promotion deleted successfully" });
}
