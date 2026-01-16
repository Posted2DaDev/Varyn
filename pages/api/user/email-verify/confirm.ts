import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "@/lib/withSession";
import { prisma } from "@/lib/prisma";

/**
 * Global email verification confirm
 * POST /api/user/email-verify/confirm
 * Body: { email: string, code: string }
 */
export default withSessionRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!req.session?.userid) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email, code } = req.body;

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const userId = BigInt(req.session.userid);
    const workspaceGroupId = 0; // Global verification scope

    const token = await prisma.emailVerificationToken.findFirst({
      where: {
        workspaceGroupId,
        userId,
        email: trimmedEmail,
        code: trimmedCode,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (token.usedAt) {
      return res.status(400).json({ error: "This code has already been used" });
    }

    if (token.expiresAt < new Date()) {
      return res.status(400).json({ error: "This code has expired" });
    }

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    // Update user's global email
    const updatedUser = await prisma.user.update({
      where: { userid: userId },
      data: { email: trimmedEmail },
      select: {
        userid: true,
        username: true,
        email: true,
        country: true,
        birthdayDay: true,
        birthdayMonth: true,
      },
    });

    // Optionally, propagate to workspaceMember records that don't have an explicit email
    await prisma.workspaceMember.updateMany({
      where: {
        userId,
      },
      data: {
        email: trimmedEmail,
        emailVerified: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Email verified and updated",
      user: {
        userid: updatedUser.userid.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        country: updatedUser.country,
        birthdayDay: updatedUser.birthdayDay,
        birthdayMonth: updatedUser.birthdayMonth,
      },
    });
  } catch (error) {
    console.error("Global email verification confirm error:", error);
    return res.status(500).json({ error: "Failed to verify email" });
  }
});
