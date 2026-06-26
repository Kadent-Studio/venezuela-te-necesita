import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// Respuesta 400 con errores por campo, lista para consumir desde el formulario.
export function zodErrorResponse(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return NextResponse.json(
    { error: "Validación fallida", fieldErrors },
    { status: 400 },
  );
}

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}
