import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  PublicReportDTO,
  ReportListResponse,
  NearbyReport,
  StatsResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Claves de query
// ---------------------------------------------------------------------------
export const reportKeys = {
  all: ["reports"] as const,
  list: (filters?: Record<string, string>) =>
    ["reports", "list", filters] as const,
  map: () => ["reports", "map"] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    ["reports", "nearby", lat, lng, radius] as const,
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
): Promise<ReportListResponse> {
  const url = new URL("/api/reports", window.location.origin);
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (cursor) url.searchParams.set("cursor", cursor);
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar reportes");
  return res.json() as Promise<ReportListResponse>;
}

async function fetchMapReports(): Promise<PublicReportDTO[]> {
  const url = new URL("/api/reports", window.location.origin);
  url.searchParams.set("limit", "50");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar reportes");
  const data = (await res.json()) as ReportListResponse;
  return data.items;
}

async function fetchNearbyReports(
  lat: number,
  lng: number,
  radius: number,
): Promise<NearbyReport[]> {
  const url = new URL("/api/reports/nearby", window.location.origin);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radius", String(radius));
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar reportes cercanos");
  const data = (await res.json()) as { items: NearbyReport[] };
  return data.items;
}

async function fetchStats(): Promise<StatsResponse> {
  const url = new URL("/api/reports/stats", window.location.origin);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json() as Promise<StatsResponse>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Feed con scroll infinito (cursor-based). */
export function useReportsFeed(filters?: Record<string, string>) {
  return useInfiniteQuery({
    queryKey: reportKeys.list(filters),
    queryFn: ({ pageParam }) => fetchReports(pageParam as string | null, filters),
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
        const err = (await res.json()) as { error?: string; fieldErrors?: Record<string, string[]> };
        throw err;
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      // Invalida las listas para que refresquen al navegar de vuelta.
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
