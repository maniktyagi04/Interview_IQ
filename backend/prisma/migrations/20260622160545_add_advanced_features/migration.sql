-- AlterTable
ALTER TABLE "InterviewAnswer" ADD COLUMN     "followUpAnswer" TEXT,
ADD COLUMN     "followUpFeedback" TEXT,
ADD COLUMN     "followUpQuestion" TEXT,
ADD COLUMN     "followUpScore" INTEGER;

-- AlterTable
ALTER TABLE "InterviewReport" ADD COLUMN     "communicationScore" DOUBLE PRECISION,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION,
ADD COLUMN     "technicalScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "JobMatchAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchingSkills" TEXT NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobMatchAnalysis" ADD CONSTRAINT "JobMatchAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
