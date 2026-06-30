import { describe, it, expect } from "vitest";
import { NeedType, Urgency, AccessStatus, Stage } from "@prisma/client";
import {
  createCentroSchema,
  createReportSchema,
  listQuerySchema,
  updateCentroItemsSchema,
  updateCentroSchema,
  updateReportSchema,
} from "./schemas";

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

describe("listQuerySchema — filtro espacial", () => {
  it("acepta centro y radio para buscar por zona", () => {
    const r = listQuerySchema.parse({
      lat: "10.5967",
      lng: "-66.9562",
      radius: "5000",
    });
    expect(r.lat).toBe(10.5967);
    expect(r.lng).toBe(-66.9562);
    expect(r.radius).toBe(5000);
  });

  it("exige lat y lng juntos", () => {
    const r = listQuerySchema.safeParse({ lat: "10.5967" });
    expect(r.success).toBe(false);
  });

  it("limita radios demasiado grandes", () => {
    const r = listQuerySchema.safeParse({
      lat: "10.5967",
      lng: "-66.9562",
      radius: "1000000",
    });
    expect(r.success).toBe(false);
  });
});

const validCentro = {
  name: "Liceo Bolívar",
  latitude: 10.25,
  longitude: -67.6,
  address: "Maracay, Av. Bolívar",
  encargadoName: "María G.",
  encargadoPhone: "+58 412 1234567",
};

describe("createCentroSchema", () => {
  it("acepta un centro mínimo válido (items opcionales)", () => {
    expect(createCentroSchema.safeParse(validCentro).success).toBe(true);
  });

  it("exige nombre y contacto del encargado", () => {
    expect(
      createCentroSchema.safeParse({ ...validCentro, name: "" }).success,
    ).toBe(false);
    expect(
      createCentroSchema.safeParse({ ...validCentro, encargadoPhone: "123" })
        .success,
    ).toBe(false);
  });

  it("acepta coordenadas internacionales (centros de la diáspora)", () => {
    const r = createCentroSchema.safeParse({
      ...validCentro,
      latitude: 40.4, // Madrid
      longitude: -3.7,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza coordenadas geográficamente imposibles", () => {
    const r = createCentroSchema.safeParse({
      ...validCentro,
      latitude: 200,
      longitude: -3.7,
    });
    expect(r.success).toBe(false);
  });

  it("acepta items con supplyType y level", () => {
    const r = createCentroSchema.safeParse({
      ...validCentro,
      items: [{ supplyType: "AGUA", level: "URGENTE" }],
    });
    expect(r.success).toBe(true);
  });
});

describe("updateCentroSchema", () => {
  it("rechaza un objeto vacío", () => {
    expect(updateCentroSchema.safeParse({}).success).toBe(false);
  });

  it("permite actualizar solo el horario", () => {
    expect(
      updateCentroSchema.safeParse({ horario: "Lun–Vie 9am–5pm" }).success,
    ).toBe(true);
  });

  it("exige latitud y longitud juntas", () => {
    expect(updateCentroSchema.safeParse({ latitude: 10.25 }).success).toBe(
      false,
    );
  });
});

describe("updateCentroItemsSchema", () => {
  it("exige al menos un ítem", () => {
    expect(updateCentroItemsSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("acepta una lista de niveles", () => {
    const r = updateCentroItemsSchema.safeParse({
      items: [
        { supplyType: "AGUA", level: "SUFICIENTE" },
        { supplyType: "ROPA", level: "SOBRADO" },
      ],
    });
    expect(r.success).toBe(true);
  });
});
