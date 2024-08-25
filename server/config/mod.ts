export default {
  kvUrl: Deno.env.get("KV_URL"),
  passwordSalt: Deno.env.get("PASSWORD_SALT") ?? "salt",
  jwtSecret: Deno.env.get("JWT_SECRET") ?? "SeCrEt",
};
