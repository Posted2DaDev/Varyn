/*
  Warnings:

  - The primary key for the `sessionUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "sessionUser" DROP CONSTRAINT "sessionUser_pkey",
ADD CONSTRAINT "sessionUser_pkey" PRIMARY KEY ("userid", "sessionid", "roleID", "slot");
