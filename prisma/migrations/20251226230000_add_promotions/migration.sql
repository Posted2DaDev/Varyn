-- Create Promotion table consistent with prisma/schema.prisma
CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" UUID NOT NULL,
  "workspaceGroupId" INTEGER NOT NULL,
  "recommenderId" BIGINT NOT NULL,
  "targetUserId" BIGINT NOT NULL,
  "currentRole" TEXT NOT NULL,
  "recommendedRole" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "downvotes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Promotion_workspace_idx" ON "Promotion" ("workspaceGroupId");
CREATE INDEX IF NOT EXISTS "Promotion_created_idx" ON "Promotion" ("createdAt");

-- Foreign keys
ALTER TABLE "Promotion"
  ADD CONSTRAINT "Promotion_workspace_fkey"
  FOREIGN KEY ("workspaceGroupId") REFERENCES "workspace"("groupId")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "Promotion"
  ADD CONSTRAINT "Promotion_recommender_fkey"
  FOREIGN KEY ("recommenderId") REFERENCES "user"("userid")
  ON UPDATE CASCADE ON DELETE RESTRICT;
