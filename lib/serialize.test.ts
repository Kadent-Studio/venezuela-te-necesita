import { describe, it, expect } from "vitest";
import {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  type Report,
} from "@prisma/client";
import { toPublicReport, toPublicReports } from "./serialize";

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "ckxyz0000000000000000000",
    createdAt: new Date("2026-06-26T12:00:00Z"),
    updatedAt: new Date("2026-06-26T12:00:00Z"),
    latitude: 10.6,
    longitude: -67.0,
    accuracyMeters: 25,
    address: "Catia La Mar, La Guaira",
    needTypes: [NeedType.AGUA, NeedType.MEDICO],
    urgency: Urgency.ALTA,
    description: "Familia atrapada sin agua",
    peopleCount: 4,
    hasInjured: true,
    hasChildren: true,
    hasElderly: false,
    access: AccessStatus.BLOQUEADA,
    photoUrl: "https://blob.example/foto.jpg",
    contactName: "María Pérez",
    contactPhone: "+58 412 1234567",
    verified: false,
    verifiedBy: null,
    verifiedAt: null,
    stage: Stage.NUEVO,
    handledBy: null,
    discardReason: null,
    ipHash: "deadbeef",
    ...overrides,
  };
}

describe("toPublicReport (garantía de privacidad)", () => {
  it("omite el ipHash", () => {
    const pub = toPublicReport(makeReport());
    expect(pub).not.toHaveProperty("ipHash");
  });

  it("no deja rastro del ipHash en ningún valor serializado", () => {
    const pub = toPublicReport(makeReport());
    expect(JSON.stringify(pub)).not.toContain("deadbeef");
  });

  it("expone el contacto (medio para coordinar el acceso al lugar)", () => {
    const pub = toPublicReport(makeReport());
    expect(pub.contactName).toBe("María Pérez");
    expect(pub.contactPhone).toBe("+58 412 1234567");
  });

  it("conserva los campos públicos", () => {
    const pub = toPublicReport(makeReport());
    expect(pub.id).toBe("ckxyz0000000000000000000");
    expect(pub.latitude).toBe(10.6);
    expect(pub.needTypes).toEqual([NeedType.AGUA, NeedType.MEDICO]);
    expect(pub.photoUrl).toBe("https://blob.example/foto.jpg");
    expect(pub.stage).toBe(Stage.NUEVO);
  });

  it("sanitiza listas completas (sin ipHash)", () => {
    const list = toPublicReports([makeReport(), makeReport()]);
    for (const pub of list) {
      expect(pub).not.toHaveProperty("ipHash");
      expect(pub.contactPhone).toBe("+58 412 1234567");
    }
  });
});
