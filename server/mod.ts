import { Hono } from "hono";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
//import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import api from "./api/mod.ts";
import { rateLimiter } from "hono-rate-limiter";

const app = new Hono();

app.use(rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (_) => crypto.randomUUID(),
}));
app.use(logger());
app.use(compress());
app.use(cors());
//app.use(csrf());
app.use(secureHeaders());

app.route("/api", api);

export default app;
