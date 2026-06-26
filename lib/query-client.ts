import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// Singleton de QueryClient con alcance por request (evita compartir datos entre usuarios).
// cache() de React asegura que se cree una sola vez por request en Server Components.
const getQueryClient = cache(() => new QueryClient());
export default getQueryClient;
