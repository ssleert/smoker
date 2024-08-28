import server from "./server/mod.ts";

Deno.serve({
  cert: Deno.readTextFileSync("./certs/cert.pem"),
  key: Deno.readTextFileSync("./certs/key.pem"),
}, server.fetch);
