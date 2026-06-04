function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function requiredEnv(name: string, fallback?: string) {
  const value = optionalEnv(name) ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requiredEnv(
    "DATABASE_URL",
    "postgres://seen:seen@localhost:5432/seen",
  ),
  redisUrl: optionalEnv("REDIS_URL") ?? "redis://localhost:6379",
  betterAuthSecret: requiredEnv(
    "BETTER_AUTH_SECRET",
    "dev-only-replace-with-a-long-random-secret",
  ),
  betterAuthUrl: requiredEnv("BETTER_AUTH_URL", "http://localhost:3000"),
  trustedOrigins: (optionalEnv("TRUSTED_ORIGINS") ?? "seen://,seen://*,exp://,exp://**")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  appleClientId: optionalEnv("APPLE_CLIENT_ID"),
  appleClientSecret: optionalEnv("APPLE_CLIENT_SECRET"),
  tmdbToken: optionalEnv("TMDB_TOKEN"),
  tmdbApiKey: optionalEnv("TMDB_API_KEY"),
  s3Endpoint: requiredEnv("S3_ENDPOINT", "http://localhost:9000"),
  s3Region: requiredEnv("S3_REGION", "us-east-1"),
  s3AccessKeyId: requiredEnv("S3_ACCESS_KEY_ID", "minio"),
  s3SecretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY", "minio-password"),
  s3AvatarsBucket: requiredEnv("S3_AVATARS_BUCKET", "seen-avatars"),
  s3PublicBaseUrl: requiredEnv("S3_PUBLIC_BASE_URL", "http://localhost:3000"),
};
