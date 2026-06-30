import type { PublicCentroDTO, PublicReportDTO } from "@/lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import z from "zod";
import { client } from "./api/client";
import type { ListReportsQuerySchema } from "./api/contract";

// ---------------------------------------------------------------------------
// Claves de query
// ---------------------------------------------------------------------------
export const reportKeys = {
  all: ["reports"] as const,
  list: (filters?: z.input<typeof ListReportsQuerySchema>) =>
    ["reports", "list", filters] as const,
  map: () => ["reports", "map"] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    ["reports", "nearby", { lat, lng, radius }] as const,
  detail: (id: string) => ["reports", id] as const,
  stats: () => ["reports", "stats"] as const,
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
const PAGE_SIZE = 20;

async function fetchReports(
  cursor: string | null,
  filters?: Record<string, string>,
) {
  const res = await client.api.v1.reports.$get({
    query: {
      ...filters,
      limit: PAGE_SIZE,
      cursor: cursor ?? undefined,
    },
  });
  if (!res.ok) {
    throw new Error("Error al cargar reportes");
  }
  return res.json();
}

async function fetchMapReports(): Promise<PublicReportDTO[]> {
  const response = await client.api.v1.reports.$get({
    query: { limit: 50 },
  });
  if (!response.ok) throw new Error("Error al cargar reportes");
  const data = await response.json();
  return data.items;
}

async function fetchNearbyReports(lat: number, lng: number, radius: number) {
  const res = await client.api.v1.reports.nearby.$get({
    query: { lat, lng, radius },
  });
  if (!res.ok) throw new Error("Error al cargar reportes cercanos");
  const data = await res.json();
  return data.items;
}

async function fetchStats() {
  const res = await client.api.v1.reports.stats.$get();
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json();
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Feed con scroll infinito (cursor-based). */
export function useReportsFeed(filters?: Record<string, string>) {
  return useInfiniteQuery({
    queryKey: reportKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchReports(pageParam as string | null, filters),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Todos los reportes para el mapa (máx 50). */
export function useReportsMap() {
  return useQuery({
    queryKey: reportKeys.map(),
    queryFn: fetchMapReports,
  });
}

/** Reportes cercanos (sugeridor de duplicados). */
export function useNearbyReports(
  lat: number | null,
  lng: number | null,
  radius = 500,
) {
  return useQuery({
    queryKey: reportKeys.nearby(lat ?? 0, lng ?? 0, radius),
    queryFn: () => fetchNearbyReports(lat!, lng!, radius),
    enabled: lat !== null && lng !== null,
  });
}

/** Mutación para crear un reporte. */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = (await res.json()) as {
          error?: string;
          fieldErrors?: Record<string, string[]>;
        };
        throw err;
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

/** Estadísticas agregadas (totales, críticas, en atención, verificadas). */
export function useReportsStats() {
  return useQuery({
    queryKey: reportKeys.stats(),
    queryFn: fetchStats,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Centros de acopio
// ---------------------------------------------------------------------------

export const centroKeys = {
  all: ["centros"] as const,
  map: () => ["centros", "map"] as const,
  detail: (id: string) => ["centros", id] as const,
};

async function fetchCentrosMap(): Promise<PublicCentroDTO[]> {
  const res = await client.api.v1.centros.$get({ query: { limit: 50 } });
  if (!res.ok) throw new Error("Error al cargar centros");
  const data = await res.json();
  return data.items;
}

async function fetchCentro(id: string): Promise<PublicCentroDTO> {
  const res = await fetch(`/api/v1/centros/${id}`);
  if (!res.ok) throw new Error("Error al cargar el centro");
  return res.json() as Promise<PublicCentroDTO>;
}

/** Todos los centros para el mapa (máx 50). El filtro por ítem/nivel se aplica en cliente. */
export function useCentrosMap() {
  return useQuery({
    queryKey: centroKeys.map(),
    queryFn: fetchCentrosMap,
  });
}

/** Un centro por ID (lectura pública; usado por la página de gestión). */
export function useCentro(id: string | null) {
  return useQuery({
    queryKey: centroKeys.detail(id ?? ""),
    queryFn: () => fetchCentro(id!),
    enabled: id !== null,
  });
}

type FieldErrors = { error?: string; fieldErrors?: Record<string, string[]> };

/** Mutación para registrar un centro. Devuelve id + enlace de gestión. */
export function useCreateCentro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/centros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw (await res.json()) as FieldErrors;
      return res.json() as Promise<{ id: string; manageToken: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centroKeys.all });
    },
  });
}

/** Mutación para actualizar los niveles del semáforo (encargado, vía token). */
export function useUpdateCentroItems(id: string, token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Record<string, unknown>[]) => {
      const res = await fetch(`/api/centros/${id}/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Manage-Token": token,
        },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw (await res.json()) as FieldErrors;
      return res.json() as Promise<PublicCentroDTO>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(centroKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: centroKeys.map() });
    },
  });
}

/** Mutación para actualizar contacto/horario/datos del centro (encargado, vía token). */
export function useUpdateCentro(id: string, token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/centros/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Manage-Token": token,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw (await res.json()) as FieldErrors;
      return res.json() as Promise<PublicCentroDTO>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(centroKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: centroKeys.map() });
    },
  });
}
