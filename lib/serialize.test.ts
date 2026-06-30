import { describe, it, expect } from "vitest";
import {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  type Centro,
  type CentroItem,
  type Report,
} from "@prisma/client";
import {
  toPublicCentro,
  toPublicReport,
  toPublicReports,
  type CentroWithItems,
} from "./serialize";

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

function makeCentro(overrides: Partial<Centro> = {}): CentroWithItems {
  const item = (
    over: Partial<CentroItem> = {},
  ): CentroItem => ({
    id: "item0000000000000000000",
    centroId: "centro000000000000000000",
    supplyType: "AGUA",
    level: "NECESITA",
    note: null,
    updatedAt: new Date("2026-06-30T12:00:00Z"),
    ...over,
  });

  return {
    id: "centro000000000000000000",
    createdAt: new Date("2026-06-30T12:00:00Z"),
    updatedAt: new Date("2026-06-30T12:00:00Z"),
    name: "Liceo Bolívar",
    description: "Coliseo techado",
    latitude: 10.25,
    longitude: -67.6,
    accuracyMeters: null,
    address: "Maracay, Av. Bolívar",
    photoUrl: "https://blob.example/centro.jpg",
    encargadoName: "María G.",
    encargadoPhone: "+58 412 1234567",
    horario: "Lun–Sáb 8am–6pm",
    manageToken: "SECRET_TOKEN_xyz",
    verified: false,
    verifiedBy: null,
    verifiedAt: null,
    lastStockUpdatedAt: new Date("2026-06-30T12:00:00Z"),
    ipHash: "deadbeef",
    items: [item({ supplyType: "AGUA", level: "URGENTE" }), item({ supplyType: "OTRO", note: "carpas" })],
    ...overrides,
  } as CentroWithItems;
}

describe("toPublicCentro (garantía de privacidad)", () => {
  it("omite el manageToken y el ipHash", () => {
    const pub = toPublicCentro(makeCentro());
    expect(pub).not.toHaveProperty("manageToken");
    expect(pub).not.toHaveProperty("ipHash");
  });

  it("no deja rastro del token ni del ipHash en el JSON", () => {
    const json = JSON.stringify(toPublicCentro(makeCentro()));
    expect(json).not.toContain("SECRET_TOKEN_xyz");
    expect(json).not.toContain("deadbeef");
  });

  it("expone el contacto del encargado (público) y el horario", () => {
    const pub = toPublicCentro(makeCentro());
    expect(pub.encargadoName).toBe("María G.");
    expect(pub.encargadoPhone).toBe("+58 412 1234567");
    expect(pub.horario).toBe("Lun–Sáb 8am–6pm");
  });

  it("aplana los ítems a supplyType/level/note", () => {
    const pub = toPublicCentro(makeCentro());
    expect(pub.items).toEqual([
      { supplyType: "AGUA", level: "URGENTE", note: null },
      { supplyType: "OTRO", level: "NECESITA", note: "carpas" },
    ]);
  });
});
