import { NextResponse, type NextRequest } from "next/server";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toPublicReport } from "@/lib/serialize";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/reports/[id] — un punto público sanitizado.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.stage === Stage.DESCARTADO) {
    return errorResponse(404, "Solicitud no encontrada");
  }

  return NextResponse.json(toPublicReport(report));
}
