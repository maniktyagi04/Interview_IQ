-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "executionTime" DOUBLE PRECISION,
ADD COLUMN     "passedTests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verdict" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
