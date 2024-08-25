import { Hono } from "hono";
import { jwt } from "hono/jwt";
import config from "@root/server/config/mod.ts";
import { Variables } from "@root/server/utils/mod.ts";

const app = new Hono<{ Variables: Variables }>();

app.get("/ok", (c) => c.text("ok!"));

app.get("/check_auth", jwt({ secret: config.jwtSecret }), (c) => {
  return c.json(c.get("jwtPayload"));
});

export default app;
