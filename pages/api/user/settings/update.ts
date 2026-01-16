import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "@/lib/withSession";
import prisma from "@/utils/database";

export default withSessionRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userid = req.session?.userid;
  if (!userid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { email, country, birthdayDay, birthdayMonth } = req.body;
    
    const updateData: any = {};
    
    if (email !== undefined) {
      // Validate email format
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      updateData.email = email || null;
    }
    
    if (country !== undefined) {
      updateData.country = country || null;
    }
    
    if (birthdayDay !== undefined) {
      updateData.birthdayDay = birthdayDay ? parseInt(birthdayDay) : null;
    }
    
    if (birthdayMonth !== undefined) {
      updateData.birthdayMonth = birthdayMonth ? parseInt(birthdayMonth) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { userid: BigInt(userid) },
      data: updateData,
      select: {
        userid: true,
        username: true,
        email: true,
        country: true,
        birthdayDay: true,
        birthdayMonth: true,
      },
    });

    return res.status(200).json({
      success: true,
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
    console.error("Error updating user settings:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});
