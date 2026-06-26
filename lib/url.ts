/**
 * URL base canónica del sitio.
 * En Vercel usa las variables de sistema; en local usa localhost:3000.
 */
export function getBaseUrl(): string {
  // Producción: dominio canónico configurado en Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // Preview / branches: URL automática de Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Desarrollo local
  return "http://localhost:3000";
}
