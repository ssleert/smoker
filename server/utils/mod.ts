import { encodeHex } from "@std/encoding/hex";
import config from "@root/server/config/mod.ts";
import { cache } from "hono/cache";

export const itersForChunk = 100;
export const schedule = () => new Promise((resolve) => setTimeout(resolve));

export const hashPassword = async (password: string) => {
  const buf = new TextEncoder().encode(password + config.passwordSalt);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return encodeHex(hash);
};

export const genJwtPayload = (ulid: string, username: string) => {
  return {
    ulid: ulid,
    username: username,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // month
  };
};

export const getCacheMiddleware = () =>
  cache({
    cacheName: "smoke-that-shit",
    cacheControl: "max-age=30",
    wait: true,
  });

export type JwtPayload = ReturnType<typeof genJwtPayload>;
export type Variables = {
  jwtPayload: JwtPayload;
};
