-- Add role FK columns
ALTER TABLE "Promotion" ADD COLUMN "currentRoleId" UUID;
ALTER TABLE "Promotion" ADD COLUMN "recommendedRoleId" UUID;

-- Backfill from existing string columns (assumes they stored role UUIDs)
UPDATE "Promotion" SET "currentRoleId" = "currentRole"::uuid;
UPDATE "Promotion" SET "recommendedRoleId" = "recommendedRole"::uuid;

-- Enforce non-null after backfill
ALTER TABLE "Promotion" ALTER COLUMN "currentRoleId" SET NOT NULL;
ALTER TABLE "Promotion" ALTER COLUMN "recommendedRoleId" SET NOT NULL;

-- Add indexes for query performance
CREATE INDEX "Promotion_currentRoleId_idx" ON "Promotion"("currentRoleId");
CREATE INDEX "Promotion_recommendedRoleId_idx" ON "Promotion"("recommendedRoleId");

-- Add foreign keys to role table
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_recommendedRoleId_fkey" FOREIGN KEY ("recommendedRoleId") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old string columns
ALTER TABLE "Promotion" DROP COLUMN "currentRole";
ALTER TABLE "Promotion" DROP COLUMN "recommendedRole";
