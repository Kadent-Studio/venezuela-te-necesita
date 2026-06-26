import { describe, it, expect } from "vitest";
import { NeedType, Urgency, AccessStatus, Stage } from "@prisma/client";
import { createReportSchema, updateReportSchema } from "./schemas";

const validBase = {
  latitude: 10.6,
  longitude: -67.0,
  address: "Catia La Mar, La Guaira",
  needTypes: [NeedType.AGUA],
  urgency: Urgency.ALTA,
  access: AccessStatus.BLOQUEADA,
  contactName: "María Pérez",
  contactPhone: "+58 412 1234567",
};

describe("createReportSchema — bounding box Venezuela", () => {
  it("acepta coordenadas dentro de Venezuela", () => {
    expect(createReportSchema.safeParse(validBase).success).toBe(true);
  });

  it("rechaza (0,0)", () => {
    const r = createReportSchema.safeParse({ ...validBase, latitude: 0, longitude: 0 });
    expect(r.success).toBe(false);
  });

  it("rechaza coordenadas fuera del país (ej. Madrid)", () => {
    const r = createReportSchema.safeParse({ ...validBase, latitude: 40.4, longitude: -3.7 });
    expect(r.success).toBe(false);
  });

  it("exige al menos un tipo de ayuda", () => {
    const r = createReportSchema.safeParse({ ...validBase, needTypes: [] });
    expect(r.success).toBe(false);
  });

  it("aplica el default peopleCount = 1", () => {
    const r = createReportSchema.parse(validBase);
    expect(r.peopleCount).toBe(1);
  });
});

describe("updateReportSchema — coherencia de ejes de estado", () => {
  it("permite verificar sin tocar la etapa", () => {
    expect(updateReportSchema.safeParse({ verified: true }).success).toBe(true);
  });

  it("rechaza un objeto vacío", () => {
    expect(updateReportSchema.safeParse({}).success).toBe(false);
  });

  it("rechaza discardReason sin stage DESCARTADO", () => {
    const r = updateReportSchema.safeParse({ stage: Stage.EN_ATENCION, discardReason: "DUPLICADO" });
    expect(r.success).toBe(false);
  });

  it("acepta discardReason con stage DESCARTADO", () => {
    const r = updateReportSchema.safeParse({ stage: Stage.DESCARTADO, discardReason: "DUPLICADO" });
    expect(r.success).toBe(true);
  });
});
