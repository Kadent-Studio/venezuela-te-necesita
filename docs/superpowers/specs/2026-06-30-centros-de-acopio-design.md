# Diseño — Centros de acopio

**Proyecto:** vzla-te-necesita
**Fecha:** 2026-06-30
**Estado:** Borrador (revisión de spec pendiente)

## Contexto

vzla-te-necesita ayuda a los damnificados del terremoto del 24 de junio de 2026 en
Venezuela. La primera funcionalidad ([solicitudes de ayuda georreferenciadas](./2026-06-26-solicitudes-ayuda-georreferenciadas-design.md))
mapea **dónde se necesita ayuda**. Esta funcionalidad mapea **dónde se recibe ayuda**:
los **centros de acopio** que reciben donaciones físicas.

El problema central no es solo ubicarlos, sino **evitar la mala distribución**: en toda
emergencia los centros se saturan de un ítem (p. ej. ropa) mientras carecen de otro (p. ej.
agua o pañales). Un donante necesita saber, antes de salir, **qué llevar y a dónde**, y
sobre todo **qué NO llevar** a un centro ya saturado.

Para que el dato sea fiable se designa a una **persona encargada in-situ** que mantiene
actualizado el inventario de cada centro. Como la app aún **no tiene sistema de login**, el
encargado gestiona su centro mediante un **enlace secreto** (token), sin crear cuenta.

## Objetivos

- Registrar centros de acopio georreferenciados de forma rápida y pública.
- Mostrar por cada centro un **semáforo de necesidades por ítem** (qué falta, qué sobra)
  para que el donante distribuya bien y no sobre-cargue un solo ítem.
- Permitir que un **encargado in-situ** mantenga el inventario al día sin necesidad de
  cuenta, vía enlace de gestión con token.
- Exponer el **contacto del encargado** para que los donantes coordinen entregas.
- Reusar la estructura de UI ya establecida (modal de registro, sheet de detalle).

## No-objetivos (fase 1)

- Estado operativo del centro (abierto / lleno / cerrado): por ahora la señal es el
  semáforo de ítems, no un estado de apertura. (Ver "Decisiones abiertas".)
- Cantidades/stock numérico: se modela **nivel** por ítem, no unidades.
- Verificación con auth real: el campo `verified` existe pero su activación se cablea
  cuando exista panel de coordinadores (igual que `Report.verified`).
- Mapa compartido con solicitudes: los centros viven en su **propia página** `/centros`.
- Inventario de texto libre: el catálogo de ítems es **fijo** (enum), para poder filtrar.

## Stack

Idéntico al de solicitudes: **Next.js 16 (App Router) + React 19 + Tailwind 4**,
**Prisma** sobre **Neon Postgres** (+ PostGIS para consultas por radio), **Leaflet +
markercluster**, **Vercel Blob** (foto), **Vercel BotID** + rate-limit por `ipHash`,
**Zod** compartido cliente/API, **Hono `@hono/zod-openapi`** para el contrato.

Diferencia clave: la gestión del encargado **no usa Clerk**; usa un **token por centro**.

## Arquitectura

```
app/
  centros/
    page.tsx                      → Mapa + filtro por ítem/nivel + lista (público)
    registrar/page.tsx            → Respaldo del formulario (enlaces / sin JS)
    [id]/gestionar/page.tsx       → Vista del encargado (token en query) — semáforo editable
  api/[[...route]]/route.ts       → Hono catch-all (rutas nuevas de centros)
components/
  registrar-centro-button.tsx     → Dialog modal (espeja SolicitarAyudaButton)
  centro-form.tsx                 → Formulario de registro (espeja ReportForm)
  centro-details-sheet.tsx        → Sheet lateral de detalle (espeja ReportDetailsSheet)
  centros-map.tsx / -cluster.tsx  → Mapa de centros (espeja reports-map*)
  centros-filters.tsx             → Filtro por ítem + nivel
  centro-stock-editor.tsx         → Semáforo editable (usado en /gestionar)
  ui/stock.tsx                    → Chip/semáforo de nivel reutilizable
lib/
  api/contract.ts                 → + contratos Centro
  services/centros.ts             → Lógica de negocio (ServiceResult<T>)
  serialize.ts                    → + toPublicCentro() (omite manageToken, ipHash)
  schemas.ts                      → + esquemas Zod de centro
  labels.ts                       → + supplyTypeLabel/order, stockLevelLabel/color/order
prisma/schema.prisma              → + Centro, CentroItem, SupplyType, StockLevel
```

### Flujo de datos

1. Cualquiera abre el **modal** de registro desde `/centros` (o entra a `/centros/registrar`).
2. Ubica el punto (`LocationPicker`), nombra el centro, da contacto del encargado y horario,
   y ajusta los **niveles iniciales** de los ítems (por defecto todos `NECESITA`).
3. `POST /api/centros` → valida (Zod) → BotID + rate-limit → crea el `Centro`, **siembra los
   12 `CentroItem` en `NECESITA`** y genera un `manageToken`. → `201 { id, manageToken }`.
4. La pantalla de éxito muestra el **enlace de gestión** (`/centros/[id]/gestionar?token=…`)
   para copiar y **compartir por WhatsApp** con el encargado in-situ.
5. `/centros` consulta `GET /api/centros` (sanitizado: sin token) y pinta mapa + lista. El
   donante filtra por ítem/nivel y abre la **sheet** de detalle para coordinar.
6. El encargado abre su enlace y ajusta el semáforo vía `PATCH /api/centros/[id]/items`
   (token); cada cambio actualiza `lastStockUpdatedAt`.

## Modelo de datos (Prisma / Postgres)

```prisma
model Centro {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Identidad
  name          String                  // nombre del centro (p. ej. "Liceo Bolívar")
  description   String?                 // notas (qué reciben, instrucciones de entrega)

  // Ubicación (mismo patrón que Report)
  latitude      Float
  longitude     Float
  accuracyMeters Int?
  address       String                  // referencia / dirección legible (obligatorio)
  location      Unsupported("geography(Point, 4326)")?

  // Evidencia (pública)
  photoUrl      String?                 // foto del centro (Vercel Blob, opcional)

  // Contacto del encargado (PÚBLICO — para coordinar entregas)
  encargadoName  String
  encargadoPhone String                 // teléfono / WhatsApp
  horario        String?                // texto libre (p. ej. "Lun–Sáb 8am–6pm")

  // Gestión sin login (PRIVADO — nunca en respuestas públicas)
  manageToken   String   @unique        // enlace secreto del encargado

  // Verificación (cableado diferido — espeja Report.verified)
  verified      Boolean  @default(false)
  verifiedBy    String?
  verifiedAt    DateTime?

  // Frescura del inventario
  lastStockUpdatedAt DateTime @default(now())

  // Abuso
  ipHash        String?                 // HMAC de IP, nunca la IP cruda

  items         CentroItem[]

  @@index([createdAt, id])              // paginación por cursor
}

model CentroItem {
  id         String     @id @default(cuid())
  centroId   String
  centro     Centro     @relation(fields: [centroId], references: [id], onDelete: Cascade)
  supplyType SupplyType
  level      StockLevel @default(NECESITA)
  note       String?                    // detalle, sobre todo para OTRO ("pañales talla 2")
  updatedAt  DateTime   @updatedAt

  @@unique([centroId, supplyType])      // un nivel por ítem por centro
  @@index([supplyType, level])          // filtro donante: "¿quién necesita Agua?"
}

enum SupplyType {
  AGUA            // Agua potable
  ALIMENTOS       // Alimentos no perecederos
  MEDICINAS       // Medicinas / insumos médicos
  PANALES         // Pañales (bebé/adulto)
  HIGIENE         // Artículos de higiene personal
  ROPA            // Ropa y calzado
  COLCHONES       // Colchones / cobijas
  AGUA_ASEO       // Agua para aseo
  COCINA          // Utensilios de cocina
  ENERGIA         // Linternas / pilas / energía
  LIMPIEZA        // Productos de limpieza
  OTRO            // Otro (con nota)
}

enum StockLevel {
  URGENTE         // falta ya — traer con prioridad
  NECESITA        // hace falta (por defecto al crear)
  SUFICIENTE      // tienen lo necesario — no urge
  SOBRADO         // saturado — NO traer más
}
```

### Semáforo de necesidades (el corazón de la función)

Cada centro tiene **siempre los 12 ítems** del catálogo, cada uno con un `StockLevel`.
Al registrar un centro se **siembran los 12 en `NECESITA`**; el encargado los ajusta:

| Nivel | Color | Lectura para el donante |
|---|---|---|
| `URGENTE` | rojo | Falta ahora, traer con prioridad |
| `NECESITA` | ámbar | Hace falta (estado por defecto) |
| `SUFICIENTE` | verde | Tienen lo necesario, no urge |
| `SOBRADO` | gris | **Saturado — no traer más** |

`SOBRADO` es lo que evita sobre-cargar un solo ítem: el donante ve qué redirigir a otro
centro. La señal de fiabilidad es `lastStockUpdatedAt` ("actualizado hace X"); si la última
actualización supera **24 h** se muestra un aviso sutil de "información desactualizada"
(por defecto `NECESITA` haría que todo parezca pedido indefinidamente sin esta señal).

## API

Sigue el patrón existente (Hono `@hono/zod-openapi` → `services/centros.ts` →
`ServiceResult<T>` → `serialize`). Las respuestas públicas pasan por `toPublicCentro()`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/centros` | Público | Crea + siembra 12 ítems en `NECESITA` + genera `manageToken`. Zod + BotID + rate-limit por `ipHash`. → `201 { id, manageToken }` |
| `GET` | `/api/centros` | Público | Lista sanitizada, paginación por cursor, filtros `?supplyType=&level=&lat=&lng=&radius=`. El filtro por ítem/nivel hace join contra `CentroItem`. |
| `GET` | `/api/centros/[id]` | Público | Un centro sanitizado, con sus 12 ítems. |
| `PATCH` | `/api/centros/[id]` | **Token** | Actualiza campos operativos: `name`, `description`, `encargadoName`, `encargadoPhone`, `horario`, `photoUrl`, ubicación. |
| `PATCH` | `/api/centros/[id]/items` | **Token** | Actualiza niveles del semáforo (bulk). Bumpea `lastStockUpdatedAt`. |
| `POST` | `/api/centros/upload` | Público | Token de *client upload* a Vercel Blob (`image/*`, límite de tamaño). |

### Autorización por token (sin login)

Los `PATCH` exigen el `manageToken` del centro (cabecera `X-Manage-Token` o campo en el
cuerpo), comparado contra `Centro.manageToken`. Quien tiene el enlace puede editar; nadie
más. El token:

- Se genera al crear (aleatorio, alta entropía — p. ej. 32 bytes base64url).
- Se muestra **una vez** en la pantalla de éxito del registro y, de nuevo, **dentro de la
  propia página de gestión** (para que el encargado reabra su enlace).
- **Nunca** aparece en respuestas públicas (`toPublicCentro()` lo omite).
- No edita `verified` (eso queda para coordinadores cuando exista auth).

### Garantía de privacidad (invertida respecto a solicitudes)

A diferencia de los reportes, en un centro el **contacto del encargado es público** (existe
para recibir donantes). Lo que **nunca** debe salir en respuestas públicas es el
`manageToken` y el `ipHash`. `toPublicCentro()` los omite; una prueba automatizada falla si
`GET /api/centros` o `GET /api/centros/[id]` exponen `manageToken`.

## Páginas y componentes (estructura de modales ya establecida)

### `/centros` — Mapa público + descubrimiento
- `CentrosMap` (cliente, `dynamic ssr:false`): marcadores tipo **caja/almacén**,
  *clustering* (reusa el patrón de `reports-map-cluster`). Vista inicial en la zona afectada.
- `CentrosFilters`: el donante elige un **ítem** y ve qué centros lo tienen `URGENTE`/
  `NECESITA` y cuáles en `SOBRADO` (evitar). Resalta urgentes.
- Lista de respaldo renderizada en servidor si el mapa no carga.
- **CTA "Registrar centro"** → `RegistrarCentroButton` abre un **`Dialog` modal**
  (espeja `SolicitarAyudaButton`: bottom-sheet en mobile, centrado en desktop) con
  `<CentroForm>`.
- Tocar un marcador/ítem abre `CentroDetailsSheet`.

### `CentroDetailsSheet` — Ficha de detalle (`Sheet` lateral)
Espeja `ReportDetailsSheet`. Muestra: foto, nombre, "actualizado hace X" (+ aviso si
desactualizado), **semáforo completo de los 12 ítems**, ubicación con mini-mapa y "Cómo
llegar", descripción/horario, y **contacto del encargado** con botones **Llamar** y
**WhatsApp** (reusa `IconPhone`/`IconWhatsApp` y la lógica `tel:`/`wa.me`).

### `/centros/registrar` — Respaldo del formulario
Renderiza el mismo `<CentroForm>` que el modal (enlaces compartibles / sin JS), patrón de
tarjeta idéntico a `/reportar`.

### `CentroForm` — Registro (espeja `ReportForm`)
Secciones: **Ubicación** (`LocationPicker` + referencia), **Centro** (nombre, descripción,
horario), **Contacto del encargado** (nombre + teléfono — aquí marcado como **público**),
**Foto** (opcional, Vercel Blob), **¿Qué necesitan ahora?** (semáforo inicial con los 12
ítems; por defecto `NECESITA`). En éxito muestra el **enlace de gestión** con copiar +
compartir por WhatsApp.

### `/centros/[id]/gestionar?token=…` — Vista del encargado (sin login)
Página accedida por enlace directo. Valida el token; si es válido muestra
`CentroStockEditor` (semáforo editable de los 12 ítems con `Segmented`/chips de nivel) y la
edición de contacto/horario/descripción. Guarda vía los `PATCH` con token. Reitera el enlace
de gestión para reabrirlo. Si el token es inválido → mensaje y enlace a `/centros`.

### Componentes / utilidades compartidas
`StockChip` (semáforo de nivel), `supplyTypeLabel/order`, `stockLevelLabel/color/order`
(en `lib/labels.ts`), `LocationPicker`, `Field/Input/Textarea/Segmented/ToggleChip`,
`timeAgo`, badges, iconos — todos reutilizados.

## Manejo de la ubicación

Idéntico a solicitudes: pin arrastrable como fuente de verdad, "usar mi ubicación" (GPS con
`accuracyMeters`), buscador de zona vía Nominatim (1 req por búsqueda), referencia en texto
obligatoria, validación contra el bounding box de Venezuela, degradación elegante si fallan
tiles/Nominatim. (Sin sugeridor de duplicados en fase 1; opcional a futuro.)

## Anti-spam y abuso

- **Vercel BotID** en `POST /api/centros`.
- **Rate-limit por `ipHash`** (HMAC-SHA256 + secreto de servidor). Valor inicial propuesto:
  **3 centros por 10 minutos** por `ipHash` (registrar un centro es más raro que reportar).
- Los `PATCH` van protegidos por `manageToken`, no por `ipHash`.

## Foto del centro

Igual que la foto del lugar en solicitudes: opcional, Vercel Blob público, *client upload*
con token vía `/api/centros/upload`, solo `image/*` con límite de tamaño. Moderación de la
foto queda para cuando exista panel de coordinadores.

## Manejo de errores

- API: `400` (validación), `403` (BotID / token inválido en `PATCH`), `404` (centro
  inexistente), `429` (rate-limit), `500` (genérico).
- Formulario: errores inline por campo; degradación si falla GPS/Nominatim.
- Gestión: token inválido/ausente → pantalla clara con enlace a `/centros`.
- Mapa: si fallan los tiles, cae a la lista renderizada en servidor.

## Testing

- **Unitario:** esquemas Zod de centro; `toPublicCentro()` **omite `manageToken` e
  `ipHash`**; siembra de los 12 ítems en `NECESITA`.
- **Privacidad (crítico):** `GET /api/centros` y `GET /api/centros/[id]` nunca incluyen
  `manageToken` ni `ipHash` (sí incluyen el contacto, que es público).
- **Autorización por token:** `PATCH /api/centros/[id]` y `.../items` rechazan token
  ausente/incorrecto (`403`) y aceptan el correcto; al actualizar ítems se bumpea
  `lastStockUpdatedAt`.
- **API:** `POST` valida, crea y siembra ítems; `GET` filtra por `supplyType`+`level` y
  pagina por cursor; filtro geográfico por radio.
- **Fotos:** `/api/centros/upload` solo acepta `image/*` dentro del límite.

## Importación de CSV y campos de procedencia (cualquier fuente)

Para cargar directorios de centros desde CSVs de cualquier fuente, el modelo
`Centro` incorpora campos adicionales (solo columnas explícitas — sin JSON
catón, por decisión de producto):

- **Internacional:** `scope` (`CentroScope`: VENEZUELA | EXTERIOR), `country`,
  `state`, `city`. Muchos centros son de la **diáspora** (EE.UU., Colombia,
  España, Canadá…), así que la validación de coordenadas se **relajó a global**
  (`anyLatitude`/`anyLongitude`, −90..90 / −180..180) y el mapa de `/centros`
  es mundial (sin `maxBounds` a Venezuela). El registro manual marca
  `scope=VENEZUELA`, `country="Venezuela"` por defecto.
- **Qué recibe (texto libre):** `receivesNote` — las fuentes externas describen
  lo que aceptan en prosa; el semáforo estructurado (`CentroItem`) es la capa de
  enriquecimiento. Al importar se **siembran igualmente los 12 ítems en
  NECESITA** (consistencia con el registro manual).
- **Contacto flexible:** `encargadoName`/`encargadoPhone` ahora **opcionales**;
  se añaden `phone` (línea general) y `contactHandle` (@red social / nombre).
  La ficha usa el primero disponible (encargado → teléfono → handle).
- **Verificación:** `verificationsCount` (nº de confirmaciones de la fuente);
  `status=verificado` mapea a `verified=true`.
- **Vigencia:** `endsAt` (campañas con fecha de cierre).
- **Procedencia / idempotencia:** `source` + `externalId` con `@@unique`
  (`[source, externalId]`) para re-importar sin duplicar; `sourceHandle` (quién
  aportó/cura el registro).

**Importador:** `prisma/import-centros.ts` (`pnpm import:centros [archivo] [source]`,
por defecto `data/acopios.csv` / `acopios-csv`). Parser CSV propio (maneja comillas
y comas internas), `upsert` por `(source, externalId)` — crea con token + 12 ítems
NECESITA, o actualiza escalares sin tocar items ni `manageToken`. Filas sin
coordenadas o sin nombre/dirección se omiten.

## Decisiones abiertas / supuestos

- **Sin estado operativo** (abierto/lleno/cerrado) en fase 1, por decisión de producto: la
  señal es el semáforo. Si en terreno se necesita "cerrado", se añadiría un enum `status`.
- **Verificación** sin activar hasta que exista auth de coordinadores; el campo ya está.
- **Regeneración de token** (si el encargado lo pierde/filtra) fuera de alcance de fase 1;
  se mostrará dentro de `/gestionar`. A futuro lo manejaría un coordinador.
- Catálogo de 12 ítems ajustable según necesidades reales en terreno.
- Valores de rate-limit a afinar con tráfico real.
```
