import { Hono } from "hono";
import { Variables } from "@root/server/utils/mod.ts";
import config from "@root/server/config/mod.ts";
import getDb from "@root/server/db/mod.ts";
import { jwt } from "hono/jwt";
import { ulid } from "@std/ulid";
import { tbValidator } from "@hono/typebox-validator";
import { PostDTOSchema, VoteDTOSchema } from "@root/server/dto/mod.ts";

const app = new Hono<{ Variables: Variables }>();

app.post(
  "/create",
  tbValidator("form", PostDTOSchema),
  jwt({ secret: config.jwtSecret }),
  async (c) => {
    const { ulid: userUlid } = c.get("jwtPayload");

    const input = c.req.valid("form");

    const db = await getDb();

    const _ulid = ulid();
    const p = {
      ulid: _ulid,
      userUlid: userUlid,
      title: input.title,
      text: input.text,
      format: input.format,
      date: new Date(),
      votes: 0,
      comments: 0,
    };

    const res = await db.addPost(p);
    if (res == false) {
      return c.text("post creation error", 503, { "Retry-After": "1" });
    }

    return c.text(_ulid);
  },
);

app.get("/by_ulid/:ulid", async (c) => {
  const { ulid } = c.req.param();

  const db = await getDb();
  const p = await db.getPost(ulid);
  if (p == null) {
    return c.notFound();
  }

  return c.json(p);
});

app.get("/feed/:lastUlid", async (c) => {
  const { lastUlid } = c.req.param();

  const db = await getDb();
  const feed = await db.getFeed(lastUlid);

  return c.json(feed);
});

export default app;

app.put(
  "/vote/:ulid",
  jwt({ secret: config.jwtSecret }),
  tbValidator("form", VoteDTOSchema),
  async (c) => {
    const { ulid: postUlid } = c.req.param();
    const { ulid: userUlid } = c.get("jwtPayload");
    const { type } = c.req.valid("form");

    const db = await getDb();

    const ok = await db.votePost(userUlid, postUlid, type);
    if (ok == null) {
      return c.notFound();
    }
    if (ok == false) {
      return c.text("vote transaction failed", 503, { "Retry-After": "1" });
    }

    return c.body(null, 204);
  },
);

app.delete(
  "/vote/:ulid",
  jwt({ secret: config.jwtSecret }),
  async (c) => {
    const { ulid: postUlid } = c.req.param();
    const { ulid: userUlid } = c.get("jwtPayload");

    const db = await getDb();

    await db.delPostVote(postUlid, userUlid);

    return c.body(null, 204);
  },
);
