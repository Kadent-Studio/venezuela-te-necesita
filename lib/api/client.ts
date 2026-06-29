import { hc } from "hono/client";
import app from "./server";

export const client = hc<typeof app>(
  typeof window !== "undefined"
    ? window.location.origin
    : "",
);
