// Re-export drizzle-orm operators/types from the db package so every consumer
// resolves the *same* physical drizzle-orm copy as the schema and client.
// Importing "drizzle-orm" directly from another workspace package can resolve a
// second physical copy (bun splits by optional-peer signature), which makes the
// `SQL`/`Column` nominal types incompatible and breaks typecheck.
export * from "drizzle-orm";
