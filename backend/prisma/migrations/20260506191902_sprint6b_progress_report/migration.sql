-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "memory" DOUBLE PRECISION NOT NULL,
    "attention" DOUBLE PRECISION NOT NULL,
    "logic" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);
