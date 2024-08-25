import { Hono } from "hono";
import v1 from "./v1/mod.ts";

const app = new Hono();

app.route("/v1", v1);

export default app;
