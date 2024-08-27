import { Hono } from "hono";
import utils from "./utils.ts";
import user from "./user.ts";
import post from "./post.ts";
import comment from "./comment.ts";

const app = new Hono();

app.route("/utils", utils);
app.route("/user", user);
app.route("/post", post);
app.route("/comment", comment);

export default app;
