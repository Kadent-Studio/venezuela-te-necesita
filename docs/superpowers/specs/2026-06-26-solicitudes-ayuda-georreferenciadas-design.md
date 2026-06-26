# Diseño — Solicitudes de ayuda georreferenciadas

**Proyecto:** vzla-te-necesita
**Fecha:** 2026-06-26
**Estado:** Aprobado (revisión de spec superada)

## Contexto

vzla-te-necesita ayuda a los damnificados del terremoto del 24 de junio de 2026 en
Venezuela (magnitud ~7.5, epicentro en Carabobo cerca de Morón/Puerto Cabello; La Guaira
declarada zona de desastre). Esta funcionalidad permite **solicitar ayuda en puntos
específicos de las zonas afectadas** y **visualizarlos** para que coordinadores y
voluntarios decidan prioridades y rutas de mayor accesibilidad, optimizando la entrega de
ayuda.

Es la primera funcionalidad real de la app (hoy es un `create-next-app` limpio). Las
páginas de búsqueda de personas desaparecidas viven en otras iniciativas, fuera de este
repositorio.

## Objetivos

- Captar solicitudes de ayuda georreferenciadas de forma rápida y accesible (móvil, baja
  conectividad).
- Mostrar los puntos en un mapa y un listado públicos para priorizar respuesta.
- Permitir a coordinadores gestionar la confianza y el avance de cada solicitud.
- Proteger el dato sensible (contacto) y mitigar reportes falsos/duplicados.

## No-objetivos (fase 1)

- Búsqueda/seguimiento de personas desaparecidas (lo cubren otras iniciativas).
- Reverse-geocoding automático (solo buscador de zona; ver Ubicación).
- Auto-hospedaje de Nominatim / geocoding de pago.
- Notificaciones, mensajería o asignación de voluntarios.

## Stack

- **Next.js 16 (App Router) + React 19 + Tailwind 4** (ya en el repo).
- **Prisma** sobre **Neon Postgres** (Vercel Marketplace).
- **Leaflet + OpenStreetMap** + **Leaflet.markercluster** para mapas.
- **Clerk** (Vercel Marketplace) para autenticación y autorización de coordinadores
  (ver "Autorización de coordinadores").
- **Vercel BotID** + rate-limit por hash de IP como anti-spam.
- **Zod** para validación compartida cliente/API.
- **Nominatim** (OSM) solo para buscador de zona (1 petición por búsqueda manual).

## Arquitectura

```
app/
  page.tsx                  → Principal: listado público con carga progresiva + CTA modal
  reportar/page.tsx         → Respaldo del formulario (enlaces compartibles / sin JS)
  mapa/page.tsx             → Mapa + filtros + listado servidor de respaldo
  admin/                    → Panel de coordinadores (Clerk)
  api/
    reports/route.ts        → POST (crear) · GET (lista pública sanitizada, paginada)
    reports/[id]/route.ts   → GET público (1 punto sanitizado)
    reports/nearby/route.ts → GET público (sugeridor de duplicados por proximidad)
    admin/reports/route.ts        → GET completo (incl. contacto) [Clerk]
    admin/reports/[id]/route.ts   → PATCH (verified / stage / discardReason) [Clerk]
lib/
  prisma.ts                 → Cliente Prisma singleton
  schemas.ts                → Esquemas Zod (incl. bounding box Venezuela)
  serialize.ts              → toPublicReport() — omite datos sensibles
  ratelimit.ts              → Rate-limit por hash de IP
prisma/schema.prisma
```

### Flujo de datos

1. La persona abre el **modal** desde el CTA en `/` (o entra a `/reportar`).
2. Ubica el punto (pin arrastrable / GPS / buscador de zona) y completa los campos.
3. `POST /api/reports` → valida (Zod) → BotID + rate-limit → guarda en Postgres con
   `stage = NUEVO`, `verified = false`.
4. `/` y `/mapa` consultan `GET /api/reports` (datos **sanitizados**, sin contacto).
5. Los coordinadores usan `/admin` (Clerk) para ver datos completos y gestionar estados
   vía `PATCH /api/admin/reports/[id]`.

## Modelo de datos (Prisma / Postgres)

```prisma
model Report {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Ubicación
  latitude      Float
  longitude     Float
  accuracyMeters Int?            // precisión del GPS, si la hubo
  address       String           // sector, ciudad, punto de referencia (obligatorio)

  // Necesidad
  needTypes     NeedType[]       // una o varias
  urgency       Urgency
  description   String?

  // Personas afectadas
  peopleCount   Int      @default(1)
  hasInjured    Boolean  @default(false)
  hasChildren   Boolean  @default(false)
  hasElderly    Boolean  @default(false)

  // Accesibilidad de la zona
  access        AccessStatus

  // Contacto (PRIVADO — nunca en respuestas públicas)
  contactName   String
  contactPhone  String

  // Verificación (eje 1)
  verified      Boolean  @default(false)
  verifiedBy    String?          // Clerk userId
  verifiedAt    DateTime?

  // Etapa de atención (eje 2)
  stage         Stage    @default(NUEVO)
  handledBy     String?          // Clerk userId del último que actuó

  // Motivo de descarte (eje 3, solo si stage = DESCARTADO)
  discardReason DiscardReason?

  // Abuso
  ipHash        String?          // hash de IP, nunca la IP cruda

  @@index([stage])
  @@index([urgency])
  @@index([createdAt, id])       // paginación por cursor
}

enum NeedType     { RESCATE MEDICO AGUA COMIDA REFUGIO OTRO }
enum Urgency      { CRITICA ALTA MEDIA BAJA }
enum AccessStatus { TRANSITABLE BLOQUEADA VEHICULO_ESPECIAL DESCONOCIDA }
enum Stage        { NUEVO EN_ATENCION RESUELTO DESCARTADO }
enum DiscardReason { DUPLICADO FALSO FUERA_DE_ALCANCE }
```

### Modelo de estados (tres ejes independientes)

Se separan tres conceptos que antes se mezclaban en un solo enum, eliminando fricción:

| Eje | Campo | Valores | Visibilidad |
|---|---|---|---|
| Verificación | `verified` (+ `verifiedBy/At`) | sin verificar / ✔ verificado | Badge público de confianza |
| Etapa | `stage` | `NUEVO → EN_ATENCION → RESUELTO` · terminal `DESCARTADO` | Público y admin |
| Motivo descarte | `discardReason` | `DUPLICADO · FALSO · FUERA_DE_ALCANCE` | Solo admin |

El coordinador actúa con toggles independientes: marca *verificado* en cualquier momento,
mueve la *etapa* según avanza la ayuda y *descarta* con motivo, sin embudo rígido ni
pérdida de información.

**Visibilidad pública:** lista y mapa muestran `NUEVO`, `EN_ATENCION` y `RESUELTO`
(atenuado); `DESCARTADO` se oculta. Badge "✔ Verificado" cuando aplica.

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/reports` | Público | Crea. Zod + BotID + rate-limit por `ipHash`. → `201 {id}` |
| `GET` | `/api/reports` | Público | Lista sanitizada, paginación por cursor (`?cursor=&limit=20`), filtros `?needType=&urgency=&access=&stage=`. Excluye `DESCARTADO`. |
| `GET` | `/api/reports/[id]` | Público | Un punto sanitizado. |
| `GET` | `/api/reports/nearby` | Público | `?lat=&lng=&radius=` (def. 200 m). Sugeridor de duplicados, sanitizado. |
| `GET` | `/api/admin/reports` | Clerk | Datos completos (incl. contacto). |
| `PATCH` | `/api/admin/reports/[id]` | Clerk | Actualiza `verified`, `stage`, `discardReason`; fija `verifiedBy/At` y `handledBy`. |

### Garantía de privacidad

Toda salida pública pasa por `toPublicReport()`, que **omite** `contactName`,
`contactPhone` e `ipHash`. La usan `/api/reports`, `/api/reports/[id]` y
`/api/reports/nearby`. Una prueba automatizada falla si cualquiera de estos endpoints
expone el contacto.

### Autorización de coordinadores

Los datos de contacto (`contactName`, `contactPhone`) solo son accesibles vía
`/admin` y `/api/admin/*`, que requieren sesión Clerk. Para que "sesión Clerk" equivalga
a "coordinador autorizado", el **registro público en Clerk está deshabilitado**: las
cuentas se crean **solo por invitación**. En consecuencia, todo usuario autenticado es,
por definición, un coordinador de confianza; no existen cuentas públicas que puedan
escalar a `/admin`.

Implicación: no se contempla en fase 1 un rol de "usuario público con cuenta". Si en el
futuro se quisieran cuentas públicas, habría que introducir un modelo de roles explícito
(p. ej. Organizaciones Clerk) antes de abrir el registro.

## Páginas y componentes

### `/` — Principal (listado + CTA)
- Listado completo de solicitudes con **carga progresiva** (scroll infinito + "Cargar
  más") sobre paginación por cursor.
- **CTA "Solicitar ayuda"** abre un **modal** con el formulario completo (`LocationPicker`
  + campos). Mobile-first.
- Cada item: `ReportCard` con necesidad, urgencia, personas, accesibilidad, referencia,
  badges de etapa y verificación. Sin teléfono.

### `/reportar` — Respaldo del formulario
- Renderiza el mismo formulario que el modal, para enlaces compartibles y clientes sin JS.

### `/mapa` — Mapa público
- `ReportsMap` (cliente, `dynamic ssr:false`): marcadores por urgencia, *clustering*,
  popup sanitizado. Vista inicial centrada en la zona afectada (La Guaira / Carabobo /
  Caracas).
- `ReportFilters`: necesidad, urgencia, accesibilidad, etapa.
- **Listado renderizado en servidor** como respaldo si el mapa no carga (sin JS /
  conexión mala).

### `/admin` — Panel de coordinadores (Clerk)
- Tabla + mapa con **datos completos** (incluye contacto).
- Controles de estado independientes: toggle verificación, selector de etapa, motivo de
  descarte. Registra `verifiedBy`/`handledBy`.
- Mismos filtros que el público.

### Componentes compartidos
`StatusBadge` (etapa), `VerifiedBadge`, `UrgencyBadge`, `NeedTypeTags`, `ReportCard`,
`LocationPicker`, `ReportForm`, `ReportFilters`.

## Manejo de la ubicación

- **Pin arrastrable** = fuente de verdad de `latitude/longitude`.
- **"Usar mi ubicación"** → API de geolocalización del navegador; guarda
  `accuracyMeters`. Funciona sobre HTTPS (Vercel).
- **Buscador de zona** → 1 petición a Nominatim al pulsar "Buscar" (no tecla-por-tecla,
  respeta el límite de 1 req/seg y la política de uso de OSM). Centra el mapa.
- **Referencia en texto** (obligatoria): aporta contexto que las coordenadas no capturan.
- **Sugeridor de duplicados:** al colocar el pin, `GET /api/reports/nearby` muestra
  reportes en ~200 m ("¿es uno de estos?").
- **Validación:** coordenadas dentro del bounding box de Venezuela (lat 0.6–12.2, lng
  −73.4 a −59.8); se rechaza `(0,0)`.
- **Degradación elegante:** si los tiles o Nominatim fallan, el envío continúa con pin +
  texto manual; las coordenadas se muestran en número.

## Anti-spam y abuso

- **Vercel BotID** en `POST /api/reports`.
- **Rate-limit por `ipHash`**: máximo N reportes por ventana de tiempo (se guarda el hash,
  nunca la IP cruda). Valor inicial propuesto: **5 reportes por 10 minutos** por `ipHash`
  (a afinar con tráfico real). El `ipHash` se calcula con **HMAC-SHA256 + secreto de
  servidor** (no un hash plano), para que no se pueda revertir a la IP original.

## Manejo de errores

- API: `400` (validación, errores por campo), `403` (BotID), `429` (rate-limit),
  `401` (admin sin sesión Clerk), `500` (genérico).
- Formulario: errores inline por campo; si falla GPS o Nominatim, mensaje suave y continúa
  con pin/texto manual.
- Mapa: si fallan los tiles, cae al listado renderizado en servidor.

## Testing

- **Unitario:** esquemas Zod (incl. bounding box Venezuela) y `toPublicReport()`.
- **Privacidad (crítico):** afirmar que `/api/reports`, `/api/reports/[id]` y
  `/api/reports/nearby` nunca incluyen `contactPhone`/`contactName`.
- **API:** `POST` valida y crea; `GET` excluye campos sensibles y pagina por cursor;
  `PATCH` exige sesión Clerk; `nearby` filtra por radio.
- **Autorización admin:** `/api/admin/*` rechaza peticiones sin sesión Clerk
  (`401`), garantizando que los datos de contacto no son accesibles sin autenticar.

## Decisiones abiertas / supuestos

- Valor del rate-limit (propuesto 5/10 min por `ipHash`) a afinar con tráfico real.
- Gestión operativa de invitaciones de coordinadores (quién invita) fuera del alcance
  técnico de fase 1.
```
