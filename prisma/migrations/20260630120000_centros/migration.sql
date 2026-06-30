-- CreateEnum
CREATE TYPE "CentroScope" AS ENUM ('VENEZUELA', 'EXTERIOR');

-- CreateEnum
CREATE TYPE "SupplyType" AS ENUM ('AGUA', 'ALIMENTOS', 'MEDICINAS', 'PANALES', 'HIGIENE', 'ROPA', 'COLCHONES', 'AGUA_ASEO', 'COCINA', 'ENERGIA', 'LIMPIEZA', 'OTRO');

-- CreateEnum
CREATE TYPE "StockLevel" AS ENUM ('URGENTE', 'NECESITA', 'SUFICIENTE', 'SOBRADO');

-- CreateTable
CREATE TABLE "Centro" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "CentroScope",
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" INTEGER,
    "address" TEXT NOT NULL,
    "location" geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
    "photoUrl" TEXT,
    "receivesNote" TEXT,
    "encargadoName" TEXT,
    "encargadoPhone" TEXT,
    "phone" TEXT,
    "contactHandle" TEXT,
    "horario" TEXT,
    "manageToken" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationsCount" INTEGER NOT NULL DEFAULT 0,
    "endsAt" TIMESTAMP(3),
    "lastStockUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "externalId" TEXT,
    "sourceHandle" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "Centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroItem" (
    "id" TEXT NOT NULL,
    "centroId" TEXT NOT NULL,
    "supplyType" "SupplyType" NOT NULL,
    "level" "StockLevel" NOT NULL DEFAULT 'NECESITA',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentroItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Centro_manageToken_key" ON "Centro"("manageToken");

-- CreateIndex
CREATE INDEX "Centro_createdAt_id_idx" ON "Centro"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Centro_scope_idx" ON "Centro"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Centro_source_externalId_key" ON "Centro"("source", "externalId");

-- CreateIndex
CREATE INDEX "CentroItem_supplyType_level_idx" ON "CentroItem"("supplyType", "level");

-- CreateIndex
CREATE UNIQUE INDEX "CentroItem_centroId_supplyType_key" ON "CentroItem"("centroId", "supplyType");

-- AddForeignKey
ALTER TABLE "CentroItem" ADD CONSTRAINT "CentroItem_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
