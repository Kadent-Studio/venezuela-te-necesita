import { QueryClient } from "@tanstack/react-query";

// Crea un QueryClient nuevo. Providers lo instancia una sola vez por montaje
// (useState), garantizando una caché por pestaña sin compartir datos entre
// usuarios en SSR.
export default function makeQueryClient() {
  return new QueryClient();
}
