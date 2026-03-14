/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Unit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_teacherId_fkey";

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "teacherId";

-- CreateTable
CREATE TABLE "_TeacherProfileToUnit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeacherProfileToUnit_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TeacherProfileToUnit_B_index" ON "_TeacherProfileToUnit"("B");

-- AddForeignKey
ALTER TABLE "_TeacherProfileToUnit" ADD CONSTRAINT "_TeacherProfileToUnit_A_fkey" FOREIGN KEY ("A") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherProfileToUnit" ADD CONSTRAINT "_TeacherProfileToUnit_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
