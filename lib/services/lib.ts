// ---------------------------------------------------------------------------
// Tipos de resultado
// ---------------------------------------------------------------------------

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };
