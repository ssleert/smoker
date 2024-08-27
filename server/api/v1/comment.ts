import { Hono } from "hono";
import { Variables } from "@root/server/utils/mod.ts";
import config from "@root/server/config/mod.ts";
import getDb from "@root/server/db/mod.ts";
import { jwt } from "hono/jwt";
import { ulid } from "@std/ulid";
import { tbValidator } from "@hono/typebox-validator";
import { CommentDTOSchema, VoteDTOSchema } from "@root/server/dto/mod.ts";
import { commentsArrayToGraph } from "@root/server/utils/conversions.ts";

const app = new Hono<{ Variables: Variables }>();

app.post(
  "/:ulid",
  jwt({ secret: config.jwtSecret }),
  tbValidator("form", CommentDTOSchema),
  async (c) => {
    const { ulid: postUlid } = c.req.param();
    const { ulid: userUlid } = c.get("jwtPayload");

    const input = c.req.valid("form");

    const db = await getDb();

    const _ulid = ulid();
    const ok = await db.addComment({
      ulid: _ulid,
      userUlid: userUlid,
      postUlid: postUlid,
      text: input.text,
      format: input.format,
      date: new Date(),
      votes: 0,
      replyes: 0,
      replyUlid: input.reply,
    });
    if (ok == null) {
      return c.notFound();
    }
    if (ok == false) {
      return c.text("comment transaction failed", 503, { "Retry-After": "1" });
    }

    return c.text(_ulid);
  },
);

app.get(
  "/:ulid",
  async (c) => {
    const { ulid: postUlid } = c.req.param();

    const db = await getDb();

    const comments = await db.getComments(postUlid);

    if (comments.length == 0) {
      return c.body(null, 204);
    }

    const userUlids = comments.map((c) => c.userUlid);

    const users = db.getUserAvatarAndUsername(userUlids);
    const commentsGraph = commentsArrayToGraph(comments);

    return c.json({
      comments: await commentsGraph,
      users: await users,
    });
  },
);

app.put(
  "/vote/:postUlid/:ulid",
  jwt({ secret: config.jwtSecret }),
  tbValidator("form", VoteDTOSchema),
  async (c) => {
    const { postUlid, ulid: commentUlid } = c.req.param();
    const { ulid: userUlid } = c.get("jwtPayload");
    const { type } = c.req.valid("form");

    const db = await getDb();

    const ok = await db.voteComment({
      userUlid,
      commentUlid,
      postUlid,
      voteType: type,
    });
    if (ok == null) {
      return c.notFound();
    }
    if (ok == false) {
      return c.text("vote transaction failed", 503, { "Retry-After": "1" });
    }

    return c.body(null, 204);
  },
);

export default app;
