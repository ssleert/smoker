import server from "./server/mod.ts";

Deno.serve(server.fetch);
