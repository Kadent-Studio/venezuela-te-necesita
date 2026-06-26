-- CreateEnum
CREATE TYPE "NeedType" AS ENUM ('RESCATE', 'MEDICO', 'AGUA', 'COMIDA', 'REFUGIO', 'OTRO');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('CRITICA', 'ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('TRANSITABLE', 'BLOQUEADA', 'VEHICULO_ESPECIAL', 'DESCONOCIDA');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('NUEVO', 'EN_ATENCION', 'RESUELTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "DiscardReason" AS ENUM ('DUPLICADO', 'FALSO', 'FUERA_DE_ALCANCE');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" INTEGER,
    "address" TEXT NOT NULL,
    "needTypes" "NeedType"[],
    "urgency" "Urgency" NOT NULL,
    "description" TEXT,
    "peopleCount" INTEGER NOT NULL DEFAULT 1,
    "hasInjured" BOOLEAN NOT NULL DEFAULT false,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "hasElderly" BOOLEAN NOT NULL DEFAULT false,
    "access" "AccessStatus" NOT NULL,
    "photoUrl" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "stage" "Stage" NOT NULL DEFAULT 'NUEVO',
    "handledBy" TEXT,
    "discardReason" "DiscardReason",
    "ipHash" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_stage_idx" ON "Report"("stage");

-- CreateIndex
CREATE INDEX "Report_urgency_idx" ON "Report"("urgency");

-- CreateIndex
CREATE INDEX "Report_createdAt_id_idx" ON "Report"("createdAt", "id");
