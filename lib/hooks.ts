import type { PublicReportDTO } from "@/lib/types";
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
