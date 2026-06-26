# Plan de implementación — Solicitudes de ayuda georreferenciadas

**Proyecto:** vzla-te-necesita
**Fecha:** 2026-06-26
**Spec:** [`../specs/2026-06-26-solicitudes-ayuda-georreferenciadas-design.md`](../specs/2026-06-26-solicitudes-ayuda-georreferenciadas-design.md)

El trabajo se divide en *vertical slices* (tracer bullets): cada fase deja la app
funcionando de punta a punta y aporta valor visible. Se construye el esqueleto primero y
se enriquece después.

---

## Fase 0 — Cimientos

Objetivo: dejar el proyecto listo para construir, sin funcionalidad nueva todavía.

- [ ] Instalar dependencias: `prisma`, `@prisma/client`, `zod`, `@clerk/nextjs`,
      `leaflet`, `react-leaflet`, `leaflet.markercluster`, `botid` (Vercel BotID),
      y tipos (`@types/leaflet`).
- [ ] Provisionar **Neon Postgres** vía Vercel Marketplace; volcar variables con
      `vercel env pull` (`DATABASE_URL`). Añadir `CLERK_*` y `IP_HASH_SECRET`.
- [ ] `lib/prisma.ts`: cliente Prisma singleton (evita múltiples conexiones en dev).
- [ ] Estructura base de carpetas y un layout/estilos mínimos coherentes (mobile-first).

**Entregable:** `pnpm dev` arranca; conexión a BD verificada.

---

## Fase 1 — Esqueleto: reportar y ver en lista

Objetivo: bucle central mínimo end-to-end (crear un reporte y verlo en `/`).

- [ ] `prisma/schema.prisma`: modelo `Report` + enums (`NeedType`, `Urgency`,
      `AccessStatus`, `Stage`, `DiscardReason`). Migración inicial.
- [ ] `lib/schemas.ts`: esquema Zod del reporte, **incl. bounding box de Venezuela**
      (lat 0.6–12.2, lng −73.4 a −59.8; rechazar `(0,0)`).
- [ ] `lib/serialize.ts`: `toPublicReport()` que omite `contactName`, `contactPhone`,
      `ipHash`.
- [ ] `POST /api/reports`: valida con Zod, persiste con `stage=NUEVO`, `verified=false`.
      (Anti-spam llega en Fase 5.)
- [ ] `GET /api/reports`: lista sanitizada con paginación por cursor
      (`?cursor=&limit=20`); excluye `DESCARTADO`.
- [ ] `/` (principal): `ReportCard`, listado con **carga progresiva** (scroll infinito +
      "Cargar más"). CTA "Solicitar ayuda" abre **modal** con `ReportForm` (en esta fase
      la ubicación puede ser entrada simple lat/lng + referencia; el mapa llega en Fase 2).
- [ ] `/reportar`: ruta de respaldo que renderiza el mismo `ReportForm`.
- [ ] **Tests:** Zod (bounding box) y `toPublicReport()`; **test de privacidad**:
      `GET /api/reports` nunca incluye contacto.

**Entregable:** se puede crear una solicitud y verla en la lista pública.

---

## Fase 2 — Selector de ubicación en el formulario

Objetivo: convertir la entrada de ubicación en el `LocationPicker` completo.

- [ ] `components/LocationPicker.tsx` (cliente, `dynamic ssr:false`): mapa Leaflet + OSM,
      **pin arrastrable** como fuente de verdad.
- [ ] Botón **"Usar mi ubicación"** (Geolocation API) → coloca pin y guarda
      `accuracyMeters`. Degradación elegante si se deniega/falla.
- [ ] **Buscador de zona** (Nominatim, 1 petición al pulsar "Buscar"; `User-Agent`
      identificado). Centra el mapa. Si falla, sigue el flujo manual.
- [ ] Fallback si los *tiles* no cargan: mostrar coordenadas en número.
- [ ] `GET /api/reports/nearby?lat=&lng=&radius=` (def. 200 m), sanitizado.
- [ ] **Sugeridor de duplicados** en el formulario al colocar el pin.
- [ ] **Tests:** `nearby` filtra por radio y sale sanitizado.

**Entregable:** ubicación precisa con mapa, GPS, búsqueda y aviso de duplicados.

---

## Fase 3 — Página `/mapa` pública

Objetivo: visualización para priorizar.

- [ ] `components/ReportsMap.tsx` (cliente): marcadores **por urgencia**, *clustering*
      (Leaflet.markercluster), popup sanitizado. Vista inicial en zona afectada.
- [ ] `components/ReportFilters.tsx`: necesidad, urgencia, accesibilidad, etapa
      (se aplican vía query a `GET /api/reports`).
- [ ] **Listado renderizado en servidor** como respaldo si el mapa no carga.
- [ ] Badges: `UrgencyBadge`, `StatusBadge` (etapa), `VerifiedBadge`, `NeedTypeTags`.
      `RESUELTO` atenuado; `DESCARTADO` oculto.

**Entregable:** mapa público filtrable con los puntos de ayuda.

---

## Fase 4 — Panel de coordinadores (`/admin`)

Objetivo: gestión de confianza y etapa.

- [ ] Integrar **Clerk**; `middleware.ts` protege `/admin` y `/api/admin/*`.
      **Registro público deshabilitado** (solo invitación).
- [ ] `GET /api/admin/reports`: datos completos (incl. contacto) — solo con sesión.
- [ ] `PATCH /api/admin/reports/[id]`: actualiza `verified` (+`verifiedBy/At`), `stage`,
      `discardReason`, `handledBy`. Devuelve `401` sin sesión.
- [ ] `/admin`: tabla + mapa con controles de estado **independientes** (toggle
      verificación, selector de etapa, motivo de descarte) y los mismos filtros.
- [ ] **Tests:** `/api/admin/*` rechaza sin sesión (`401`); `PATCH` actualiza ejes.

**Entregable:** coordinadores gestionan estados sobre datos completos.

---

## Fase 5 — Anti-spam y endurecimiento

Objetivo: robustez para producción.

- [ ] **Vercel BotID** en `POST /api/reports` (→ `403` si bot).
- [ ] `lib/ratelimit.ts`: rate-limit por `ipHash` (**HMAC-SHA256 + `IP_HASH_SECRET`**),
      5 reportes / 10 min (→ `429`).
- [ ] Pulido de errores: `400` con errores por campo, `500` genérico; mensajes inline.
- [ ] Revisión final de accesibilidad y baja conectividad (móvil, sin JS para listados).
- [ ] **Tests:** suite de privacidad sobre `/api/reports`, `/api/reports/[id]`,
      `/api/reports/nearby`; verificación de rate-limit.

**Entregable:** funcionalidad completa, protegida y lista para desplegar.

---

## Orden recomendado y notas

- Fases secuenciales; cada una es desplegable. Fase 1 es el *walking skeleton*.
- Los **tests de privacidad** se introducen en Fase 1 y se extienden en cada fase que
  añade un endpoint público.
- Secretos requeridos: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
  `IP_HASH_SECRET`.
- Despliegue en Vercel; BotID y Clerk son integraciones nativas del Marketplace.
