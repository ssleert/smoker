import { Hono } from "hono";
import utils from "./utils.ts";
import user from "./user.ts";
import post from "./post.ts";

const app = new Hono();

app.route("/utils", utils);
app.route("/user", user);
app.route("/post", post);

export default app;
