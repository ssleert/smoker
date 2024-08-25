import { Hono } from "hono";
import { sign } from "hono/jwt";
import { tbValidator } from "@hono/typebox-validator";
import { CredentialsDTOSchema, UserDTOSchema } from "@root/server/dto/mod.ts";
import getDb from "@root/server/db/mod.ts";
import config from "@root/server/config/mod.ts";
import { genJwtPayload, hashPassword } from "@root/server/utils/mod.ts";
import { Variables } from "@root/server/utils/mod.ts";
import { ulid } from "@std/ulid";

const app = new Hono<{ Variables: Variables }>();

app.post(
  "/create",
  tbValidator("form", UserDTOSchema),
  async (c) => {
    const db = await getDb();
    const user = c.req.valid("form");

    const _ulid = ulid();
    const u = {
      ulid: _ulid,
      username: user.username,
      email: user.email,
      passwordHash: await hashPassword(user.password),
      avatar: "__default_avatar__",
      date: new Date(),
    };

    const ok = await db.addUser(u);
    if (!ok) {
      return c.text("already exists", 409);
    }

    return c.text(_ulid);
  },
);

app.post(
  "/login",
  tbValidator("form", CredentialsDTOSchema),
  async (c) => {
    const db = await getDb();
    const creds = c.req.valid("form");

    const u = await db.getUserByEmail(creds.email);
    if (u == null) {
      return c.text("not found", 404);
    }

    const passwordHash = await hashPassword(creds.password);

    if (u.passwordHash != passwordHash) {
      return c.text("unauthorized", 401);
    }

    const jwtPayload = genJwtPayload(u.ulid, u.username);

    const token = await sign(jwtPayload, config.jwtSecret);

    return c.text(token);
  },
);

export default app;
