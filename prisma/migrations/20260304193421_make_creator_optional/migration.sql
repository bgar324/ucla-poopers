-- DropForeignKey
ALTER TABLE "Bathroom" DROP CONSTRAINT "Bathroom_created_by_fkey";

-- AlterTable
ALTER TABLE "Bathroom" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bathroom" ADD CONSTRAINT "Bathroom_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
