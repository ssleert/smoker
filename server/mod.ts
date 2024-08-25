import { Hono } from "hono";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
//import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import api from "./api/mod.ts";

const app = new Hono();

app.use(logger());
app.use(compress());
app.use(cors());
//app.use(csrf());
app.use(secureHeaders());

app.route("/api", api);

export default app;
