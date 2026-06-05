export function isUniqueViolation(error: unknown) {
  return error && typeof error === "object" && "code" in error && error.code === "23505";
}
